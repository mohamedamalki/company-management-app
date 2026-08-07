<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * Return the products list.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = min(
            max((int) $request->input('per_page', 15), 1),
            100
        );

        $products = Product::query()
            ->with([
                'category:id,name',
                'brand:id,name',
                'currentGlobalPrice.taxRate:id,name,code,rate',
            ])

            ->when(
                $request->filled('category_id'),
                fn ($query) => $query->where(
                    'category_id',
                    $request->input('category_id')
                )
            )

            ->when(
                $request->filled('brand_id'),
                fn ($query) => $query->where(
                    'brand_id',
                    $request->input('brand_id')
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

            ->latest()
            ->paginate($perPage);

        return response()->json($products);
    }

    /**
     * Create a product.
     */
    public function store(
        StoreProductRequest $request
    ): JsonResponse {
        $product = Product::create(
            $request->validated()
        );

        return response()->json([
            'message' => 'Product created successfully.',

            'data' => $product->load([
                'category:id,name',
                'brand:id,name',
            ]),
        ], 201);
    }

    /**
     * Return one product.
     */
    public function show(
        Product $product
    ): JsonResponse {
        return response()->json([
            'data' => $product->load([
                'category:id,name',
                'brand:id,name',
            ]),
        ]);
    }

    /**
     * Update a product.
     */
    public function update(
        UpdateProductRequest $request,
        Product $product
    ): JsonResponse {
        $product->update(
            $request->validated()
        );

        return response()->json([
            'message' => 'Product updated successfully.',

            'data' => $product
                ->fresh()
                ->load([
                    'category:id,name',
                    'brand:id,name',
                ]),
        ]);
    }

    public function destroy(Product $product): JsonResponse
    {
    $product->delete();

    return response()->json([
        'message' => 'Product deleted successfully.',
    ]);
    }
}
