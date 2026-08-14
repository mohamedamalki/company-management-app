<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CancelSaleReturnRequest;
use App\Http\Requests\StoreSaleReturnRequest;
use App\Http\Requests\UpdateSaleReturnRequest;
use App\Models\LocationStock;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SaleReturn;
use App\Models\SaleReturnItem;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class SaleReturnController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware(
                "can:sale-returns.view",
                only: ["index", "show", "options"],
            ),

            new Middleware(
                "can:sale-returns.manage",
                only: ["store", "update", "validateReturn", "cancel"],
            ),
        ];
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = min(max($request->integer("per_page", 15), 1), 100);

        $query = SaleReturn::query()
            ->with([
                "sale:id,sale_number,customer_id,total_ttc",
                "sale.customer:id,name,code,category",
                "location:id,name,code",
                "creator:id,name",
                "validator:id,name",
            ])
            ->withCount("items");

        $this->applyLocationScope($query, $request->user());

        $returns = $query
            ->when(
                $request->filled("status"),
                fn(Builder $query) => $query->where(
                    "status",
                    $request->input("status"),
                ),
            )
            ->when(
                $request->filled("refund_status"),
                fn(Builder $query) => $query->where(
                    "refund_status",
                    $request->input("refund_status"),
                ),
            )
            ->when($request->filled("search"), function (Builder $query) use (
                $request,
            ) {
                $search = trim($request->input("search"));

                $query->where(function (Builder $query) use ($search) {
                    $query
                        ->where("return_number", "like", "%{$search}%")
                        ->orWhereHas(
                            "sale",
                            fn(Builder $query) => $query->where(
                                "sale_number",
                                "like",
                                "%{$search}%",
                            ),
                        )
                        ->orWhereHas(
                            "sale.customer",
                            fn(Builder $query) => $query->where(
                                "name",
                                "like",
                                "%{$search}%",
                            ),
                        );
                });
            })
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        return response()->json($returns);
    }

    /**
     * Return eligible sales and the returnable items of one selected sale.
     */
/**
 * Return confirmed sales and the returnable
 * items of the selected sale.
 */
