<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)
            ->forgetCachedPermissions();

        $permissions = [
            'dashboard.view',

            'users.manage',
            'permissions.manage',

            'location-assignments.view',
            'location-assignments.manage',

            'locations.view',
            'locations.manage',

            'categories.view',
            'categories.manage',

            'brands.view',
            'brands.manage',

            'tax-rates.view',
            'tax-rates.manage',

            'products.view',
            'products.manage',

            'product-prices.view',
            'product-prices.manage',

            'suppliers.view',
            'suppliers.manage',

            'purchase-orders.view',
            'purchase-orders.manage',
            'purchase-orders.confirm',
            'purchase-orders.cancel',

            'payment-methods.view',
            'payment-methods.manage',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'web',
            ]);
        }

        $adminRole = Role::firstOrCreate([
            'name' => 'admin',
            'guard_name' => 'web',
        ]);

        $adminRole->syncPermissions($permissions);

        User::query()
            ->where('role', 'admin')
            ->each(function (User $admin) {
                $admin->syncRoles('admin');
            });

        app(PermissionRegistrar::class)
            ->forgetCachedPermissions();
    }
}
