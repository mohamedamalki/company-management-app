<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTaxRateRequest;
use App\Http\Requests\UpdateTaxRateRequest;
use App\Models\TaxRate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class TaxRateController extends Controller implements HasMiddleware
{
    public static function middleware(): array
{
    return [
        new Middleware(
            'can:tax-rates.view',
            only: [
                'index',
                'show',
                'active',
            ]
        ),

        new Middleware(
            'can:tax-rates.manage',
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

        $taxRates = TaxRate::query()
            ->when(
                $request->filled('status'),
                fn ($query) => $query->where(
                    'status',
                    $request->status
                )
            )
            ->orderBy('rate')
            ->paginate($perPage);

        return response()->json($taxRates);
    }

    public function active(): JsonResponse
    {
        $taxRates = TaxRate::query()
            ->select([
                'id',
                'name',
                'code',
                'rate',
            ])
            ->where('status', 'active')
            ->orderBy('rate')
            ->get();

        return response()->json([
            'data' => $taxRates,
        ]);
    }

    public function store(
        StoreTaxRateRequest $request
    ): JsonResponse {
        $taxRate = TaxRate::create(
            $request->validated()
        );

        return response()->json([
            'message' => 'TVA rate created successfully.',
            'data' => $taxRate,
        ], 201);
    }

    public function show(TaxRate $taxRate): JsonResponse
    {
        return response()->json([
            'data' => $taxRate,
        ]);
    }

    public function update(
        UpdateTaxRateRequest $request,
        TaxRate $taxRate
    ): JsonResponse {
        $taxRate->update(
            $request->validated()
        );

        return response()->json([
            'message' => 'TVA rate updated successfully.',
            'data' => $taxRate->fresh(),
        ]);
    }
}
