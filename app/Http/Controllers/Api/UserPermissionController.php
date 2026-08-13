<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateUserPermissionsRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;

class UserPermissionController extends Controller
{
    /**
     * Permissions that must remain admin-only.
     */
    private const ADMIN_ONLY_PERMISSIONS = [
        'users.manage',
        'permissions.manage',
    ];

    /**
     * Return every permission assignable through the admin page.
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => $this->groupedAssignablePermissions(),
        ]);
    }

    /**
     * Return one user and their permissions.
     */
    public function show(User $user): JsonResponse
    {
        $this->ensurePermissionsAreAssignable($user);

        $allowedPermissions =
            $this->assignablePermissionNames();

        $assignedPermissions = $user
            ->getDirectPermissions()
            ->pluck('name')
            ->intersect($allowedPermissions)
            ->sort()
            ->values();

        return response()->json([
            'data' => [
                'user' => $user->only([
                    'id',
                    'name',
                    'email',
                    'role',
                    'status',
                ]),

                'available_permissions' =>
                    $this->groupedAssignablePermissions(),

                'assigned_permissions' =>
                    $assignedPermissions,
            ],
        ]);
    }

    /**
     * Replace one user's direct permissions.
     */
    public function update(
        UpdateUserPermissionsRequest $request,
        User $user
    ): JsonResponse {
        $this->ensurePermissionsAreAssignable($user);

        $requestedPermissions = collect(
            $request->validated()['permissions']
        )
            ->unique()
            ->values();

        $allowedPermissions =
            $this->assignablePermissionNames();

        $invalidPermissions = $requestedPermissions
            ->diff($allowedPermissions);

        if ($invalidPermissions->isNotEmpty()) {
            return response()->json([
                'message' =>
                    'Some permissions do not exist or are not assignable.',

                'errors' => [
                    'permissions' => [
                        'Invalid permissions: ' .
                        $invalidPermissions->implode(', '),
                    ],
                ],

                'invalid_permissions' =>
                    $invalidPermissions->values(),
            ], 422);
        }

        $user->syncPermissions(
            $requestedPermissions->all()
        );

        $assignedPermissions = $user
            ->fresh()
            ->getDirectPermissions()
            ->pluck('name')
            ->sort()
            ->values();

        return response()->json([
            'message' =>
                'User permissions created successfully.',

            'data' => [
                'user' => $user->only([
                    'id',
                    'name',
                    'email',
                    'role',
                    'status',
                ]),

                'assigned_permissions' =>
                    $assignedPermissions,
            ],
        ]);
    }

    /**
     * Return the names of every assignable permission.
     */
private function assignablePermissionNames(): Collection
{
    $configuredPermissions = collect(
        config('feature_permissions.features', [])
    )
        ->filter(
            fn (array $feature) =>
                $feature['assignable'] ?? false
        )
        ->flatMap(
            fn (array $feature) =>
                array_keys(
                    $feature['permissions'] ?? []
                )
        )
        ->unique()
        ->values();

    return Permission::query()
        ->where('guard_name', 'web')
        ->whereIn('name', $configuredPermissions)
        ->orderBy('name')
        ->pluck('name');
}

    /**
     * Return assignable permissions grouped by feature.
     **/
private function groupedAssignablePermissions(): Collection
{
    $features = collect(
        config('feature_permissions.features', [])
    )->filter(
        fn (array $feature) =>
            $feature['assignable'] ?? false
    );

    $configuredPermissionNames = $features
        ->flatMap(
            fn (array $feature) =>
                array_keys(
                    $feature['permissions'] ?? []
                )
        )
        ->unique()
        ->values();

    $databasePermissions = Permission::query()
        ->where('guard_name', 'web')
        ->whereIn(
            'name',
            $configuredPermissionNames
        )
        ->get([
            'id',
            'name',
        ])
        ->keyBy('name');

    return $features
        ->map(function (
            array $feature,
            string $featureKey
        ) use ($databasePermissions) {
            $permissions = collect(
                $feature['permissions'] ?? []
            )
                ->map(function (
                    string $label,
                    string $permissionName
                ) use ($databasePermissions) {
                    $permission = $databasePermissions
                        ->get($permissionName);

                    if (!$permission) {
                        return null;
                    }

                    return [
                        'id' => $permission->id,
                        'name' => $permission->name,

                        'action' => Str::afterLast(
                            $permission->name,
                            '.'
                        ),

                        'label' => $label,
                    ];
                })
                ->filter()
                ->values();

            return [
                'feature' => $featureKey,

                'label' =>
                    $feature['label']
                    ?? Str::headline($featureKey),

                'permissions' => $permissions,
            ];
        })
        ->filter(
            fn (array $feature) =>
                $feature['permissions']->isNotEmpty()
        )
        ->values();
}

    /**
     * Only these user types can receive permissions.
     */
    private function ensurePermissionsAreAssignable(
        User $user
    ): void {
        $role = strtolower(
            trim($user->role)
        );

        if (!in_array(
            $role,
            [
                'responsable',
                'fournisseur',
            ],
            true
        )) {
            abort(
                422,
                'Permissions can only be assigned to responsable or fournisseur users.'
            );
        }
    }
}
