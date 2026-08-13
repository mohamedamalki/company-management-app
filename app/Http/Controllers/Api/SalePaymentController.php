<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSalePaymentRequest;
use App\Models\PaymentMethod;
use App\Models\Sale;
use App\Models\SalePayment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class SalePaymentController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware(
                'can:sale-payments.view',
                only: [
                    'index',
                ]
            ),

            new Middleware(
                'can:sale-payments.manage',
                only: [
                    'store',
                ]
            ),
        ];
    }

    public function index(
        Request $request,
        Sale $sale
    ): JsonResponse {
        $this->ensureUserCanAccessLocation(
            $request->user(),
            $sale->location_id
        );

        $payments = $sale
            ->payments()
            ->with([
                'paymentMethod:id,name,code',
                'receiver:id,name',
            ])
            ->latest('paid_at')
            ->get();

        return response()->json([
            'data' => $payments,
        ]);
    }

    public function store(
        StoreSalePaymentRequest $request,
        Sale $sale
    ): JsonResponse {
        $data = $request->validated();
        $user = $request->user();

        $payment = DB::transaction(
            function () use (
                $data,
                $user,
                $sale
            ) {
                $sale = Sale::query()
                    ->lockForUpdate()
                    ->findOrFail($sale->id);

                $this
                    ->ensureUserCanAccessLocation(
                        $user,
                        $sale->location_id
                    );

                if (
                    $sale->status !==
                    Sale::STATUS_CONFIRMED
                ) {
                    throw ValidationException::withMessages([
                        'sale' =>
                            'Payments can only be recorded for confirmed sales.',
                    ]);
                }

                $paymentMethod =
                    PaymentMethod::query()
                        ->where(
                            'status',
                            'active'
                        )
                        ->findOrFail(
                            $data[
                                'payment_method_id'
                            ]
                        );

                if (
                    $paymentMethod
                        ->requires_reference &&
                    empty($data['reference'])
                ) {
                    throw ValidationException::withMessages([
                        'reference' =>
                            'A reference is required for this payment method.',
                    ]);
                }

                $currentPaid = (float)
                    $sale
                        ->payments()
                        ->sum('amount');

                $remaining = max(
                    (float)
                        $sale->total_ttc -
                        $currentPaid,
                    0
                );

                $amount =
                    (float) $data['amount'];

                if (
                    $amount >
                    $remaining + 0.005
                ) {
                    throw ValidationException::withMessages([
                        'amount' =>
                            "The payment exceeds the remaining amount ({$remaining} MAD).",
                    ]);
                }

                $payment =
                    $sale->payments()->create([
                        'payment_number' =>
                            $this
                                ->generatePaymentNumber(),

                        'payment_method_id' =>
                            $paymentMethod->id,

                        'received_by' =>
                            $user->id,

                        'amount' =>
                            $amount,

                        'reference' =>
                            $data['reference']
                            ?? null,

                        'paid_at' =>
                            $data['paid_at']
                            ?? now(),

                        'notes' =>
                            $data['notes']
                            ?? null,
                    ]);

                $this
                    ->updateSalePaymentStatus(
                        $sale
                    );

                return $payment;
            }
        );

        return response()->json([
            'message' =>
                'Payment recorded successfully.',

            'data' => $payment->load([
                'paymentMethod:id,name,code',
                'receiver:id,name',
            ]),
        ], 201);
    }

    private function updateSalePaymentStatus(
        Sale $sale
    ): void {
        $paidAmount = (float)
            $sale
                ->payments()
                ->sum('amount');

        $totalTtc =
            (float) $sale->total_ttc;

        $sale->paid_amount =
            round($paidAmount, 2);

        $sale->payment_status =
            match (true) {
                $paidAmount <= 0 =>
                    Sale::PAYMENT_UNPAID,

                $paidAmount + 0.005 >=
                    $totalTtc =>
                    Sale::PAYMENT_PAID,

                default =>
                    Sale::PAYMENT_PARTIALLY_PAID,
            };

        $sale->save();
    }

    private function ensureUserCanAccessLocation(
        User $user,
        int $locationId
    ): void {
        if (
            $user->role === 'admin' ||
            $user->hasRole('admin')
        ) {
            return;
        }

        $hasAccess = $user
            ->assignedLocations()
            ->whereKey($locationId)
            ->exists();

        abort_unless(
            $hasAccess,
            403,
            'You are not assigned to this location.'
        );
    }

    private function generatePaymentNumber(): string
    {
        return 'PAY-' .
            now()->format('Ymd-His') .
            '-' .
            Str::upper(
                Str::random(6)
            );
    }
}
