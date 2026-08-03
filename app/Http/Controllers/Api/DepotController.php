<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDepotRequest;
use App\Http\Requests\UpdateDepotRequest;
use App\Models\Depot;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DepotController extends Controller
{
    /**
     * Return a paginated list of depots.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = min(
            max((int) $request->input('per_page', 15), 1),
            100
        );

        $depots = Depot::query()
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
                    $search = $request->search;

                    $query->where(function ($query) use ($search) {
                        $query
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('code', 'like', "%{$search}%")
                            ->orWhere('address', 'like', "%{$search}%");
                    });
                }
            )
            ->latest()
            ->paginate($perPage);

        return response()->json($depots);
    }

    /**
     * Create a depot.
     */
    public function store(
        StoreDepotRequest $request
    ): JsonResponse {
        $depot = Depot::create(
            $request->validated()
        );

        return response()->json([
            'message' => 'Depot created successfully.',
            'data' => $depot,
        ], 201);
    }

    /**
     * Return one depot.
     */
    public function show(Depot $depot): JsonResponse
    {
        return response()->json([
            'data' => $depot,
        ]);
    }

    /**
     * Update a depot.
     */
    public function update(
        UpdateDepotRequest $request,
        Depot $depot
    ): JsonResponse {
        $depot->update(
            $request->validated()
        );

        return response()->json([
            'message' => 'Depot updated successfully.',
            'data' => $depot->fresh(),
        ]);
    }
}
