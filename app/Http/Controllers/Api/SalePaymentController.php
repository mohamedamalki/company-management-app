<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSalePaymentRequest;
use App\Models\PaymentMethod;
use App\Models\Sale;
use App\Models\SalePayment;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
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
                    'outstanding',
                    'index',
                ]
            ),

            new Middleware(
                'can:sale-payments.manage',
                only: ['store']
            ),
        ];
    }

    /**
     * Return confirmed sales that still have an unpaid balance.
     */
    public function outstanding(Request $request): JsonResponse
    {
        $perPage = min(
            max($request->integer('per_page', 15), 1),
            100
        );

        $query = Sale::query()
            ->with([
                'customer:id,code,name,category',
                'location:id,name,code',
                'creator:id,name',
            ])
            ->withCount('items')
            ->where('status', Sale::STATUS_CONFIRMED)
            ->whereColumn('paid_amount', '<', 'total_ttc');

        $this->applyLocationScope(
            $query,
            $request->user()
        );

        $sales = $query
            ->when(
                $request->filled('payment_status'),
                fn (Builder $query) => $query->where(
                    'payment_status',
                    $request->input('payment_status')
                )
            )
            ->when(
                $request->filled('search'),
                function (Builder $query) use ($request) {
                    $search = trim(
                        $request->input('search')
                    );

                    $query->where(
                        function (Builder $query) use ($search) {
                            $query
                                ->where(
                                    'sale_number',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhereHas(
                                    'customer',
                                    fn (Builder $query) =>
                                        $query->where(
                                            'name',
                                            'like',
                                            "%{$search}%"
                                        )
                                );
                        }
                    );
                }
            )
            ->latest('sale_date')
            ->paginate($perPage)
            ->withQueryString();

        return response()->json($sales);
    }

    /**
     * Return one sale's payment history.
     */
    public function index(
        Request $request,
        Sale $sale
    ): JsonResponse {
        $this->ensureUserCanAccessLocation(
            $request->user(),
            $sale->location_id
        );

        $perPage = min(
            max($request->integer('per_page', 15), 1),
            100
        );

        $payments = $sale
            ->payments()
            ->with([
                'paymentMethod:id,name,code',
                'receiver:id,name',
            ])
            ->latest('paid_at')
            ->paginate($perPage);

        return response()->json([
            'sale' => $this->saleSummary($sale),

            'data' => $payments->items(),

            'meta' => [
                'current_page' =>
                    $payments->currentPage(),

                'last_page' =>
                    $payments->lastPage(),

                'per_page' =>
                    $payments->perPage(),

                'total' =>
                    $payments->total(),
            ],
        ]);
    }

    /**
     * Record another payment against a sale balance.
     */
    public function store(
        StoreSalePaymentRequest $request,
        Sale $sale
    ): JsonResponse {
        $data = $request->validated();
        $user = $request->user();

        $payment = DB::transaction(
            function () use ($sale, $data, $user) {
                $lockedSale = Sale::query()
                    ->lockForUpdate()
                    ->findOrFail($sale->id);

                $this->ensureUserCanAccessLocation(
                    $user,
                    $lockedSale->location_id
                );

                if (
                    $lockedSale->status !==
                    Sale::STATUS_CONFIRMED
                ) {
                    throw ValidationException::withMessages([
                        'sale' =>
                            'Payments can only be recorded for confirmed sales.',
                    ]);
                }

                $totalAmount = round(
                    (float) $lockedSale->total_ttc,
                    2
                );

                // Lock existing payment rows while calculating the balance.
                $recordedPaidAmount = round(
                    (float) $lockedSale
                        ->payments()
                        ->lockForUpdate()
                        ->get(['id', 'amount'])
                        ->sum('amount'),
                    2
                );

                $remainingAmount = round(
                    max(
                        $totalAmount - $recordedPaidAmount,
                        0
                    ),
                    2
                );

                if ($remainingAmount <= 0) {
                    throw ValidationException::withMessages([
                        'amount' =>
                            'This sale is already fully paid.',
                    ]);
                }

                $amount = round(
                    (float) $data['amount'],
                    2
                );

                if ($amount > $remainingAmount) {
                    throw ValidationException::withMessages([
                        'amount' =>
                            "The payment cannot exceed the remaining amount of {$remainingAmount} MAD.",
                    ]);
                }

                $paymentMethod = PaymentMethod::query()
                    ->where('status', 'active')
                    ->find($data['payment_method_id']);

                if (!$paymentMethod) {
                    throw ValidationException::withMessages([
                        'payment_method_id' =>
                            'The selected payment method is invalid or inactive.',
                    ]);
                }

                $reference = filled(
                    $data['reference'] ?? null
                )
                    ? trim($data['reference'])
                    : null;

                if (
                    (bool) $paymentMethod->requires_reference &&
                    !$reference
                ) {
                    throw ValidationException::withMessages([
                        'reference' =>
                            'The payment reference is required for this payment method.',
                    ]);
                }

                $payment = $lockedSale
                    ->payments()
                    ->create([
                        'payment_number' =>
                            $this->generatePaymentNumber(),

                        'payment_method_id' =>
                            $paymentMethod->id,

                        'received_by' => $user->id,

                        'amount' => $amount,

                        'reference' => $reference,

                        'paid_at' =>
                            $data['paid_at'] ?? now(),
                    ]);

                $newPaidAmount = round(
                    $recordedPaidAmount + $amount,
                    2
                );

                $paymentStatus =
                    $newPaidAmount >= $totalAmount
                        ? Sale::PAYMENT_PAID
                        : Sale::PAYMENT_PARTIALLY_PAID;

                $lockedSale->update([
                    'paid_amount' => $newPaidAmount,
                    'payment_status' => $paymentStatus,
                ]);

                return $payment;
            }
        );

        $sale->refresh();

        return response()->json([
            'message' =>
                'Payment recorded successfully.',

            'data' => [
                'payment' => $payment->load([
                    'paymentMethod:id,name,code',
                    'receiver:id,name',
                ]),

                'sale' => $this->saleSummary($sale),
            ],
        ], 201);
    }

    private function saleSummary(Sale $sale): array
    {
        $totalAmount = round(
            (float) $sale->total_ttc,
            2
        );

        $paidAmount = round(
            (float) $sale->paid_amount,
            2
        );

        return [
            'id' => $sale->id,
            'sale_number' => $sale->sale_number,
            'customer_id' => $sale->customer_id,
            'location_id' => $sale->location_id,
            'status' => $sale->status,
            'payment_status' =>
                $sale->payment_status,
            'total_ttc' => $totalAmount,
            'paid_amount' => $paidAmount,
            'remaining_amount' => round(
                max($totalAmount - $paidAmount, 0),
                2
            ),
        ];
    }

    private function applyLocationScope(
        Builder $query,
        User $user
    ): void {
        if ($this->isAdmin($user)) {
            return;
        }

        $query->whereIn(
            'location_id',
            $user
                ->assignedLocations()
                ->select('locations.id')
        );
    }

    private function ensureUserCanAccessLocation(
        User $user,
        int $locationId
    ): void {
        if ($this->isAdmin($user)) {
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

    private function isAdmin(User $user): bool
    {
        return $user->role === 'admin' ||
            $user->hasRole('admin');
    }

    private function generatePaymentNumber(): string
    {
        do {
            $number =
                'PAY-' .
                now()->format('Ymd-His') .
                '-' .
                Str::upper(Str::random(6));
        } while (
            SalePayment::query()
                ->where('payment_number', $number)
                ->exists()
        );

        return $number;
    }
}