public function options(
    Request $request
): JsonResponse {
    $validated = $request->validate([
        'sale_id' => [
            'nullable',
            'integer',
            'exists:sales,id',
        ],

        'search' => [
            'nullable',
            'string',
            'max:100',
        ],
    ]);

    /*
    |--------------------------------------------------------------------------
    | Confirmed sales
    |--------------------------------------------------------------------------
    */

    $salesQuery = Sale::query()
        ->where(
            'status',
            Sale::STATUS_CONFIRMED
        );

    $this->applySaleLocationScope(
        $salesQuery,
        $request->user()
    );

    $sales = $salesQuery
        ->when(
            filled(
                $validated['search'] ?? null
            ),
            function (
                Builder $query
            ) use ($validated) {
                $search = trim(
                    $validated['search']
                );

                $query->where(
                    function (
                        Builder $query
                    ) use ($search) {
                        $query
                            ->where(
                                'sale_number',
                                'like',
                                "%{$search}%"
                            )
                            ->orWhereHas(
                                'customer',
                                function (
                                    Builder $query
                                ) use ($search) {
                                    $query->where(
                                        'name',
                                        'like',
                                        "%{$search}%"
                                    );
                                }
                            );
                    }
                );
            }
        )
        ->select([
            'id',
            'sale_number',
            'customer_id',
            'location_id',
            'sale_date',
            'total_ttc',
        ])
        ->with([
            'customer:id,name,code,category',
            'location:id,name,code',
        ])
        ->latest('sale_date')
        ->limit(100)
        ->get();

    /*
    |--------------------------------------------------------------------------
    | Selected sale
    |--------------------------------------------------------------------------
    */

    /** @var Sale|null $selectedSale */
    $selectedSale = null;

    /** @var \Illuminate\Support\Collection<int, array<string, mixed>> $returnableItems */
    $returnableItems = collect();

    if (!empty($validated['sale_id'])) {
        /*
         * whereKey()->firstOrFail() guarantees that
         * Intelephense recognizes one Sale model.
         */

        /** @var Sale $selectedSale */
        $selectedSale = Sale::query()
            ->whereKey(
                (int) $validated['sale_id']
            )
            ->with([
                'customer:id,name,code,category',
                'location:id,name,code',
                'items.product:id,name,reference,unit',
            ])
            ->firstOrFail();

        $this->ensureUserCanAccessLocation(
            $request->user(),
            (int) $selectedSale->location_id
        );

        if (
            $selectedSale->status !==
            Sale::STATUS_CONFIRMED
        ) {
            throw ValidationException::withMessages([
                'sale_id' => [
                    'Only confirmed sales can be returned.',
                ],
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Returnable items
        |--------------------------------------------------------------------------
        */

        $returnableItems = $selectedSale
            ->items
            ->map(
                function (
                    SaleItem $saleItem
                ): array {
                    $returnedQuantity =
                        $this
                            ->validatedReturnedQuantity(
                                $saleItem->id
                            );

                    $soldQuantity =
                        (float) $saleItem->quantity;

                    $returnableQuantity = max(
                        $soldQuantity -
                            $returnedQuantity,
                        0
                    );

                    return [
                        'id' => $saleItem->id,

                        'sale_item_id' =>
                            $saleItem->id,

                        'product_id' =>
                            $saleItem->product_id,

                        'product_name' =>
                            $saleItem->product_name,

                        'product_reference' =>
                            $saleItem
                                ->product_reference,

                        'unit' =>
                            $saleItem->unit,

                        'sold_quantity' =>
                            $soldQuantity,

                        'returned_quantity' =>
                            $returnedQuantity,

                        'returnable_quantity' =>
                            $returnableQuantity,

                        'unit_price_ht' =>
                            (float) $saleItem
                                ->unit_price_ht,

                        'discount_amount' =>
                            (float) $saleItem
                                ->discount_amount,

                        'tax_rate' =>
                            (float) $saleItem
                                ->tax_rate,

                        'total_ht' =>
                            (float) $saleItem
                                ->total_ht,

                        'tax_amount' =>
                            (float) $saleItem
                                ->tax_amount,

                        'total_ttc' =>
                            (float) $saleItem
                                ->total_ttc,
                    ];
                }
            )
            ->filter(
                fn (array $item): bool =>
                    $item['returnable_quantity'] > 0
            )
            ->values();
    }

    return response()->json([
        'data' => [
            'sales' => $sales,

            'selected_sale' =>
                $selectedSale,

            'returnable_items' =>
                $returnableItems,
        ],
    ]);
}

    public function store(StoreSaleReturnRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user();

        $saleReturn = DB::transaction(function () use ($data, $user) {
            $sale = Sale::query()
                ->lockForUpdate()
                ->findOrFail($data["sale_id"]);

            $this->ensureUserCanAccessLocation($user, $sale->location_id);

            if ($sale->status !== Sale::STATUS_CONFIRMED) {
                throw ValidationException::withMessages([
                    "sale_id" => "Only confirmed sales can be returned.",
                ]);
            }

            $saleReturn = SaleReturn::create([
                "return_number" => $this->generateReturnNumber(),
                "sale_id" => $sale->id,
                "location_id" => $sale->location_id,
                "created_by" => $user->id,
                "status" => SaleReturn::STATUS_DRAFT,
                "refund_status" => SaleReturn::REFUND_NOT_REQUIRED,
                "reason" => $data["reason"],
                "notes" => $data["notes"] ?? null,
            ]);

            $this->replaceItemsAndTotals($saleReturn, $sale, $data["items"]);

            return $saleReturn;
        });

        return response()->json(
            [
                "message" => "Sale return created successfully.",
                "data" => $this->loadReturn($saleReturn),
            ],
            201,
        );
    }

    public function show(Request $request, SaleReturn $saleReturn): JsonResponse
    {
        $this->ensureUserCanAccessLocation(
            $request->user(),
            $saleReturn->location_id,
        );

        return response()->json([
            "data" => $this->loadReturn($saleReturn),
        ]);
    }

    public function update(
        UpdateSaleReturnRequest $request,
        SaleReturn $saleReturn,
    ): JsonResponse {
        $data = $request->validated();
        $user = $request->user();

        $saleReturn = DB::transaction(function () use (
            $data,
            $user,
            $saleReturn,
        ) {
            $saleReturn = SaleReturn::query()
                ->lockForUpdate()
                ->findOrFail($saleReturn->id);

            if ($saleReturn->status !== SaleReturn::STATUS_DRAFT) {
                throw ValidationException::withMessages([
                    "status" => "Only draft returns can be updated.",
                ]);
            }

            $sale = Sale::query()
                ->lockForUpdate()
                ->findOrFail($saleReturn->sale_id);

            $this->ensureUserCanAccessLocation($user, $sale->location_id);

            $saleReturn->update([
                "reason" => $data["reason"],
                "notes" => $data["notes"] ?? null,
            ]);

            $this->replaceItemsAndTotals($saleReturn, $sale, $data["items"]);

            return $saleReturn;
        });

        return response()->json([
            "message" => "Sale return updated successfully.",
            "data" => $this->loadReturn($saleReturn),
        ]);
    }

    /**
     * Validate the return, restore sellable stock and update sale finances.
     */
    public function validateReturn(
        Request $request,
        SaleReturn $saleReturn,
    ): JsonResponse {
        $user = $request->user();

        $saleReturn = DB::transaction(function () use ($saleReturn, $user) {
            $saleReturn = SaleReturn::query()
                ->with("items")
                ->lockForUpdate()
                ->findOrFail($saleReturn->id);

            if ($saleReturn->status !== SaleReturn::STATUS_DRAFT) {
                throw ValidationException::withMessages([
                    "status" => "Only draft returns can be validated.",
                ]);
            }

            $sale = Sale::query()
                ->lockForUpdate()
                ->findOrFail($saleReturn->sale_id);

            $this->ensureUserCanAccessLocation($user, $sale->location_id);

            foreach ($saleReturn->items as $item) {
                $saleItem = SaleItem::query()
                    ->where("sale_id", $sale->id)
                    ->lockForUpdate()
                    ->findOrFail($item->sale_item_id);

                $alreadyReturned = $this->validatedReturnedQuantity(
                    $saleItem->id,
                    $saleReturn->id,
                );

                $availableToReturn = max(
                    (float) $saleItem->quantity - $alreadyReturned,
                    0,
                );

                if ((float) $item->quantity > $availableToReturn + 0.0005) {
                    throw ValidationException::withMessages([
                        "items" => [
                            "Only {$availableToReturn} {$saleItem->unit} of {$saleItem->product_name} can still be returned.",
                        ],
                    ]);
                }

                $restockQuantity = (float) $item->restock_quantity;

                if ($restockQuantity > 0) {
                    $stock = LocationStock::query()->firstOrCreate(
                        [
                            "location_id" => $sale->location_id,
                            "product_id" => $item->product_id,
                        ],
                        [
                            "quantity" => 0,
                            "minimum_quantity" => 0,
                        ],
                    );

                    $stock = LocationStock::query()
                        ->lockForUpdate()
                        ->findOrFail($stock->id);

                    $quantityBefore = (float) $stock->quantity;

                    $quantityAfter = $quantityBefore + $restockQuantity;

                    $stock->update([
                        "quantity" => $quantityAfter,
                    ]);

                    $saleReturn->stockMovements()->create([
                        "location_id" => $sale->location_id,
                        "product_id" => $item->product_id,
                        "user_id" => $user->id,
                        "type" => "sale_return_in",
                        "quantity" => $restockQuantity,
                        "quantity_before" => $quantityBefore,
                        "quantity_after" => $quantityAfter,
                        "notes" => "Generated from sale return {$saleReturn->return_number}.",
                    ]);
                }
            }

            $newReturnedAmount = round(
                (float) $sale->returned_amount + (float) $saleReturn->total_ttc,
                2,
            );

            if ($newReturnedAmount > (float) $sale->total_ttc + 0.01) {
                throw ValidationException::withMessages([
                    "total" =>
                        "The total returned amount cannot exceed the sale total.",
                ]);
            }

            $sale->update([
                "returned_amount" => $newReturnedAmount,
            ]);

            $this->refreshSalePaymentStatus($sale);

            $sale->refresh();

            $saleReturn->update([
                "status" => SaleReturn::STATUS_VALIDATED,
                "refund_status" =>
                    $this->saleRefundableAmount($sale) > 0
                        ? SaleReturn::REFUND_PENDING
                        : SaleReturn::REFUND_NOT_REQUIRED,
                "validated_by" => $user->id,
                "validated_at" => now(),
            ]);

            return $saleReturn;
        });

        return response()->json([
            "message" =>
                "Sale return validated and stock updated successfully.",
            "data" => $this->loadReturn($saleReturn),
        ]);
    }

    public function cancel(
        CancelSaleReturnRequest $request,
        SaleReturn $saleReturn,
    ): JsonResponse {
        $data = $request->validated();
        $user = $request->user();

        $saleReturn = DB::transaction(function () use (
            $data,
            $user,
            $saleReturn,
        ) {
            $saleReturn = SaleReturn::query()
                ->lockForUpdate()
                ->findOrFail($saleReturn->id);

            $this->ensureUserCanAccessLocation($user, $saleReturn->location_id);

            if ($saleReturn->status !== SaleReturn::STATUS_DRAFT) {
                throw ValidationException::withMessages([
                    "status" => "Only draft returns can be cancelled.",
                ]);
            }

            $saleReturn->update([
                "status" => SaleReturn::STATUS_CANCELLED,
                "cancelled_by" => $user->id,
                "cancelled_at" => now(),
                "cancellation_reason" => $data["cancellation_reason"],
            ]);

            return $saleReturn;
        });

        return response()->json([
            "message" => "Sale return cancelled successfully.",
            "data" => $this->loadReturn($saleReturn),
        ]);
    }

    private function replaceItemsAndTotals(
        SaleReturn $saleReturn,
        Sale $sale,
        array $items,
    ): void {
        $saleReturn->items()->delete();

        $subtotalHt = 0;
        $discountTotal = 0;
        $taxTotal = 0;
        $totalTtc = 0;

        foreach ($items as $index => $itemData) {
            $saleItem = SaleItem::query()
                ->where("sale_id", $sale->id)
                ->lockForUpdate()
                ->find($itemData["sale_item_id"]);

            if (!$saleItem) {
                throw ValidationException::withMessages([
                    "items.{$index}.sale_item_id" => "The selected item does not belong to this sale.",
                ]);
            }

            $alreadyReturned = $this->validatedReturnedQuantity(
                $saleItem->id,
                $saleReturn->id,
            );

            $availableToReturn = max(
                (float) $saleItem->quantity - $alreadyReturned,
                0,
            );

            $returnQuantity = (float) $itemData["quantity"];

            if ($returnQuantity > $availableToReturn + 0.0005) {
                throw ValidationException::withMessages([
                    "items.{$index}.quantity" => "Only {$availableToReturn} {$saleItem->unit} can still be returned.",
                ]);
            }

            $priorTotals = $this->validatedReturnedTotals(
                $saleItem->id,
                $saleReturn->id,
            );

            $isFinalReturn =
                abs($returnQuantity - $availableToReturn) <= 0.0005;

            if ($isFinalReturn) {
                $lineDiscount = round(
                    max(
                        (float) $saleItem->discount_amount -
                            $priorTotals["discount_amount"],
                        0,
                    ),
                    2,
                );

                $lineHt = round(
                    max(
                        (float) $saleItem->total_ht - $priorTotals["total_ht"],
                        0,
                    ),
                    2,
                );

                $taxAmount = round(
                    max(
                        (float) $saleItem->tax_amount -
                            $priorTotals["tax_amount"],
                        0,
                    ),
                    2,
                );

                $lineTtc = round(
                    max(
                        (float) $saleItem->total_ttc -
                            $priorTotals["total_ttc"],
                        0,
                    ),
                    2,
                );
            } else {
                $ratio = $returnQuantity / (float) $saleItem->quantity;

                $lineDiscount = round(
                    (float) $saleItem->discount_amount * $ratio,
                    2,
                );

                $lineHt = round((float) $saleItem->total_ht * $ratio, 2);

                $taxAmount = round((float) $saleItem->tax_amount * $ratio, 2);

                $lineTtc = round($lineHt + $taxAmount, 2);
            }

            $saleReturn->items()->create([
                "sale_item_id" => $saleItem->id,
                "product_id" => $saleItem->product_id,
                "quantity" => $returnQuantity,
                "restock_quantity" => $itemData["restock_quantity"],
                "damaged_quantity" => $itemData["damaged_quantity"],
                "product_name" => $saleItem->product_name,
                "product_reference" => $saleItem->product_reference,
                "unit" => $saleItem->unit,
                "unit_price_ht" => $saleItem->unit_price_ht,
                "discount_amount" => $lineDiscount,
                "tax_rate" => $saleItem->tax_rate,
                "total_ht" => $lineHt,
                "tax_amount" => $taxAmount,
                "total_ttc" => $lineTtc,
                "notes" => $itemData["notes"] ?? null,
            ]);

            $subtotalHt += $lineHt + $lineDiscount;
            $discountTotal += $lineDiscount;
            $taxTotal += $taxAmount;
            $totalTtc += $lineTtc;
        }

        $saleReturn->update([
            "subtotal_ht" => round($subtotalHt, 2),
            "discount_total" => round($discountTotal, 2),
            "tax_total" => round($taxTotal, 2),
            "total_ttc" => round($totalTtc, 2),
        ]);
    }

    private function validatedReturnedQuantity(
        int $saleItemId,
        ?int $exceptReturnId = null,
    ): float {
        return (float) SaleReturnItem::query()
            ->where("sale_item_id", $saleItemId)
            ->when(
                $exceptReturnId !== null,
                fn(Builder $query) => $query->where(
                    "sale_return_id",
                    "!=",
                    $exceptReturnId,
                ),
            )
            ->whereHas(
                "saleReturn",
                fn(Builder $query) => $query->where(
                    "status",
                    SaleReturn::STATUS_VALIDATED,
                ),
            )
            ->sum("quantity");
    }

    private function validatedReturnedTotals(
        int $saleItemId,
        ?int $exceptReturnId = null,
    ): array {
        $totals = SaleReturnItem::query()
            ->where("sale_item_id", $saleItemId)
            ->when(
                $exceptReturnId !== null,
                fn(Builder $query) => $query->where(
                    "sale_return_id",
                    "!=",
                    $exceptReturnId,
                ),
            )
            ->whereHas(
                "saleReturn",
                fn(Builder $query) => $query->where(
                    "status",
                    SaleReturn::STATUS_VALIDATED,
                ),
            )
            ->selectRaw("COALESCE(SUM(discount_amount), 0) as discount_amount")
            ->selectRaw("COALESCE(SUM(total_ht), 0) as total_ht")
            ->selectRaw("COALESCE(SUM(tax_amount), 0) as tax_amount")
            ->selectRaw("COALESCE(SUM(total_ttc), 0) as total_ttc")
            ->first();

        return [
            "discount_amount" => (float) ($totals?->discount_amount ?? 0),
            "total_ht" => (float) ($totals?->total_ht ?? 0),
            "tax_amount" => (float) ($totals?->tax_amount ?? 0),
            "total_ttc" => (float) ($totals?->total_ttc ?? 0),
        ];
    }

    private function refreshSalePaymentStatus(Sale $sale): void
    {
        $remainingAmount = $this->saleRemainingAmount($sale);

        $netPaidAmount = max(
            (float) $sale->paid_amount - (float) $sale->refunded_amount,
            0,
        );

        $paymentStatus = match (true) {
            $remainingAmount <= 0.009 => Sale::PAYMENT_PAID,

            $netPaidAmount <= 0.009 => Sale::PAYMENT_UNPAID,

            default => Sale::PAYMENT_PARTIALLY_PAID,
        };

        $sale->update([
            "payment_status" => $paymentStatus,
        ]);
    }

    private function saleRemainingAmount(Sale $sale): float
    {
        $netTotal = max(
            (float) $sale->total_ttc - (float) $sale->returned_amount,
            0,
        );

        $netPaid = max(
            (float) $sale->paid_amount - (float) $sale->refunded_amount,
            0,
        );

        return round(max($netTotal - $netPaid, 0), 2);
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

    private function applyLocationScope(Builder $query, User $user): void
    {
        if ($this->isAdmin($user)) {
            return;
        }

        $query->whereIn(
            "location_id",
            $user->assignedLocations()->select("locations.id"),
        );
    }

    private function applySaleLocationScope(Builder $query, User $user): void
    {
        if ($this->isAdmin($user)) {
            return;
        }

        $query->whereIn(
            "location_id",
            $user->assignedLocations()->select("locations.id"),
        );
    }

    private function isAdmin(User $user): bool
    {
        return $user->role === "admin" || $user->hasRole("admin");
    }

    private function generateReturnNumber(): string
    {
        do {
            $number =
                "RET-" .
                now()->format("Ymd-His") .
                "-" .
                Str::upper(Str::random(6));
        } while (
            SaleReturn::query()->where("return_number", $number)->exists()
        );

        return $number;
    }

    private function loadReturn(SaleReturn $saleReturn): SaleReturn
    {
        return $saleReturn->load([
            "sale:id,sale_number,customer_id,location_id,total_ttc,paid_amount,returned_amount,refunded_amount,payment_status",
            "sale.customer:id,name,code,category",
            "location:id,name,code",
            "creator:id,name",
            "validator:id,name",
            "canceller:id,name",
            "items.product:id,name,reference,unit",
            "refunds.paymentMethod:id,name,code",
            "refunds.refunder:id,name",
        ]);
    }
}
