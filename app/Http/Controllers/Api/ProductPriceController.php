<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductPriceRequest;
use App\Http\Requests\UpdateProductPriceRequest;
use App\Models\Product;
use App\Models\ProductPrice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class ProductPriceController extends Controller implements HasMiddleware
{
    public static function middleware(): array
{
    return [
        new Middleware(
            'can:product-prices.view',
            only: [
                'index',
                'show',
                'current',
                'catalogue',
            ]
        ),

        new Middleware(
            'can:product-prices.manage',
            only: [
                'store',
                'update',
            ]
        ),
    ];
}
    public function index(Request $request): JsonResponse
    {
        $perPage = min(
            max((int) $request->input('per_page', 15), 1),
            100
        );

        $prices = ProductPrice::query()
            ->with([
                'product:id,name,reference,unit',
                'location:id,name,code,type',
                'taxRate:id,name,code,rate',
                'tiers',
            ])

            ->when(
                $request->filled('product_id'),
                fn ($query) => $query->where(
                    'product_id',
                    $request->input('product_id')
                )
            )

            ->when(
                $request->filled('location_id'),
                fn ($query) => $query->where(
                    'location_id',
                    $request->input('location_id')
                )
            )

            ->when(
                $request->filled('status'),
                fn ($query) => $query->where(
                    'status',
                    $request->input('status')
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
                        function ($query) use ($search) {
                            $query
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

            ->latest('starts_at')
            ->paginate($perPage);

        return response()->json($prices);
    }

    public function store(
    StoreProductPriceRequest $request
    ): JsonResponse {
    $data = $request->validated();

    $tiers = $data['tiers'] ?? [];

    unset($data['tiers']);

    $locationId = $data['location_id'] ?? null;
    $now = now();

    $productPrice = DB::transaction(
        function () use (
            $data,
            $tiers,
            $locationId,
            $now
        ) {
            ProductPrice::query()
                ->where(
                    'product_id',
                    $data['product_id']
                )
                ->when(
                    $locationId !== null,
                    fn ($query) => $query->where(
                        'location_id',
                        $locationId
                    ),
                    fn ($query) => $query->whereNull(
                        'location_id'
                    )
                )
                ->where('status', 'active')
                ->lockForUpdate()
                ->update([
                    'status' => 'inactive',
                    'ends_at' => $now,
                ]);

            $productPrice = ProductPrice::create([
                ...$data,
                'location_id' => $locationId,
                'starts_at' => $now,
                'ends_at' => null,
                'status' => 'active',
            ]);

            if (!empty($tiers)) {
                $productPrice
                    ->tiers()
                    ->createMany($tiers);
            }

            return $productPrice;
        }
    );

    return response()->json([
        'message' => 'Product price created successfully.',

        'data' => $productPrice->load([
            'product:id,name,reference,unit',
            'taxRate:id,name,code,rate',
            'tiers',
        ]),
    ], 201);
}

    public function show(
        ProductPrice $productPrice
    ): JsonResponse {
        return response()->json([
            'data' => $productPrice->load([
                'product:id,name,reference',
                'taxRate:id,name,code,rate',
                'tiers',
            ]),
        ]);
    }

    public function update(
    UpdateProductPriceRequest $request,
    ProductPrice $productPrice
    ): JsonResponse {
    $data = $request->validated();

    $tiersWereSent = array_key_exists(
        'tiers',
        $data
    );

    $tiers = $data['tiers'] ?? [];

    unset($data['tiers']);

    DB::transaction(
        function () use (
            $productPrice,
            $data,
            $tiers,
            $tiersWereSent
        ) {
            $productPrice->update($data);

            if ($tiersWereSent) {
                $productPrice
                    ->tiers()
                    ->delete();

                if (!empty($tiers)) {
                    $productPrice
                        ->tiers()
                        ->createMany($tiers);
                }
            }
        }
    );

    return response()->json([
        'message' => 'Product price updated successfully.',

        'data' => $productPrice
            ->fresh()
            ->load([
                'product:id,name,reference,unit',
                'taxRate:id,name,code,rate',
                'tiers',
            ]),
    ]);
}

    public function current(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => [
                'required',
                'integer',
                'exists:products,id',
            ],

            'location_id' => [
                'nullable',
                'integer',
                'exists:locations,id',
            ],
        ]);

        $locationId = $validated['location_id'] ?? null;

        $price = $this->currentPriceQuery(
            $validated['product_id'],
            $locationId
        )->first();

        /*
         * If there is no location-specific price,
         * use the global price.
         */
        if (!$price && $locationId !== null) {
            $price = $this->currentPriceQuery(
                $validated['product_id'],
                null
            )->first();
        }

        if (!$price) {
            return response()->json([
                'message' => 'No active price was found.',
            ], 404);
        }

        return response()->json([
            'data' => $price,
        ]);
    }

    private function currentPriceQuery(
        int $productId,
        ?int $locationId
    ) {
        return ProductPrice::query()
            ->with([
                'product:id,name,reference,unit',
                'location:id,name,code,type',
                'taxRate:id,name,code,rate',
            ])
            ->where('product_id', $productId)
            ->when(
                $locationId !== null,
                fn ($query) => $query->where(
                    'location_id',
                    $locationId
                ),
                fn ($query) => $query->whereNull(
                    'location_id'
                )
            )
            ->where('status', 'active')
            ->where('starts_at', '<=', now())
            ->where(function ($query) {
                $query
                    ->whereNull('ends_at')
                    ->orWhere('ends_at', '>=', now());
            })
            ->latest('starts_at');
    }

    public function catalogue(
    Request $request
    ): JsonResponse {
    $perPage = min(
        max((int) $request->input('per_page', 15), 1),
        100
    );

    $products = Product::query()
        ->with([
            'category:id,name',
            'brand:id,name',

            'currentGlobalPrice' => function ($query) {
                $query->select([
                    'id',
                    'product_id',
                    'tax_rate_id',
                    'sale_price_ht',
                    'starts_at',
                    'ends_at',
                    'status',
                ]);
            },

            'currentGlobalPrice.taxRate:id,name,code,rate',
        ])

        ->when(
            $request->filled('search'),
            function ($query) use ($request) {
                $search = trim(
                    $request->input('search')
                );

                $query->where(function ($query) use ($search) {
                    $query
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
                });
            }
        )

        ->orderBy('name')
        ->paginate($perPage);

    return response()->json($products);
}
}
