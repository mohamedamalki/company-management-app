<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreExpensePaymentRequest;
use App\Models\Expense;
use App\Models\ExpensePayment;
use App\Models\PaymentMethod;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ExpensePaymentController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware("can:expenses.view", only: ["index"]),

            new Middleware("can:expenses.pay", only: ["store"]),
        ];
    }

    public function index(Request $request, Expense $expense): JsonResponse
    {
        $this->ensureLocationAccess($request->user(), $expense->location_id);

        $payments = $expense
            ->payments()
            ->with(["paymentMethod:id,name,code", "payer:id,name"])
            ->latest("paid_at")
            ->get();

        return response()->json([
            "data" => [
                "expense" => $expense->load([
                    "category:id,name,code",
                    "location:id,name,code",
                ]),

                "payments" => $payments,
            ],
        ]);
    }

    public function store(
        StoreExpensePaymentRequest $request,
        Expense $expense,
    ): JsonResponse {
        $data = $request->validated();
        $user = $request->user();

        [$expense, $payment] = DB::transaction(function () use (
            $data,
            $user,
            $expense,
        ) {
            $expense = Expense::query()
                ->lockForUpdate()
                ->findOrFail($expense->id);

            $this->ensureLocationAccess($user, $expense->location_id);

            if ($expense->status !== Expense::STATUS_APPROVED) {
                throw ValidationException::withMessages([
                    "status" => "Only approved expenses can receive payments.",
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
                        "A reference is required for this payment method.",
                ]);
            }

            $alreadyPaid = round(
                (float) $expense->payments()->sum("amount"),
                2,
            );

            $total = round((float) $expense->total_ttc, 2);

            $remaining = round(max($total - $alreadyPaid, 0), 2);

            $amount = round((float) $data["amount"], 2);

            if ($amount > $remaining + 0.005) {
                throw ValidationException::withMessages([
                    "amount" => "The payment cannot exceed the remaining amount of {$remaining} MAD.",
                ]);
            }

            $payment = $expense->payments()->create([
                "payment_number" => $this->generatePaymentNumber(),

                "payment_method_id" => $paymentMethod->id,

                "paid_by" => $user->id,
                "amount" => $amount,
                "reference" => $reference,

                "paid_at" => $data["paid_at"] ?? now(),

                "notes" => $data["notes"] ?? null,
            ]);

            $paidAmount = round((float) $expense->payments()->sum("amount"), 2);

            $paymentStatus = match (true) {
                $paidAmount <= 0 => Expense::PAYMENT_UNPAID,

                $paidAmount + 0.005 < $total => Expense::PAYMENT_PARTIALLY_PAID,

                default => Expense::PAYMENT_PAID,
            };

            $expense->update([
                "paid_amount" => min($paidAmount, $total),

                "payment_status" => $paymentStatus,
            ]);

            return [$expense, $payment];
        });

        return response()->json(
            [
                "message" => "Expense payment recorded successfully.",

                "data" => [
                    "expense" => $expense
                        ->fresh()
                        ->load([
                            "category:id,name,code",
                            "location:id,name,code",
                        ]),

                    "payment" => $payment->load([
                        "paymentMethod:id,name,code",
                        "payer:id,name",
                    ]),
                ],
            ],
            201,
        );
    }

    private function ensureLocationAccess(
        User $user,
        int|string|null $locationId,
    ): void {
        if ($this->isAdmin($user)) {
            return;
        }

        if (!$locationId) {
            abort(403, "Only administrators can access company-wide expenses.");
        }

        $hasAccess = $user
            ->assignedLocations()
            ->whereKey((int) $locationId)
            ->exists();

        abort_unless($hasAccess, 403, "You are not assigned to this location.");
    }

    private function isAdmin(User $user): bool
    {
        return $user->role === "admin" || $user->hasRole("admin");
    }

    private function generatePaymentNumber(): string
    {
        do {
            $number =
                "EPAY-" .
                now()->format("Ymd-His") .
                "-" .
                Str::upper(Str::random(6));
        } while (
            ExpensePayment::query()->where("payment_number", $number)->exists()
        );

        return $number;
    }
}
