<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePaymentMethodRequest;
use App\Http\Requests\UpdatePaymentMethodRequest;
use App\Models\PaymentMethod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class PaymentMethodController extends Controller implements HasMiddleware
{
    public static function middleware(): array
{
    return [
        new Middleware(
            'can:payment-methods.view',
            only: [
                'index',
                'show',
                'active',
            ]
        ),

        new Middleware(
            'can:payment-methods.manage',
            only: [
                'store',
                'update',
            ]
        ),
    ];
}
    /**
     * Admin list: includes active and inactive methods.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = min(
            max((int) $request->input('per_page', 15), 1),
            100
        );

        $paymentMethods = PaymentMethod::query()
            ->when(
                $request->filled('status'),
                fn ($query) => $query->where(
                    'status',
                    $request->status
                )
            )
            ->when(
                $request->filled('search'),
                function ($query) use ($request) {
                    $search = trim($request->search);

                    $query->where(function ($query) use ($search) {
                        $query
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('code', 'like', "%{$search}%");
                    });
                }
            )
            ->orderBy('name')
            ->paginate($perPage);

        return response()->json($paymentMethods);
    }

    /**
     * Simple active list used in the sale form.
     */
    public function active(): JsonResponse
    {
        $paymentMethods = PaymentMethod::query()
            ->select([
                'id',
                'name',
                'code',
                'requires_reference',
            ])
            ->where('status', 'active')
            ->orderBy('name')
            ->get();

        return response()->json([
            'data' => $paymentMethods,
        ]);
    }

    public function store(
        StorePaymentMethodRequest $request
    ): JsonResponse {
        $paymentMethod = PaymentMethod::create(
            $request->validated()
        );

        return response()->json([
            'message' => 'Payment method created successfully.',
            'data' => $paymentMethod,
        ], 201);
    }

    public function show(
        PaymentMethod $paymentMethod
    ): JsonResponse {
        return response()->json([
            'data' => $paymentMethod,
        ]);
    }

    public function update(
        UpdatePaymentMethodRequest $request,
        PaymentMethod $paymentMethod
    ): JsonResponse {
        $paymentMethod->update(
            $request->validated()
        );

        return response()->json([
            'message' => 'Payment method updated successfully.',
            'data' => $paymentMethod->fresh(),
        ]);
    }
}
