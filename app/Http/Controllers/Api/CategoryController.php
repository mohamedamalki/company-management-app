<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class CategoryController extends Controller implements HasMiddleware
{
    public static function middleware(): array
{
    return [
        new Middleware(
            'can:categories.view',
            only: ['index', 'show']
        ),

        new Middleware(
            'can:categories.manage',
            only: ['store', 'update']
        ),
    ];
}
    public function index(
        Request $request
    ): JsonResponse {
        $categories = Category::query()
            ->withCount('products')
            ->when(
                $request->filled('search'),
                function ($query) use ($request) {
                    $search = $request->search;

                    $query->where(
                        'name',
                        'like',
                        "%{$search}%"
                    );
                }
            )
            ->orderBy('name')
            ->paginate(15);

        return response()->json($categories);
    }

    public function store(
        StoreCategoryRequest $request
    ): JsonResponse {
        $category = Category::create(
            $request->validated()
        );

        return response()->json([
            'message' =>
                'Category created successfully.',

            'data' => $category,
        ], 201);
    }

    public function show(
        Category $category
    ): JsonResponse {
        return response()->json([
            'data' => $category->loadCount(
                'products'
            ),
        ]);
    }

    public function update(
        UpdateCategoryRequest $request,
        Category $category
    ): JsonResponse {
        $category->update(
            $request->validated()
        );

        return response()->json([
            'message' =>
                'Category updated successfully.',

            'data' => $category
                ->fresh()
                ->loadCount('products'),
        ]);
    }
}
