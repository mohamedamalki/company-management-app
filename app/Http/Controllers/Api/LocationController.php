<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreLocationRequest;
use App\Http\Requests\UpdateLocationRequest;
use App\Models\Location;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    /**
     * Return a paginated list of locations.
     */
    public function index(Request $request): JsonResponse
    {
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

        $locations = Location::query()
            ->when(
                $request->filled('type'),
                fn ($query) =>
                    $query->where(
                        'type',
                        $request->type
                    )
            )
            ->when(
                $request->filled('status'),
                fn ($query) =>
                    $query->where(
                        'status',
                        $request->status
                    )
            )
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
                                    'code',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'address',
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
            ->latest()
            ->paginate($perPage);

        return response()->json($locations);
    }

    /**
     * Create a location.
     */
    public function store(
        StoreLocationRequest $request
    ): JsonResponse {
        $location = Location::create(
            $request->validated()
        );

        return response()->json([
            'message' => 'Location created successfully.',
            'data' => $location,
        ], 201);
    }

    /**
     * Return one location.
     */
    public function show(
        Location $location
    ): JsonResponse {
        return response()->json([
            'data' => $location,
        ]);
    }

    /**
     * Update a location.
     */
    public function update(
        UpdateLocationRequest $request,
        Location $location
    ): JsonResponse {
        $location->update(
            $request->validated()
        );

        return response()->json([
            'message' => 'Location updated successfully.',
            'data' => $location->fresh(),
        ]);
    }
}
