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
            'location-stocks.view',
            'location-stocks.manage',

            'stock-movements.view',
            'stock-movements.manage',
            'purchase-receipts.view',
            'purchase-receipts.manage',
            'purchase-receipts.validate',
            'customers.view',
            'customers.manage',

            'sales.view',
            'sales.manage',
            'sales.confirm',
            'sales.cancel',

            'sale-payments.view',
            'sale-payments.manage',
            'fournisseurs.view',
            'fournisseurs.manage',
            'fournisseurs.statement',
            'sale-payments.view',
            'sale-payments.manage',
            'sale-returns.view',
            'sale-returns.manage',
            'dashboard.view',
            'expenses.view',
            'expenses.manage',
            'expenses.approve',
            'expenses.pay',

            'expense-categories.view',
            'expense-categories.manage',
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
