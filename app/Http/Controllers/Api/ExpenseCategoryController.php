<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreExpenseCategoryRequest;
use App\Http\Requests\UpdateExpenseCategoryRequest;
use App\Models\ExpenseCategory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class ExpenseCategoryController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware(
                "can:expense-categories.view",
                only: ["index", "show"],
            ),

            new Middleware(
                "can:expense-categories.manage",
                only: ["store", "update"],
            ),
        ];
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = min(max($request->integer("per_page", 15), 1), 100);

        $categories = ExpenseCategory::query()
            ->withCount("expenses")
            ->when(
                $request->filled("is_active"),
                fn(Builder $query) => $query->where(
                    "is_active",
                    $request->boolean("is_active"),
                ),
            )
            ->when($request->filled("search"), function (Builder $query) use (
                $request,
            ) {
                $search = trim($request->input("search"));

                $query->where(function (Builder $query) use ($search) {
                    $query
                        ->where("name", "like", "%{$search}%")
                        ->orWhere("code", "like", "%{$search}%");
                });
            })
            ->orderBy("name")
            ->paginate($perPage)
            ->withQueryString();

        return response()->json($categories);
    }

    public function store(StoreExpenseCategoryRequest $request): JsonResponse
    {
        $category = ExpenseCategory::create($request->validated());

        return response()->json(
            [
                "message" => "Expense category created successfully.",

                "data" => $category,
            ],
            201,
        );
    }

    public function show(ExpenseCategory $expenseCategory): JsonResponse
    {
        return response()->json([
            "data" => $expenseCategory->loadCount("expenses"),
        ]);
    }

    public function update(
        UpdateExpenseCategoryRequest $request,
        ExpenseCategory $expenseCategory,
    ): JsonResponse {
        $expenseCategory->update($request->validated());

        return response()->json([
            "message" => "Expense category updated successfully.",

            "data" => $expenseCategory->fresh(),
        ]);
    }
}
