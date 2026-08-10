<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSupplierRequest;
use App\Http\Requests\UpdateSupplierRequest;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class SupplierController extends Controller implements HasMiddleware
{
    public static function middleware(): array
{
    return [
        new Middleware(
            'can:suppliers.view',
            only: [
                'index',
                'show',
                'active',
            ]
        ),

        new Middleware(
            'can:suppliers.manage',
            only: [
                'store',
                'update',
                'destroy',
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

        $suppliers = Supplier::query()
            ->withCount('purchaseOrders')
            ->when(
                $request->filled('is_active'),
                fn ($query) => $query->where(
                    'is_active',
                    $request->boolean('is_active')
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
                                    'code',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'contact_name',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'email',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'phone',
                                    'like',
                                    "%{$search}%"
                                );
                        }
                    );
                }
            )
            ->orderBy('name')
            ->paginate($perPage);

        return response()->json(
            $suppliers
        );
    }

    public function active(): JsonResponse
    {
        $suppliers = Supplier::query()
            ->select([
                'id',
                'name',
                'code',
                'contact_name',
                'phone',
            ])
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $suppliers,
        ]);
    }

    public function store(
        StoreSupplierRequest $request
    ): JsonResponse {
        $data = $request->validated();

        $data['is_active'] =
            $data['is_active'] ?? true;

        $supplier = Supplier::create(
            $data
        );

        return response()->json([
            'message' =>
                'Supplier created successfully.',

            'data' => $supplier,
        ], 201);
    }

    public function show(
        Supplier $supplier
    ): JsonResponse {
        return response()->json([
            'data' =>
                $supplier->loadCount(
                    'purchaseOrders'
                ),
        ]);
    }

    public function update(
        UpdateSupplierRequest $request,
        Supplier $supplier
    ): JsonResponse {
        $supplier->update(
            $request->validated()
        );

        return response()->json([
            'message' =>
                'Supplier updated successfully.',

            'data' =>
                $supplier
                    ->fresh()
                    ->loadCount(
                        'purchaseOrders'
                    ),
        ]);
    }

    public function destroy(
        Supplier $supplier
    ): JsonResponse {
        $supplier->delete();

        return response()->json([
            'message' =>
                'Supplier archived successfully.',
        ]);
    }
}
