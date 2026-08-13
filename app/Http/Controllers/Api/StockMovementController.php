<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdjustStockRequest;
use App\Models\LocationStock;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StockMovementController extends Controller implements HasMiddleware
{
    /**
     * Movement types that add quantity to stock.
     */
    private const ENTRY_TYPES = [
        'opening_stock',
        'purchase_entry',
        'adjustment_in',
        'return_in',
        'transfer_in',
    ];

    /**
     * Movement types that remove quantity from stock.
     */
    private const EXIT_TYPES = [
        'sale_exit',
        'adjustment_out',
        'transfer_out',
    ];

    /**
     * Movement types that can be created manually from this endpoint.
     * Purchase, sale and transfer movements should be created by their
     * corresponding business processes later.
     */
    private const MANUAL_TYPES = [
        'opening_stock',
        'adjustment_in',
        'adjustment_out',
    ];

    public static function middleware(): array
    {
        return [
            new Middleware(
                'can:stock-movements.view',
                only: [
                    'index',
                    'show',
                ]
            ),

            new Middleware(
                'can:stock-movements.manage',
                only: [
                    'store',
                ]
            ),
        ];
    }

    /**
     * Return the stock movement history.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $perPage = min(
            max(
                (int) $request->input('per_page', 15),
                1
            ),
            100
        );

        $movements = StockMovement::query()
            ->with([
                'location:id,name,code,type',
                'product:id,name,reference,unit',
                'user:id,name',
                'reference',
            ])
            ->when(
                $user->role !== 'admin',
                function ($query) use ($user) {
                    $locationIds = $user
                        ->assignedLocations()
                        ->pluck('locations.id');

                    $query->whereIn(
                        'location_id',
                        $locationIds
                    );
                }
            )
            ->when(
                $request->filled('location_id'),
                fn ($query) => $query->where(
                    'location_id',
                    $request->integer('location_id')
                )
            )
            ->when(
                $request->filled('product_id'),
                fn ($query) => $query->where(
                    'product_id',
                    $request->integer('product_id')
                )
            )
            ->when(
                $request->filled('type'),
                fn ($query) => $query->where(
                    'type',
                    $request->input('type')
                )
            )
            ->when(
                $request->filled('date_from'),
                fn ($query) => $query->whereDate(
                    'created_at',
                    '>=',
                    $request->input('date_from')
                )
            )
            ->when(
                $request->filled('date_to'),
                fn ($query) => $query->whereDate(
                    'created_at',
                    '<=',
                    $request->input('date_to')
                )
            )
            ->when(
                $request->filled('search'),
                function ($query) use ($request) {
                    $search = trim(
                        $request->input('search')
                    );

                    $query->where(function ($query) use ($search) {
                        $query
                            ->whereHas(
                                'product',
                                fn ($productQuery) => $productQuery
                                    ->where(
                                        'name',
                                        'like',
                                        "%{$search}%"
                                    )
                                    ->orWhere(
                                        'reference',
                                        'like',
                                        "%{$search}%"
                                    )
                            )
                            ->orWhereHas(
                                'location',
                                fn ($locationQuery) => $locationQuery
                                    ->where(
                                        'name',
                                        'like',
                                        "%{$search}%"
                                    )
                                    ->orWhere(
                                        'code',
                                        'like',
                                        "%{$search}%"
                                    )
                            );
                    });
                }
            )
            ->latest()
            ->paginate($perPage);

        return response()->json($movements);
    }

    /**
     * Create a manual stock movement and update the current quantity.
     */
    public function store(
        AdjustStockRequest $request
    ): JsonResponse {
        $data = $request->validated();

        $this->ensureUserCanAccessLocation(
            $request->user(),
            (int) $data['location_id']
        );

        if (!in_array(
            $data['type'],
            self::MANUAL_TYPES,
            true
        )) {
            throw ValidationException::withMessages([
                'type' => 'This movement type cannot be created manually.',
            ]);
        }

        $movement = DB::transaction(
            function () use ($request, $data) {
                $locationStock = LocationStock::query()
                    ->where(
                        'location_id',
                        $data['location_id']
                    )
                    ->where(
                        'product_id',
                        $data['product_id']
                    )
                    ->lockForUpdate()
                    ->first();

                if (!$locationStock) {
                    throw ValidationException::withMessages([
                        'product_id' =>
                            'Initialize this product stock in the selected location first.',
                    ]);
                }

                $quantity = round(
                    (float) $data['quantity'],
                    3
                );

                $quantityBefore = round(
                    (float) $locationStock->quantity,
                    3
                );

                if ($data['type'] === 'opening_stock') {
                    $openingMovementExists = StockMovement::query()
                        ->where(
                            'location_id',
                            $data['location_id']
                        )
                        ->where(
                            'product_id',
                            $data['product_id']
                        )
                        ->where(
                            'type',
                            'opening_stock'
                        )
                        ->exists();

                    if (
                        $openingMovementExists ||
                        $quantityBefore !== 0.0
                    ) {
                        throw ValidationException::withMessages([
                            'type' =>
                                'Opening stock can only be recorded once when the current quantity is zero.',
                        ]);
                    }
                }

                $isEntry = in_array(
                    $data['type'],
                    self::ENTRY_TYPES,
                    true
                );

                $isExit = in_array(
                    $data['type'],
                    self::EXIT_TYPES,
                    true
                );

                if (!$isEntry && !$isExit) {
                    throw ValidationException::withMessages([
                        'type' => 'Unsupported stock movement type.',
                    ]);
                }

                $quantityAfter = round(
                    $isEntry
                        ? $quantityBefore + $quantity
                        : $quantityBefore - $quantity,
                    3
                );

                if ($quantityAfter < 0) {
                    throw ValidationException::withMessages([
                        'quantity' =>
                            'The requested quantity is greater than the available stock.',
                    ]);
                }

                $movement = StockMovement::create([
                    'location_id' => $data['location_id'],
                    'product_id' => $data['product_id'],
                    'user_id' => $request->user()->id,
                    'type' => $data['type'],
                    'quantity' => $quantity,
                    'quantity_before' => $quantityBefore,
                    'quantity_after' => $quantityAfter,
                    'notes' => $data['notes'] ?? null,
                ]);

                $locationStock->update([
                    'quantity' => $quantityAfter,
                ]);

                return $movement;
            }
        );

        return response()->json([
            'message' => 'Stock movement created successfully.',
            'data' => $movement->load([
                'location:id,name,code,type',
                'product:id,name,reference,unit',
                'user:id,name',
            ]),
        ], 201);
    }

    /**
     * Return one stock movement.
     */
    public function show(
        Request $request,
        StockMovement $stockMovement
    ): JsonResponse {
        $this->ensureUserCanAccessLocation(
            $request->user(),
            $stockMovement->location_id
        );

        return response()->json([
            'data' => $stockMovement->load([
                'location:id,name,code,type',
                'product:id,name,reference,unit',
                'user:id,name',
                'reference',
            ]),
        ]);
    }

    /**
     * Ensure a non-admin user is assigned to the selected location.
     */
    private function ensureUserCanAccessLocation(
        User $user,
        int $locationId
    ): void {
        if ($user->role === 'admin') {
            return;
        }

        $hasAccess = $user
            ->assignedLocations()
            ->where(
                'locations.id',
                $locationId
            )
            ->exists();

        abort_unless(
            $hasAccess,
            403,
            'You do not have access to this location.'
        );
    }
}
