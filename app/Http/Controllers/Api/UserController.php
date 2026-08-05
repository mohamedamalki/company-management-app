<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * Return a paginated list of users.
     */
    public function index(Request $request): JsonResponse
    {
        $users = User::query()
            ->select([
                'id',
                'name',
                'email',
                'role',
                'status',
                'created_at',
            ])
            ->when(
                $request->filled('role'),
                fn ($query) => $query->where(
                    'role',
                    $request->role
                )
            )
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
                        $query->where(
                            'name',
                            'like',
                            "%{$search}%"
                        )->orWhere(
                            'email',
                            'like',
                            "%{$search}%"
                        );
                    });
                }
            )
            ->latest()
            ->paginate(15);

        return response()->json($users);
    }

    /**
     * Create a user.
     */
    public function store(
        StoreUserRequest $request
    ): JsonResponse {
        $data = $request->validated();

        $data['password'] = Hash::make(
            $data['password']
        );

        $data['status'] = $data['status'] ?? 'active';

        $user = User::create($data);

        return response()->json([
            'message' => 'User created successfully.',
            'data' => $user
        ], 201);
    }

    /**
     * Return one user.
     */
    public function show(User $user): JsonResponse
    {
        return response()->json([
            'data' => $user
        ]);
    }

    /**
     * Update a user.
     */
    public function update(
        UpdateUserRequest $request,
        User $user
    ): JsonResponse {
        $data = $request->validated();

        if (
            array_key_exists('password', $data) &&
            !empty($data['password'])
        ) {
            $data['password'] = Hash::make(
                $data['password']
            );
        } else {
            unset($data['password']);
        }

        $user->update($data);

        return response()->json([
            'message' => 'User updated successfully.',
            'data' => $user
                ->fresh()
        ]);
    }
}
