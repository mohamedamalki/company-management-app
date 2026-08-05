<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreLocationAssignmentRequest;
use App\Models\LocationAssignment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LocationAssignmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(
            max((int) $request->input('per_page', 15), 1),
            100
        );

        $assignments = LocationAssignment::query()
            ->with([
                'user:id,name,email,role,status',
                'location:id,name,code,type,status',
            ])
            ->latest('assigned_at')
            ->paginate($perPage);

        return response()->json($assignments);
    }

    public function store(
        StoreLocationAssignmentRequest $request
    ): JsonResponse {
        $data = $request->validated();

        $assignment = LocationAssignment::updateOrCreate(
            [
                'user_id' => $data['user_id'],
            ],
            [
                'location_id' => $data['location_id'],
                'assigned_at' => now(),
            ]
        );

        $assignment->load([
            'user:id,name,email,role,status',
            'location:id,name,code,type,status',
        ]);

        return response()->json([
            'message' => $assignment->wasRecentlyCreated
                ? 'Location assigned successfully.'
                : 'Location assignment updated successfully.',

            'data' => $assignment,
        ], $assignment->wasRecentlyCreated ? 201 : 200);
    }

    public function destroy(
        LocationAssignment $locationAssignment
    ): JsonResponse {
        $locationAssignment->delete();

        return response()->json([
            'message' => 'Location assignment removed successfully.',
        ]);
    }
}
