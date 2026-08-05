<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBrandRequest;
use App\Http\Requests\UpdateBrandRequest;
use App\Models\Brand;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BrandController extends Controller
{
    public function index(
        Request $request
    ): JsonResponse {
        $brands = Brand::query()
            ->withCount('products')
            ->when(
                $request->filled('search'),
                function ($query) use ($request) {
                    $search = trim(
                        $request->search
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
                                    'description',
                                    'like',
                                    "%{$search}%"
                                );
                        }
                    );
                }
            )
            ->orderBy('name')
            ->paginate(15);

        return response()->json($brands);
    }

    public function store(
        StoreBrandRequest $request
    ): JsonResponse {
        $brand = Brand::create(
            $request->validated()
        );

        return response()->json([
            'message' => 'Brand created successfully.',
            'data' => $brand,
        ], 201);
    }

    public function show(
        Brand $brand
    ): JsonResponse {
        $brand->loadCount('products');

        return response()->json([
            'data' => $brand,
        ]);
    }

    public function update(
        UpdateBrandRequest $request,
        Brand $brand
    ): JsonResponse {
        $brand->update(
            $request->validated()
        );

        return response()->json([
            'message' => 'Brand updated successfully.',
            'data' => $brand->fresh(),
        ]);
    }
}
