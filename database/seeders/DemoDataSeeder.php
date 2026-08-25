<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Location;
use App\Models\LocationStock;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ProductPrice;
use App\Models\ProductPriceTier;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\TaxRate;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use RuntimeException;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->environment('production')) {
            throw new RuntimeException(
                'Demo data cannot be seeded in production.'
            );
        }

        DB::transaction(function () {
            $this->createRoles();
            $users = $this->createUsers();
            $locations = $this->createLocations();

            $this->assignLocations(
                $users,
                $locations
            );

            $this->assignPermissions($users);

            $categories = $this->createCategories();
            $brands = $this->createBrands();
            $taxRates = $this->createTaxRates();

            $this->createPaymentMethods();

            $products = $this->createProducts(
                $categories,
                $brands
            );

            $this->createProductPrices(
                $products,
                $taxRates
            );

            $this->createOpeningStock(
                $locations,
                $products,
                $users['admin']
            );

            $this->createSuppliers();

            $this->createFournisseurs(
                $users
            );
        });

        app(PermissionRegistrar::class)
            ->forgetCachedPermissions();
    }

    private function createRoles(): void
    {
        foreach ([
            'admin',
            'responsable',
            'fournisseur',
        ] as $role) {
            Role::firstOrCreate([
                'name' => $role,
                'guard_name' => 'web',
            ]);
        }
    }

    private function createUsers(): array
    {
        $password = Hash::make(
            'Password123!'
        );

        $admin = User::updateOrCreate(
            [
                'email' => 'admin@demo.ma',
            ],
            [
                'name' => 'Admin Demo',
                'password' => $password,
                'role' => 'admin',
                'status' => 'active',
            ]
        );

        $responsable = User::updateOrCreate(
            [
                'email' =>
                    'responsable@demo.ma',
            ],
            [
                'name' =>
                    'Mohamed Responsable',
                'password' => $password,
                'role' => 'responsable',
                'status' => 'active',
            ]
        );

        $depotResponsable =
            User::updateOrCreate(
                [
                    'email' =>
                        'sara@demo.ma',
                ],
                [
                    'name' =>
                        'Sara Responsable',
                    'password' => $password,
                    'role' => 'responsable',
                    'status' => 'active',
                ]
            );

        $fournisseur =
            User::updateOrCreate(
                [
                    'email' =>
                        'fournisseur@demo.ma',
                ],
                [
                    'name' =>
                        'Ahmed Fournisseur',
                    'password' => $password,
                    'role' => 'fournisseur',
                    'status' => 'active',
                ]
            );

        $admin->syncRoles('admin');

        $responsable->syncRoles(
            'responsable'
        );

        $depotResponsable->syncRoles(
            'responsable'
        );

        $fournisseur->syncRoles(
            'fournisseur'
        );

        return [
            'admin' => $admin,
            'responsable' => $responsable,
            'depot_responsable' =>
                $depotResponsable,
            'fournisseur' => $fournisseur,
        ];
    }

    private function createLocations(): array
    {
        $depot = Location::updateOrCreate(
            [
                'code' => 'DEP-AG-01',
            ],
            [
                'name' => 'Dépôt Agadir',
                'type' => 'depot',
                'address' =>
                    'Zone Industrielle Tassila, Agadir',
                'phone' => '0528001001',
                'status' => 'active',
            ]
        );

        $bensergao =
            Location::updateOrCreate(
                [
                    'code' => 'MAG-BEN-01',
                ],
                [
                    'name' =>
                        'Magasin Bensergao',
                    'type' => 'magasin',
                    'address' =>
                        'Avenue Mohammed V, Bensergao',
                    'phone' => '0528001002',
                    'status' => 'active',
                ]
            );

        $dakhla = Location::updateOrCreate(
            [
                'code' => 'MAG-DAK-01',
            ],
            [
                'name' => 'Magasin Dakhla',
                'type' => 'magasin',
                'address' =>
                    'Quartier Dakhla, Agadir',
                'phone' => '0528001003',
                'status' => 'active',
            ]
        );

        return [
            'depot' => $depot,
            'bensergao' => $bensergao,
            'dakhla' => $dakhla,
        ];
    }

    private function assignLocations(
        array $users,
        array $locations
    ): void {
        $users['responsable']
            ->assignedLocations()
            ->syncWithoutDetaching([
                $locations['bensergao']->id,
            ]);

        $users['depot_responsable']
            ->assignedLocations()
            ->syncWithoutDetaching([
                $locations['depot']->id,
            ]);

        $users['fournisseur']
            ->assignedLocations()
            ->syncWithoutDetaching([
                $locations['bensergao']->id,
            ]);
    }

    private function assignPermissions(
        array $users
    ): void {
        $responsablePermissions = [
            'dashboard.view',
            'locations.view',
            'categories.view',
            'brands.view',
            'products.view',
            'product-prices.view',
            'location-stocks.view',
            'location-stocks.manage',
            'stock-movements.view',
            'stock-movements.manage',
            'customers.view',
            'sales.view',
            'sales.manage',
            'sales.confirm',
            'sales.cancel',
            'sale-payments.view',
            'sale-payments.manage',
            'expenses.view',
        ];

        $existingPermissions =
            Permission::query()
                ->where('guard_name', 'web')
                ->whereIn(
                    'name',
                    $responsablePermissions
                )
                ->pluck('name');

        $users['responsable']
            ->syncPermissions(
                $existingPermissions
            );

        $users['depot_responsable']
            ->syncPermissions(
                $existingPermissions
            );
    }

    private function createCategories(): array
    {
        $data = [
            'drinks' => [
                'name' => 'Drinks',
                'description' =>
                    'Water, juice and soft drinks.',
            ],

            'dairy' => [
                'name' => 'Dairy products',
                'description' =>
                    'Milk and dairy products.',
            ],

            'grocery' => [
                'name' => 'Grocery',
                'description' =>
                    'Food and packaged grocery products.',
            ],

            'cleaning' => [
                'name' => 'Cleaning',
                'description' =>
                    'Household cleaning products.',
            ],

            'personal_care' => [
                'name' => 'Personal care',
                'description' =>
                    'Hygiene and personal care products.',
            ],
        ];

        $categories = [];

        foreach ($data as $key => $values) {
            $categories[$key] =
                Category::updateOrCreate(
                    [
                        'name' => $values['name'],
                    ],
                    $values
                );
        }

        return $categories;
    }

    private function createBrands(): array
    {
        $data = [
            'coca_cola' => [
                'name' => 'Coca-Cola',
                'description' =>
                    'Soft drink brand.',
            ],

            'sidi_ali' => [
                'name' => 'Sidi Ali',
                'description' =>
                    'Mineral water brand.',
            ],

            'centrale' => [
                'name' =>
                    'Centrale Danone',
                'description' =>
                    'Dairy product brand.',
            ],

            'bimo' => [
                'name' => 'Bimo',
                'description' =>
                    'Biscuits and snacks.',
            ],

            'ariel' => [
                'name' => 'Ariel',
                'description' =>
                    'Cleaning product brand.',
            ],
        ];

        $brands = [];

        foreach ($data as $key => $values) {
            $brands[$key] =
                Brand::updateOrCreate(
                    [
                        'name' => $values['name'],
                    ],
                    $values
                );
        }

        return $brands;
    }

    private function createTaxRates(): array
    {
        $data = [
            'tva_20' => [
                'name' => 'Standard TVA',
                'code' => 'TVA20',
                'rate' => 20,
                'status' => 'active',
            ],

            'tva_10' => [
                'name' => 'Reduced TVA',
                'code' => 'TVA10',
                'rate' => 10,
                'status' => 'active',
            ],

            'tva_0' => [
                'name' => 'Exempt',
                'code' => 'TVA0',
                'rate' => 0,
                'status' => 'active',
            ],
        ];

        $taxRates = [];

        foreach ($data as $key => $values) {
            $taxRates[$key] =
                TaxRate::updateOrCreate(
                    [
                        'code' => $values['code'],
                    ],
                    $values
                );
        }

        return $taxRates;
    }

    private function createPaymentMethods(): void
    {
        $methods = [
            [
                'name' => 'Cash',
                'code' => 'CASH',
                'requires_reference' =>
                    false,
                'status' => 'active',
            ],

            [
                'name' => 'Bank card',
                'code' => 'CARD',
                'requires_reference' =>
                    false,
                'status' => 'active',
            ],

            [
                'name' =>
                    'Bank transfer',
                'code' => 'TRANSFER',
                'requires_reference' =>
                    true,
                'status' => 'active',
            ],

            [
                'name' => 'Cheque',
                'code' => 'CHEQUE',
                'requires_reference' =>
                    true,
                'status' => 'active',
            ],
        ];

        foreach ($methods as $method) {
            PaymentMethod::updateOrCreate(
                [
                    'code' => $method['code'],
                ],
                $method
            );
        }
    }

    private function createProducts(
        array $categories,
        array $brands
    ): array {
        $data = [
            'coca_cola' => [
                'category_id' =>
                    $categories['drinks']->id,
                'brand_id' =>
                    $brands['coca_cola']->id,
                'name' => 'Coca-Cola 1L',
                'reference' =>
                    'PR-COCA-001',
                'description' =>
                    'Coca-Cola bottle 1 litre.',
                'unit' => 'piece',
            ],

            'water' => [
                'category_id' =>
                    $categories['drinks']->id,
                'brand_id' =>
                    $brands['sidi_ali']->id,
                'name' =>
                    'Sidi Ali Water 1.5L',
                'reference' =>
                    'PR-WATER-001',
                'description' =>
                    'Mineral water bottle 1.5 litres.',
                'unit' => 'piece',
            ],

            'milk' => [
                'category_id' =>
                    $categories['dairy']->id,
                'brand_id' =>
                    $brands['centrale']->id,
                'name' => 'Fresh Milk 1L',
                'reference' =>
                    'PR-MILK-001',
                'description' =>
                    'Fresh milk 1 litre.',
                'unit' => 'piece',
            ],

            'biscuits' => [
                'category_id' =>
                    $categories['grocery']->id,
                'brand_id' =>
                    $brands['bimo']->id,
                'name' =>
                    'Bimo Biscuits Pack',
                'reference' =>
                    'PR-BIMO-001',
                'description' =>
                    'Pack of Bimo biscuits.',
                'unit' => 'pack',
            ],

            'detergent' => [
                'category_id' =>
                    $categories['cleaning']->id,
                'brand_id' =>
                    $brands['ariel']->id,
                'name' =>
                    'Ariel Detergent 3KG',
                'reference' =>
                    'PR-ARIEL-001',
                'description' =>
                    'Ariel detergent pack 3KG.',
                'unit' => 'piece',
            ],
        ];

        $products = [];

        foreach ($data as $key => $values) {
            $products[$key] =
                Product::updateOrCreate(
                    [
                        'reference' =>
                            $values['reference'],
                    ],
                    $values
                );
        }

        return $products;
    }

    private function createProductPrices(
        array $products,
        array $taxRates
    ): void {
        $prices = [
            'coca_cola' => [
                'sale_price_ht' => 8.33,
                'tax_rate_id' =>
                    $taxRates['tva_20']->id,
                'tiers' => [
                    [
                        'min_quantity' => 10,
                        'unit_price_ht' => 7.50,
                    ],
                    [
                        'min_quantity' => 50,
                        'unit_price_ht' => 6.80,
                    ],
                ],
            ],

            'water' => [
                'sale_price_ht' => 4.55,
                'tax_rate_id' =>
                    $taxRates['tva_10']->id,
                'tiers' => [
                    [
                        'min_quantity' => 12,
                        'unit_price_ht' => 4.20,
                    ],
                    [
                        'min_quantity' => 48,
                        'unit_price_ht' => 3.80,
                    ],
                ],
            ],

            'milk' => [
                'sale_price_ht' => 8.18,
                'tax_rate_id' =>
                    $taxRates['tva_10']->id,
                'tiers' => [],
            ],

            'biscuits' => [
                'sale_price_ht' => 4.55,
                'tax_rate_id' =>
                    $taxRates['tva_10']->id,
                'tiers' => [],
            ],

            'detergent' => [
                'sale_price_ht' => 50,
                'tax_rate_id' =>
                    $taxRates['tva_20']->id,
                'tiers' => [],
            ],
        ];

        foreach ($prices as $key => $data) {
            $price =
                ProductPrice::updateOrCreate(
                    [
                        'product_id' =>
                            $products[$key]->id,
                        'location_id' => null,
                        'status' => 'active',
                    ],
                    [
                        'tax_rate_id' =>
                            $data['tax_rate_id'],
                        'sale_price_ht' =>
                            $data['sale_price_ht'],
                        'starts_at' =>
                            '2026-01-01 00:00:00',
                        'ends_at' => null,
                    ]
                );

            foreach (
                $data['tiers'] as $tier
            ) {
                ProductPriceTier::updateOrCreate(
                    [
                        'product_price_id' =>
                            $price->id,
                        'min_quantity' =>
                            $tier[
                                'min_quantity'
                            ],
                    ],
                    [
                        'unit_price_ht' =>
                            $tier[
                                'unit_price_ht'
                            ],
                    ]
                );
            }
        }
    }

    private function createOpeningStock(
        array $locations,
        array $products,
        User $admin
    ): void {
        $stocks = [
            'depot' => [
                'coca_cola' => [500, 100],
                'water' => [800, 150],
                'milk' => [250, 50],
                'biscuits' => [400, 80],
                'detergent' => [100, 20],
            ],

            'bensergao' => [
                'coca_cola' => [80, 20],
                'water' => [120, 30],
                'milk' => [40, 15],
                'biscuits' => [60, 15],
                'detergent' => [15, 5],
            ],
        ];

        foreach (
            $stocks as $locationKey =>
            $locationProducts
        ) {
            foreach (
                $locationProducts as
                $productKey => $values
            ) {
                [$quantity, $minimum] =
                    $values;

                LocationStock::updateOrCreate(
                    [
                        'location_id' =>
                            $locations[
                                $locationKey
                            ]->id,

                        'product_id' =>
                            $products[
                                $productKey
                            ]->id,
                    ],
                    [
                        'quantity' => $quantity,
                        'minimum_quantity' =>
                            $minimum,
                    ]
                );

                StockMovement::updateOrCreate(
                    [
                        'location_id' =>
                            $locations[
                                $locationKey
                            ]->id,

                        'product_id' =>
                            $products[
                                $productKey
                            ]->id,

                        'type' =>
                            'opening_stock',

                        'notes' =>
                            'DEMO INITIAL STOCK',
                    ],
                    [
                        'user_id' => $admin->id,
                        'quantity' => $quantity,
                        'quantity_before' => 0,
                        'quantity_after' =>
                            $quantity,
                    ]
                );
            }
        }
    }

    private function createSuppliers(): void
    {
        $suppliers = [
            [
                'code' => 'SUP-001',
                'name' =>
                    'Atlas Distribution',
                'contact_name' =>
                    'Youssef Amrani',
                'phone' => '0611223344',
                'email' =>
                    'contact@atlas-demo.ma',
                'ice' =>
                    '001122334455667',
                'address' =>
                    'Zone Industrielle Tassila, Agadir',
                'is_active' => true,
            ],

            [
                'code' => 'SUP-002',
                'name' =>
                    'Souss Alimentaire',
                'contact_name' =>
                    'Salma Idrissi',
                'phone' => '0622334455',
                'email' =>
                    'contact@souss-demo.ma',
                'ice' =>
                    '002233445566778',
                'address' =>
                    'Ait Melloul, Agadir',
                'is_active' => true,
            ],

            [
                'code' => 'SUP-003',
                'name' =>
                    'CleanPro Maroc',
                'contact_name' =>
                    'Hamza Alaoui',
                'phone' => '0633445566',
                'email' =>
                    'contact@cleanpro-demo.ma',
                'ice' =>
                    '003344556677889',
                'address' =>
                    'Casablanca, Morocco',
                'is_active' => true,
            ],
        ];

        foreach ($suppliers as $supplier) {
            Supplier::updateOrCreate(
                [
                    'code' =>
                        $supplier['code'],
                ],
                $supplier
            );
        }
    }

    private function createFournisseurs(
        array $users
    ): void {
        Customer::updateOrCreate(
            [
                'code' => 'FR-001',
            ],
            [
                'user_id' =>
                    $users['fournisseur']->id,
                'category' =>
                    Customer::CATEGORY_FOURNISSEUR,
                'entity_type' =>
                    Customer::ENTITY_COMPANY,
                'name' =>
                    'Épicerie Al Amal',
                'phone' => '0644556677',
                'email' =>
                    'fournisseur@demo.ma',
                'ice' =>
                    '004455667788990',
                'address' =>
                    'Bensergao, Agadir',
                'city' => 'Agadir',
                'status' =>
                    Customer::STATUS_ACTIVE,
                'credit_limit' => 10000,
                'payment_terms_days' => 30,
                'notes' =>
                    'Demo reseller customer.',
            ]
        );

        Customer::updateOrCreate(
            [
                'code' => 'FR-002',
            ],
            [
                'user_id' => null,
                'category' =>
                    Customer::CATEGORY_FOURNISSEUR,
                'entity_type' =>
                    Customer::ENTITY_COMPANY,
                'name' =>
                    'Marché Tifawin',
                'phone' => '0655667788',
                'email' =>
                    'tifawin@demo.ma',
                'ice' =>
                    '005566778899001',
                'address' =>
                    'Dakhla, Agadir',
                'city' => 'Agadir',
                'status' =>
                    Customer::STATUS_ACTIVE,
                'credit_limit' => 15000,
                'payment_terms_days' => 15,
                'notes' =>
                    'Demo reseller customer.',
            ]
        );
    }
}
