<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePurchaseReceiptRequest;
use App\Http\Requests\UpdatePurchaseReceiptRequest;
use App\Http\Requests\ValidatePurchaseReceiptRequest;
use App\Models\LocationStock;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\PurchaseReceipt;
use App\Models\PurchaseReceiptItem;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PurchaseReceiptController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware(
                'can:purchase-receipts.view',
                only: [
                    'index',
                    'show',
                    'receivableOrders',
                ]
            ),

            new Middleware(
                'can:purchase-receipts.manage',
                only: [
                    'store',
                    'update',
                    'destroy',
                ]
            ),

            new Middleware(
                'can:purchase-receipts.validate',
                only: [
                    'validateReceipt',
                ]
            ),
        ];
    }

    public function index(
        Request $request
    ): JsonResponse {
        $perPage = min(
            max(
                (int) $request->input(
                    'per_page',
                    15
                ),
                1
            ),
            100
        );

        $query = PurchaseReceipt::query()
            ->with([
                'purchaseOrder.supplier',
                'location:id,name,code',
                'creator:id,name',
                'validator:id,name',
                'items.product:id,name,reference,unit',
            ]);

        $this->applyLocationScope(
            $query,
            $request->user()
        );

        $receipts = $query
            ->when(
                $request->filled('status'),
                fn (Builder $query) =>
                    $query->where(
                        'status',
                        $request->input('status')
                    )
            )
            ->when(
                $request->filled('location_id'),
                fn (Builder $query) =>
                    $query->where(
                        'location_id',
                        $request->integer(
                            'location_id'
                        )
                    )
            )
            ->when(
                $request->filled(
                    'purchase_order_id'
                ),
                fn (Builder $query) =>
                    $query->where(
                        'purchase_order_id',
                        $request->integer(
                            'purchase_order_id'
                        )
                    )
            )
            ->when(
                $request->filled('search'),
                fn (Builder $query) =>
                    $query->where(
                        'receipt_number',
                        'like',
                        '%' .
                        trim(
                            $request->input('search')
                        ) .
                        '%'
                    )
            )
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        return response()->json($receipts);
    }

    /**
     * Return purchase orders that can still receive products.
     */
/**
 * Return purchase orders that can still receive products.
 */
