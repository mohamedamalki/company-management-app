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
    public function index(
        Request $request
    ): JsonResponse {
        $products = Product::query()
            ->with([
                'category:id,name',
                'brand:id,name',
            ])
            ->when(
                $request->filled('category_id'),
                fn ($query) => $query->where(
                    'category_id',
                    $request->category_id
                )
            )
            ->when(
                $request->filled('brand_id'),
                fn ($query) => $query->where(
                    'brand_id',
                    $request->brand_id
                )
            )
            ->when(
                $request->filled('unit'),
                fn ($query) => $query->where(
                    'unit',
                    $request->unit
                )
            )
            ->when(
                $request->filled('search'),
                function ($query) use ($request) {
                    $search = $request->search;

                    $query->where(
                        function ($query) use ($search) {
                            $query
                                ->where(
                                    'name',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'sku',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'barcode',
                                    'like',
                                    "%{$search}%"
                                );
                        }
                    );
                }
            )
            ->latest()
            ->paginate(15);

        return response()->json($products);
    }

    public function store(
        StoreProductRequest $request
    ): JsonResponse {
        $product = Product::create(
            $request->validated()
        );

        return response()->json([
            'message' =>
                'Product created successfully.',

            'data' => $product->load([
                'category:id,name',
                'brand:id,name',
            ]),
        ], 201);
    }

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

    public function update(
        UpdateProductRequest $request,
        Product $product
    ): JsonResponse {
        $product->update(
            $request->validated()
        );

        return response()->json([
            'message' =>
                'Product updated successfully.',

            'data' => $product
                ->fresh()
                ->load([
                    'category:id,name',
                    'brand:id,name',
                ]),
        ]);
    }
}
