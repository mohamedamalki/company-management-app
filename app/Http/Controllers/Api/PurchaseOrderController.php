<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePurchaseOrderRequest;
use App\Http\Requests\UpdatePurchaseOrderRequest;
use App\Models\LocationAssignment;
use App\Models\PurchaseOrder;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class PurchaseOrderController extends Controller implements HasMiddleware
{
    public static function middleware(): array
{
    return [
        new Middleware(
            'can:purchase-orders.view',
            only: [
                'index',
                'show',
                'pdf',
            ]
        ),

        new Middleware(
            'can:purchase-orders.manage',
            only: [
                'store',
                'update',
            ]
        ),

        new Middleware(
            'can:purchase-orders.confirm',
            only: ['confirm']
        ),

        new Middleware(
            'can:purchase-orders.cancel',
            only: ['cancel']
        ),
    ];
}
    public function index(
        Request $request
    ): JsonResponse {
        $user = $request->user();

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

        $purchaseOrders =
            PurchaseOrder::query()
                ->with([
                    'supplier:id,name,code',
                    'location:id,name,code',
                    'createdBy:id,name',
                ])
                ->withCount('items')
                ->when(
                    $user->role === 'responsable',
                    function ($query) use ($user) {
                        $query->whereIn(
                            'location_id',

                            LocationAssignment::query()
                                ->select('location_id')
                                ->where(
                                    'user_id',
                                    $user->id
                                )
                        );
                    }
                )
                ->when(
                    $request->filled('status'),
                    fn ($query) => $query->where(
                        'status',
                        $request->input('status')
                    )
                )
                ->when(
                    $request->filled('supplier_id'),
                    fn ($query) => $query->where(
                        'supplier_id',
                        $request->integer(
                            'supplier_id'
                        )
                    )
                )
                ->when(
                    $request->filled('location_id'),
                    fn ($query) => $query->where(
                        'location_id',
                        $request->integer(
                            'location_id'
                        )
                    )
                )
                ->when(
                    $request->filled('search'),
                    function ($query) use ($request) {
                        $search = trim(
                            $request->input('search')
                        );

                        $query->where(
                            function ($query) use ($search) {
                                $query
                                    ->where(
                                        'order_number',
                                        'like',
                                        "%{$search}%"
                                    )
                                    ->orWhereHas(
                                        'supplier',
                                        fn ($query) =>
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
                ->latest('order_date')
                ->latest('id')
                ->paginate($perPage);

        return response()->json(
            $purchaseOrders
        );
    }

    public function store(
        StorePurchaseOrderRequest $request
    ): JsonResponse {
        $this->ensureLocationAccess(
            $request,
            $request->integer('location_id')
        );

        $purchaseOrder = DB::transaction(
            function () use ($request) {
                $data = $request->validated();

                $calculated =
                    $this->calculateItems(
                        $data['items']
                    );

                unset($data['items']);

                $purchaseOrder =
                    PurchaseOrder::create([
                        ...$data,

                        'order_number' =>
                            $this->generateOrderNumber(),

                        'created_by' =>
                            $request->user()->id,

                        'status' =>
                            $data['status'] ?? 'draft',

                        'subtotal_ht' =>
                            $calculated[
                                'subtotal_ht'
                            ],

                        'tax_amount' =>
                            $calculated[
                                'tax_amount'
                            ],

                        'total_ttc' =>
                            $calculated[
                                'total_ttc'
                            ],
                    ]);

                $purchaseOrder
                    ->items()
                    ->createMany(
                        $calculated['items']
                    );

                return $purchaseOrder;
            }
        );

        return response()->json([
            'message' =>
                'Purchase order created successfully.',

            'data' =>
                $this->loadRelations(
                    $purchaseOrder
                ),
        ], 201);
    }

    public function show(
        Request $request,
        PurchaseOrder $purchaseOrder
    ): JsonResponse {
        $this->ensureLocationAccess(
            $request,
            $purchaseOrder->location_id
        );

        return response()->json([
            'data' =>
                $this->loadRelations(
                    $purchaseOrder
                ),
        ]);
    }

    public function update(
        UpdatePurchaseOrderRequest $request,
        PurchaseOrder $purchaseOrder
    ): JsonResponse {
        if (
            $purchaseOrder->status !== 'draft'
        ) {
            return response()->json([
                'message' =>
                    'Only draft orders can be updated.',
            ], 422);
        }

        $this->ensureLocationAccess(
            $request,
            $request->integer('location_id')
        );

        $purchaseOrder = DB::transaction(
            function () use (
                $request,
                $purchaseOrder
            ) {
                $data = $request->validated();

                $calculated =
                    $this->calculateItems(
                        $data['items']
                    );

                unset($data['items']);

                $purchaseOrder->update([
                    ...$data,

                    'subtotal_ht' =>
                        $calculated[
                            'subtotal_ht'
                        ],

                    'tax_amount' =>
                        $calculated[
                            'tax_amount'
                        ],

                    'total_ttc' =>
                        $calculated[
                            'total_ttc'
                        ],
                ]);

                /*
                 * Replace the old draft items
                 * with the corrected items.
                 */
                $purchaseOrder
                    ->items()
                    ->delete();

                $purchaseOrder
                    ->items()
                    ->createMany(
                        $calculated['items']
                    );

                return $purchaseOrder->fresh();
            }
        );

        return response()->json([
            'message' =>
                'Purchase order updated successfully.',

            'data' =>
                $this->loadRelations(
                    $purchaseOrder
                ),
        ]);
    }

    public function cancel(
        Request $request,
        PurchaseOrder $purchaseOrder
    ): JsonResponse {
        $this->ensureLocationAccess(
            $request,
            $purchaseOrder->location_id
        );

        if (
            in_array(
                $purchaseOrder->status,
                [
                    'received',
                    'cancelled',
                ],
                true
            )
        ) {
            return response()->json([
                'message' =>
                    'This order cannot be cancelled.',
            ], 422);
        }

        $purchaseOrder->update([
            'status' => 'cancelled',
        ]);

        return response()->json([
            'message' =>
                'Purchase order cancelled successfully.',

            'data' =>
                $purchaseOrder->fresh(),
        ]);
    }

    public function confirm( PurchaseOrder $purchaseOrder ): JsonResponse {
    if ($purchaseOrder->status !== 'draft') {
        return response()->json([
            'message' =>
                'Only draft orders can be confirmed.',
        ], 422);
    }

    $purchaseOrder->update([
        'status' => 'ordered',
    ]);

    return response()->json([
        'message' =>
            'Purchase order confirmed successfully.',

        'data' => $purchaseOrder->fresh(),
    ]);
}

    public function pdf(
        Request $request,
        PurchaseOrder $purchaseOrder
    ) {
        $this->ensureLocationAccess(
            $request,
            $purchaseOrder->location_id
        );

        $purchaseOrder =
            $this->loadRelations(
                $purchaseOrder
            );

        $fileName = str_replace(
            '/',
            '-',
            $purchaseOrder->order_number
        );

        return Pdf::loadView(
            'pdf.purchase-order',
            [
                'purchaseOrder' =>
                    $purchaseOrder,
            ]
        )
            ->setPaper('a4')
            ->stream(
                "purchase-order-{$fileName}.pdf"
            );
    }

    private function calculateItems(
        array $items
    ): array {
        $subtotalHt = 0;
        $taxAmount = 0;
        $preparedItems = [];

        foreach ($items as $item) {
            $quantity =
                (float) $item['quantity'];

            $unitPriceHt =
                (float) $item[
                    'unit_price_ht'
                ];

            $taxRate =
                (float) $item['tax_rate'];

            $lineTotalHt = round(
                $quantity * $unitPriceHt,
                2
            );

            $lineTaxAmount = round(
                $lineTotalHt *
                ($taxRate / 100),
                2
            );

            $lineTotalTtc = round(
                $lineTotalHt +
                $lineTaxAmount,
                2
            );

            $subtotalHt += $lineTotalHt;
            $taxAmount += $lineTaxAmount;

            $preparedItems[] = [
                'product_id' =>
                    $item['product_id'],

                'quantity' =>
                    $quantity,

                'unit_price_ht' =>
                    $unitPriceHt,

                'tax_rate' =>
                    $taxRate,

                'line_total_ht' =>
                    $lineTotalHt,

                'line_tax_amount' =>
                    $lineTaxAmount,

                'line_total_ttc' =>
                    $lineTotalTtc,
            ];
        }

        return [
            'items' => $preparedItems,

            'subtotal_ht' => round(
                $subtotalHt,
                2
            ),

            'tax_amount' => round(
                $taxAmount,
                2
            ),

            'total_ttc' => round(
                $subtotalHt +
                $taxAmount,
                2
            ),
        ];
    }

    private function generateOrderNumber(): string
    {
        do {
            $number =
                'PO-' .
                now()->format('Ymd') .
                '-' .
                Str::upper(
                    Str::random(6)
                );
        } while (
            PurchaseOrder::query()
                ->where(
                    'order_number',
                    $number
                )
                ->exists()
        );

        return $number;
    }

    private function loadRelations(
        PurchaseOrder $purchaseOrder
    ): PurchaseOrder {
        return $purchaseOrder->load([
            'supplier',
            'location',
            'createdBy:id,name',
            'items.product:id,name,reference,unit',
        ]);
    }

    private function ensureLocationAccess(
        Request $request,
        int $locationId
    ): void {
        $user = $request->user();

        if ($user->role === 'admin') {
            return;
        }

        $hasAccess =
            LocationAssignment::query()
                ->where(
                    'user_id',
                    $user->id
                )
                ->where(
                    'location_id',
                    $locationId
                )
                ->exists();

        abort_unless(
            $hasAccess,
            403,
            'You are not assigned to this location.'
        );
    }
}
