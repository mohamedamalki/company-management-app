<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSaleRefundRequest;
use App\Models\PaymentMethod;
use App\Models\Sale;
use App\Models\SaleRefund;
use App\Models\SaleReturn;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class SaleRefundController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware("can:sale-returns.view", only: ["index"]),

            new Middleware("can:sale-returns.manage", only: ["store"]),
        ];
    }

    public function index(
        Request $request,
        SaleReturn $saleReturn,
    ): JsonResponse {
        $this->ensureUserCanAccessLocation(
            $request->user(),
            $saleReturn->location_id,
        );

        $perPage = min(max($request->integer("per_page", 15), 1), 100);

        $refunds = $saleReturn
            ->refunds()
            ->with(["paymentMethod:id,name,code", "refunder:id,name"])
            ->latest("refunded_at")
            ->paginate($perPage);

        return response()->json([
            "sale_return" => $this->returnSummary($saleReturn),
            "data" => $refunds->items(),
            "meta" => [
                "current_page" => $refunds->currentPage(),
                "last_page" => $refunds->lastPage(),
                "per_page" => $refunds->perPage(),
                "total" => $refunds->total(),
            ],
        ]);
    }

    public function store(
        StoreSaleRefundRequest $request,
        SaleReturn $saleReturn,
    ): JsonResponse {
        $data = $request->validated();
        $user = $request->user();

        $refund = DB::transaction(function () use ($saleReturn, $data, $user) {
            $saleReturn = SaleReturn::query()
                ->lockForUpdate()
                ->findOrFail($saleReturn->id);

            if ($saleReturn->status !== SaleReturn::STATUS_VALIDATED) {
                throw ValidationException::withMessages([
                    "sale_return" => "Only validated returns can be refunded.",
                ]);
            }

            $sale = Sale::query()
                ->lockForUpdate()
                ->findOrFail($saleReturn->sale_id);

            $this->ensureUserCanAccessLocation($user, $sale->location_id);

            $returnRefundRemaining = round(
                max(
                    (float) $saleReturn->total_ttc -
                        (float) $saleReturn->refunded_amount,
                    0,
                ),
                2,
            );

            $saleRefundableAmount = $this->saleRefundableAmount($sale);

            $maximumRefund = round(
                min($returnRefundRemaining, $saleRefundableAmount),
                2,
            );

            if ($maximumRefund <= 0) {
                throw ValidationException::withMessages([
                    "amount" =>
                        "There is currently no refundable amount for this sale.",
                ]);
            }

            $amount = round((float) $data["amount"], 2);

            if ($amount > $maximumRefund) {
                throw ValidationException::withMessages([
                    "amount" => "The refund cannot exceed {$maximumRefund} MAD.",
                ]);
            }

            $paymentMethod = PaymentMethod::query()
                ->where("status", "active")
                ->find($data["payment_method_id"]);

            if (!$paymentMethod) {
                throw ValidationException::withMessages([
                    "payment_method_id" =>
                        "The selected payment method is invalid or inactive.",
                ]);
            }

            $reference = filled($data["reference"] ?? null)
                ? trim($data["reference"])
                : null;

            if ((bool) $paymentMethod->requires_reference && !$reference) {
                throw ValidationException::withMessages([
                    "reference" =>
                        "The refund reference is required for this payment method.",
                ]);
            }

            $refund = $saleReturn->refunds()->create([
                "refund_number" => $this->generateRefundNumber(),
                "sale_id" => $sale->id,
                "payment_method_id" => $paymentMethod->id,
                "refunded_by" => $user->id,
                "amount" => $amount,
                "reference" => $reference,
                "refunded_at" => $data["refunded_at"] ?? now(),
                "notes" => $data["notes"] ?? null,
            ]);

            $saleReturn->update([
                "refunded_amount" => round(
                    (float) $saleReturn->refunded_amount + $amount,
                    2,
                ),
            ]);

            $sale->update([
                "refunded_amount" => round(
                    (float) $sale->refunded_amount + $amount,
                    2,
                ),
            ]);

            $this->refreshSalePaymentStatus($sale);

            $sale->refresh();
            $saleReturn->refresh();

            $remainingRefundObligation = $this->saleRefundableAmount($sale);

            if ($remainingRefundObligation <= 0.009) {
                SaleReturn::query()
                    ->where("sale_id", $sale->id)
                    ->where("status", SaleReturn::STATUS_VALIDATED)
                    ->where("refunded_amount", ">", 0)
                    ->update([
                        "refund_status" => SaleReturn::REFUND_REFUNDED,
                    ]);

                SaleReturn::query()
                    ->where("sale_id", $sale->id)
                    ->where("status", SaleReturn::STATUS_VALIDATED)
                    ->where("refunded_amount", "<=", 0)
                    ->update([
                        "refund_status" => SaleReturn::REFUND_NOT_REQUIRED,
                    ]);
            } else {
                $saleReturn->update([
                    "refund_status" =>
                        (float) $saleReturn->refunded_amount > 0
                            ? SaleReturn::REFUND_PARTIALLY_REFUNDED
                            : SaleReturn::REFUND_PENDING,
                ]);
            }

            return $refund;
        });

        $saleReturn->refresh();

        return response()->json(
            [
                "message" => "Sale refund recorded successfully.",
                "data" => [
                    "refund" => $refund->load([
                        "paymentMethod:id,name,code",
                        "refunder:id,name",
                    ]),
                    "sale_return" => $this->returnSummary($saleReturn),
                ],
            ],
            201,
        );
    }

    private function returnSummary(SaleReturn $saleReturn): array
    {
        $saleReturn->loadMissing("sale");

        return [
            "id" => $saleReturn->id,
            "return_number" => $saleReturn->return_number,
            "sale_id" => $saleReturn->sale_id,
            "status" => $saleReturn->status,
            "refund_status" => $saleReturn->refund_status,
            "total_ttc" => (float) $saleReturn->total_ttc,
            "refunded_amount" => (float) $saleReturn->refunded_amount,
            "sale_refundable_amount" => $this->saleRefundableAmount(
                $saleReturn->sale,
            ),
        ];
    }

    private function refreshSalePaymentStatus(Sale $sale): void
    {
        $netTotal = max(
            (float) $sale->total_ttc - (float) $sale->returned_amount,
            0,
        );

        $netPaid = max(
            (float) $sale->paid_amount - (float) $sale->refunded_amount,
            0,
        );

        $remaining = max($netTotal - $netPaid, 0);

        $paymentStatus = match (true) {
            $remaining <= 0.009 => Sale::PAYMENT_PAID,

            $netPaid <= 0.009 => Sale::PAYMENT_UNPAID,

            default => Sale::PAYMENT_PARTIALLY_PAID,
        };

        $sale->update([
            "payment_status" => $paymentStatus,
        ]);
    }

    private function saleRefundableAmount(Sale $sale): float
    {
        $netTotal = max(
            (float) $sale->total_ttc - (float) $sale->returned_amount,
            0,
        );

        $netPaid = max(
            (float) $sale->paid_amount - (float) $sale->refunded_amount,
            0,
        );

        return round(max($netPaid - $netTotal, 0), 2);
    }

    private function ensureUserCanAccessLocation(
        User $user,
        int $locationId,
    ): void {
        if ($this->isAdmin($user)) {
            return;
        }

        $hasAccess = $user
            ->assignedLocations()
            ->whereKey($locationId)
            ->exists();

        abort_unless($hasAccess, 403, "You are not assigned to this location.");
    }

    private function isAdmin(User $user): bool
    {
        return $user->role === "admin" || $user->hasRole("admin");
    }

    private function generateRefundNumber(): string
    {
        do {
            $number =
                "REF-" .
                now()->format("Ymd-His") .
                "-" .
                Str::upper(Str::random(6));
        } while (
            SaleRefund::query()->where("refund_number", $number)->exists()
        );

        return $number;
    }
}