public function receivableOrders(
    Request $request
): JsonResponse {
    $query = PurchaseOrder::query()
        ->with([
            'supplier',
            'location:id,name,code',
            'items.product:id,name,reference,unit',
        ])
        ->where('status', 'ordered')
        ->whereHas('items')
        ->where(function (Builder $query) {
            $query
                ->whereNull('receiving_status')
                ->orWhereIn(
                    'receiving_status',
                    [
                        'pending',
                        'partially_received',
                    ]
                );
        });

    $this->applyLocationScope(
        $query,
        $request->user()
    );

    $orders = $query
        ->latest()
        ->limit(100)
        ->get();

    $orderItemIds = $orders
        ->flatMap(
            fn (PurchaseOrder $order) =>
                $order->items->pluck('id')
        )
        ->values();

    $acceptedByOrderItem =
        $orderItemIds->isEmpty()
            ? collect()
            : PurchaseReceiptItem::query()
                ->selectRaw(
                    'purchase_order_item_id,
                    SUM(accepted_quantity)
                    AS accepted_total'
                )
                ->whereIn(
                    'purchase_order_item_id',
                    $orderItemIds
                )
                ->whereHas(
                    'purchaseReceipt',
                    fn (Builder $query) =>
                        $query->where(
                            'status',
                            PurchaseReceipt::STATUS_VALIDATED
                        )
                )
                ->groupBy(
                    'purchase_order_item_id'
                )
                ->pluck(
                    'accepted_total',
                    'purchase_order_item_id'
                );

    $data = $orders
        ->map(function (
            PurchaseOrder $order
        ) use ($acceptedByOrderItem) {
            $items = $order->items
                ->map(function (
                    PurchaseOrderItem $item
                ) use ($acceptedByOrderItem) {
                    $orderedQuantity =
                        (float) $item->quantity;

                    $acceptedQuantity =
                        (float) (
                            $acceptedByOrderItem[
                                $item->id
                            ] ?? 0
                        );

                    $remainingQuantity = max(
                        $orderedQuantity -
                            $acceptedQuantity,
                        0
                    );

                    return [
                        'id' => $item->id,

                        'product_id' =>
                            $item->product_id,

                        'product' =>
                            $item->product,

                        'ordered_quantity' =>
                            $orderedQuantity,

                        'accepted_quantity' =>
                            $acceptedQuantity,

                        'remaining_quantity' =>
                            $remainingQuantity,
                    ];
                })
                ->filter(
                    fn (array $item) =>
                        $item[
                            'remaining_quantity'
                        ] > 0
                )
                ->values();

            return [
                'id' => $order->id,

                'order_number' =>
                    $order->order_number
                    ?? $order->reference
                    ?? "PO-{$order->id}",

                'status' => $order->status,

                'receiving_status' =>
                    $order->receiving_status
                    ?? 'pending',

                'supplier' =>
                    $order->supplier,

                'location' =>
                    $order->location,

                'items' => $items,
            ];
        })
        ->filter(
            fn (array $order) =>
                $order['items']->isNotEmpty()
        )
        ->values();

    return response()->json([
        'data' => $data,
    ]);
}

    public function store(
        StorePurchaseReceiptRequest $request
    ): JsonResponse {
        $data = $request->validated();
        $user = $request->user();

        $receipt = DB::transaction(
            function () use ($data, $user) {
                $purchaseOrder =
                    PurchaseOrder::query()
                        ->with('items')
                        ->lockForUpdate()
                        ->findOrFail(
                            $data['purchase_order_id']
                        );

                $this->ensurePurchaseOrderIsReceivable(
                    $purchaseOrder,
                    $user
                );

                $receipt =
                    PurchaseReceipt::create([
                        'receipt_number' =>
                            $this
                                ->generateReceiptNumber(),

                        'purchase_order_id' =>
                            $purchaseOrder->id,

                        'location_id' =>
                            $purchaseOrder->location_id,

                        'created_by' => $user->id,

                        'status' =>
                            PurchaseReceipt::STATUS_DRAFT,

                        'received_at' =>
                            $data['received_at']
                            ?? null,

                        'notes' =>
                            $data['notes']
                            ?? null,
                    ]);

                $this->createReceiptItems(
                    $receipt,
                    $purchaseOrder,
                    $data['items']
                );

                return $receipt;
            }
        );

        return response()->json([
            'message' =>
                'Purchase receipt created successfully.',

            'data' =>
                $this->loadReceipt($receipt),
        ], 201);
    }

    public function show(
        Request $request,
        PurchaseReceipt $purchaseReceipt
    ): JsonResponse {
        $this->ensureUserCanAccessLocation(
            $request->user(),
            $purchaseReceipt->location_id
        );

        return response()->json([
            'data' =>
                $this->loadReceipt(
                    $purchaseReceipt
                ),
        ]);
    }

    public function update(
        UpdatePurchaseReceiptRequest $request,
        PurchaseReceipt $purchaseReceipt
    ): JsonResponse {
        $data = $request->validated();
        $user = $request->user();

        $receipt = DB::transaction(
            function () use (
                $data,
                $user,
                $purchaseReceipt
            ) {
                $receipt =
                    PurchaseReceipt::query()
                        ->lockForUpdate()
                        ->findOrFail(
                            $purchaseReceipt->id
                        );

                if (
                    $receipt->status !==
                    PurchaseReceipt::STATUS_DRAFT
                ) {
                    throw ValidationException::withMessages([
                        'status' =>
                            'Only draft purchase receipts can be updated.',
                    ]);
                }

                $purchaseOrder =
                    PurchaseOrder::query()
                        ->with('items')
                        ->lockForUpdate()
                        ->findOrFail(
                            $data['purchase_order_id']
                        );

                $this->ensurePurchaseOrderIsReceivable(
                    $purchaseOrder,
                    $user
                );

                $receipt->update([
                    'purchase_order_id' =>
                        $purchaseOrder->id,

                    'location_id' =>
                        $purchaseOrder->location_id,

                    'received_at' =>
                        $data['received_at']
                        ?? null,

                    'notes' =>
                        $data['notes']
                        ?? null,
                ]);

                $receipt->items()->delete();

                $this->createReceiptItems(
                    $receipt,
                    $purchaseOrder,
                    $data['items']
                );

                return $receipt;
            }
        );

        return response()->json([
            'message' =>
                'Purchase receipt updated successfully.',

            'data' =>
                $this->loadReceipt($receipt),
        ]);
    }

    /**
     * Validate receipt and increase stock.
     */
    public function validateReceipt(
        ValidatePurchaseReceiptRequest $request,
        PurchaseReceipt $purchaseReceipt
    ): JsonResponse {
        $user = $request->user();

        $receipt = DB::transaction(
            function () use (
                $purchaseReceipt,
                $user
            ) {
                $receipt =
                    PurchaseReceipt::query()
                        ->lockForUpdate()
                        ->findOrFail(
                            $purchaseReceipt->id
                        );

                if (
                    $receipt->status !==
                    PurchaseReceipt::STATUS_DRAFT
                ) {
                    throw ValidationException::withMessages([
                        'status' =>
                            'Only a draft purchase receipt can be validated.',
                    ]);
                }

                $this->ensureUserCanAccessLocation(
                    $user,
                    $receipt->location_id
                );

                $purchaseOrder =
                    PurchaseOrder::query()
                        ->lockForUpdate()
                        ->findOrFail(
                            $receipt->purchase_order_id
                        );

                if (
                        $purchaseOrder->status !==
                        'ordered'
                    ) {
                        throw ValidationException::withMessages([
                            'purchase_order_id' =>
                                'The purchase order must be ordered before receiving products.',
                        ]);
                    }

                if (
                    $purchaseOrder->receiving_status ===
                    'received'
                ) {
                    throw ValidationException::withMessages([
                        'purchase_order_id' =>
                            'This purchase order has already been received completely.',
                    ]);
                }

                $receipt->load('items');

                foreach (
                    $receipt->items
                    as $receiptItem
                ) {
                    $orderItem =
                        PurchaseOrderItem::query()
                            ->where(
                                'purchase_order_id',
                                $purchaseOrder->id
                            )
                            ->lockForUpdate()
                            ->findOrFail(
                                $receiptItem
                                    ->purchase_order_item_id
                            );

                    $alreadyAccepted = (float)
                        PurchaseReceiptItem::query()
                            ->where(
                                'purchase_order_item_id',
                                $orderItem->id
                            )
                            ->whereHas(
                                'purchaseReceipt',
                                fn (Builder $query) =>
                                    $query->where(
                                        'status',
                                        PurchaseReceipt::STATUS_VALIDATED
                                    )
                            )
                            ->sum(
                                'accepted_quantity'
                            );

                    $remaining = max(
                        (float) $orderItem->quantity -
                        $alreadyAccepted,
                        0
                    );

                    $acceptedNow = (float)
                        $receiptItem
                            ->accepted_quantity;

                    if (
                        $acceptedNow >
                        $remaining + 0.0005
                    ) {
                        throw ValidationException::withMessages([
                            'items' => [
                                "Accepted quantity for product {$orderItem->product_id} exceeds the remaining quantity ({$remaining}).",
                            ],
                        ]);
                    }

                    if ($acceptedNow <= 0) {
                        continue;
                    }

                    $stock =
                        LocationStock::firstOrCreate(
                            [
                                'location_id' =>
                                    $receipt->location_id,

                                'product_id' =>
                                    $orderItem->product_id,
                            ],
                            [
                                'quantity' => 0,

                                'minimum_quantity' =>
                                    0,
                            ]
                        );

                    $stock =
                        LocationStock::query()
                            ->lockForUpdate()
                            ->findOrFail(
                                $stock->id
                            );

                    $quantityBefore =
                        (float) $stock->quantity;

                    $quantityAfter =
                        $quantityBefore +
                        $acceptedNow;

                    $stock->quantity =
                        $quantityAfter;

                    $stock->save();

                    $receipt
                        ->stockMovements()
                        ->create([
                            'location_id' =>
                                $receipt->location_id,

                            'product_id' =>
                                $orderItem->product_id,

                            'user_id' => $user->id,

                            'type' =>
                                'purchase_receipt',

                            'quantity' =>
                                $acceptedNow,

                            'quantity_before' =>
                                $quantityBefore,

                            'quantity_after' =>
                                $quantityAfter,

                            'notes' =>
                                "Generated from purchase receipt {$receipt->receipt_number}.",
                        ]);
                }

                $receipt->status =
                    PurchaseReceipt::STATUS_VALIDATED;

                $receipt->validated_by =
                    $user->id;

                $receipt->validated_at = now();

                if (!$receipt->received_at) {
                    $receipt->received_at = now();
                }

                $receipt->save();

                $this
                    ->updatePurchaseOrderReceivingStatus(
                        $purchaseOrder
                    );

                return $receipt;
            }
        );

        return response()->json([
            'message' =>
                'Purchase receipt validated and stock updated successfully.',

            'data' =>
                $this->loadReceipt($receipt),
        ]);
    }

    public function destroy(
        Request $request,
        PurchaseReceipt $purchaseReceipt
    ): JsonResponse {
        $this->ensureUserCanAccessLocation(
            $request->user(),
            $purchaseReceipt->location_id
        );

        if (
            $purchaseReceipt->status !==
            PurchaseReceipt::STATUS_DRAFT
        ) {
            throw ValidationException::withMessages([
                'status' =>
                    'Only draft purchase receipts can be deleted.',
            ]);
        }

        $purchaseReceipt->delete();

        return response()->json([
            'message' =>
                'Purchase receipt deleted successfully.',
        ]);
    }

    private function createReceiptItems(
        PurchaseReceipt $receipt,
        PurchaseOrder $purchaseOrder,
        array $items
    ): void {
        $orderItems =
            $purchaseOrder
                ->items
                ->keyBy('id');

        foreach (
            $items as $index => $item
        ) {
            $orderItem = $orderItems->get(
                (int) $item[
                    'purchase_order_item_id'
                ]
            );

            if (!$orderItem) {
                throw ValidationException::withMessages([
                    "items.{$index}.purchase_order_item_id" =>
                        'This item does not belong to the selected purchase order.',
                ]);
            }

            $receipt->items()->create([
                'purchase_order_item_id' =>
                    $orderItem->id,

                'product_id' =>
                    $orderItem->product_id,

                'received_quantity' =>
                    $item['received_quantity'],

                'accepted_quantity' =>
                    $item['accepted_quantity'],

                'rejected_quantity' =>
                    $item['rejected_quantity'],

                'notes' =>
                    $item['notes'] ?? null,
            ]);
        }
    }

    private function updatePurchaseOrderReceivingStatus(
        PurchaseOrder $purchaseOrder
    ): void {
        $orderedQuantity = (float)
            $purchaseOrder
                ->items()
                ->sum('quantity');

        $acceptedQuantity = (float)
            PurchaseReceiptItem::query()
                ->whereHas(
                    'purchaseReceipt',
                    fn (Builder $query) =>
                        $query
                            ->where(
                                'purchase_order_id',
                                $purchaseOrder->id
                            )
                            ->where(
                                'status',
                                PurchaseReceipt::STATUS_VALIDATED
                            )
                )
                ->sum('accepted_quantity');

        $purchaseOrder->receiving_status =
            match (true) {
                $acceptedQuantity <= 0 =>
                    'pending',

                $acceptedQuantity + 0.0005 >=
                    $orderedQuantity =>
                    'received',

                default =>
                    'partially_received',
            };

        $purchaseOrder->save();
    }

