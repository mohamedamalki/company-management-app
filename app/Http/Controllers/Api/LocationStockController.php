<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreLocationStockRequest;
use App\Http\Requests\UpdateMinimumQuantityRequest;
use App\Models\Location;
use App\Models\LocationStock;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class LocationStockController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware(
                'can:location-stocks.view',
                only: [
                    'index',
                    'show',
                ]
            ),

            new Middleware(
                'can:location-stocks.manage',
                only: [
                    'options',
                    'store',
                    'updateMinimumQuantity',
                ]
            ),
        ];
    }

    /**
     * Return the stock list.
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

        $stocks = LocationStock::query()
            ->with([
                'location:id,name,code,type',
                'product:id,category_id,brand_id,name,reference,unit',
                'product.category:id,name',
                'product.brand:id,name',
            ])

            // Admin can see every location.
            // Other users only see their assigned locations.
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
                $request->filled('search'),
                function ($query) use ($request) {
                    $search = trim(
                        $request->input('search')
                    );

                    $query->whereHas(
                        'product',
                        function ($productQuery) use ($search) {
                            $productQuery
                                ->where(
                                    'name',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'reference',
                                    'like',
                                    "%{$search}%"
                                );
                        }
                    );
                }
            )

            ->when(
                $request->input('status') === 'out_of_stock',
                fn ($query) =>
                    $query->where('quantity', '<=', 0)
            )

            ->when(
                $request->input('status') === 'low_stock',
                fn ($query) =>
                    $query
                        ->where('quantity', '>', 0)
                        ->whereColumn(
                            'quantity',
                            '<=',
                            'minimum_quantity'
                        )
            )

            ->when(
                $request->input('status') === 'available',
                fn ($query) =>
                    $query->whereColumn(
                        'quantity',
                        '>',
                        'minimum_quantity'
                    )
            )

            ->latest()
            ->paginate($perPage);

        return response()->json($stocks);
    }

    /**
     * Initialize a product stock in one location.
     */
    public function store(
        StoreLocationStockRequest $request
    ): JsonResponse {
        $data = $request->validated();

        $this->ensureUserCanAccessLocation(
            $request->user(),
            (int) $data['location_id']
        );

        $stock = LocationStock::firstOrCreate(
            [
                'location_id' => $data['location_id'],
                'product_id' => $data['product_id'],
            ],
            [
                'quantity' => 0,
                'minimum_quantity' =>
                    $data['minimum_quantity'] ?? 0,
            ]
        );

        if (!$stock->wasRecentlyCreated) {
            return response()->json([
                'message' =>
                    'This product already has a stock record for this location.',
            ], 409);
        }

        return response()->json([
            'message' =>
                'Location stock initialized successfully.',

            'data' => $stock->load([
                'location:id,name,code,type',
                'product:id,category_id,brand_id,name,reference,unit',
                'product.category:id,name',
                'product.brand:id,name',
            ]),
        ], 201);
    }

    /**
     * Return one stock record.
     */
    public function show(
        Request $request,
        LocationStock $locationStock
    ): JsonResponse {
        $this->ensureUserCanAccessLocation(
            $request->user(),
            $locationStock->location_id
        );

        return response()->json([
            'data' => $locationStock->load([
                'location:id,name,code,type',
                'product:id,category_id,brand_id,name,reference,unit',
                'product.category:id,name',
                'product.brand:id,name',
            ]),
        ]);
    }

    /**
     * Update the minimum stock quantity.
     */
    public function updateMinimumQuantity(
        UpdateMinimumQuantityRequest $request,
        LocationStock $locationStock
    ): JsonResponse {
        $this->ensureUserCanAccessLocation(
            $request->user(),
            $locationStock->location_id
        );

        $locationStock->update([
            'minimum_quantity' =>
                $request->validated('minimum_quantity'),
        ]);

        return response()->json([
            'message' =>
                'Minimum stock quantity updated successfully.',

            'data' => $locationStock->fresh()->load([
                'location:id,name,code,type',
                'product:id,name,reference,unit',
            ]),
        ]);
    }

    /**
 * Return locations and products used
 * by the location-stock creation form.
 */
public function options(
    Request $request
): JsonResponse {
    $user = $request->user();

    /*
     * Admin can select every active location.
     * Other users can only select their
     * assigned active locations.
     */
    $locationIds = null;

    if ($user->role !== 'admin') {
        $locationIds = $user
            ->assignedLocations()
            ->pluck('locations.id');
    }

    $locations = Location::query()
        ->select([
            'id',
            'name',
            'code',
            'type',
        ])
        ->where('status', 'active')
        ->when(
            $locationIds !== null,
            fn ($query) =>
                $query->whereIn(
                    'id',
                    $locationIds
                )
        )
        ->orderBy('name')
        ->get();

    $products = Product::query()
        ->select([
            'id',
            'name',
            'reference',
            'unit',
        ])
        ->orderBy('name')
        ->get();

    return response()->json([
        'data' => [
            'locations' => $locations,
            'products' => $products,
        ],
    ]);
}

    /**
     * Ensure the user has access to the location.
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