private function ensurePurchaseOrderIsReceivable(
    PurchaseOrder $purchaseOrder,
    User $user
): void {
    if (!$purchaseOrder->location_id) {
        throw ValidationException::withMessages([
            'purchase_order_id' =>
                'The purchase order must have a destination location.',
        ]);
    }

    $this->ensureUserCanAccessLocation(
        $user,
        $purchaseOrder->location_id
    );

    if (
        $purchaseOrder->status !==
        'ordered'
    ) {
        throw ValidationException::withMessages([
            'purchase_order_id' =>
                'Only ordered purchase orders can be received.',
        ]);
    }

    if (
        $purchaseOrder->receiving_status ===
        'received'
    ) {
        throw ValidationException::withMessages([
            'purchase_order_id' =>
                'This purchase order has already been received completely.',
        ]);
    }

    /*
     * Existing orders created before receiving_status
     * was added may contain null.
     */
    if (!$purchaseOrder->receiving_status) {
        $purchaseOrder->receiving_status =
            'pending';

        $purchaseOrder->save();
    }
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

    private function isAdmin(
        User $user
    ): bool {
        return $user->role === 'admin' ||
            $user->hasRole('admin');
    }

    private function generateReceiptNumber(): string
    {
        return 'PR-' .
            now()->format('Ymd-His') .
            '-' .
            Str::upper(
                Str::random(6)
            );
    }

    private function loadReceipt(
        PurchaseReceipt $receipt
    ): PurchaseReceipt {
        return $receipt->load([
            'purchaseOrder.supplier',
            'location:id,name,code',
            'creator:id,name',
            'validator:id,name',
            'items.product:id,name,reference,unit',
        ]);
    }
}
