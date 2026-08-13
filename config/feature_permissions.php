<?php

return [
    'features' => [
        'locations' => [
            'label' => 'Locations',
            'assignable' => true,

            'permissions' => [
                'locations.view' =>
                    'View locations',

                'locations.manage' =>
                    'Manage locations',
            ],
        ],

        'categories' => [
            'label' => 'Categories',
            'assignable' => true,

            'permissions' => [
                'categories.view' =>
                    'View categories',

                'categories.manage' =>
                    'Manage categories',
            ],
        ],

        'brands' => [
            'label' => 'Brands',
            'assignable' => true,

            'permissions' => [
                'brands.view' =>
                    'View brands',

                'brands.manage' =>
                    'Manage brands',
            ],
        ],

        'products' => [
            'label' => 'Products',
            'assignable' => true,

            'permissions' => [
                'products.view' =>
                    'View products',

                'products.manage' =>
                    'Manage products',
            ],
        ],

        'product-prices' => [
            'label' => 'Product prices',
            'assignable' => true,

            'permissions' => [
                'product-prices.view' =>
                    'View product prices',

                'product-prices.manage' =>
                    'Manage product prices',
            ],
        ],

        'suppliers' => [
            'label' => 'Suppliers',
            'assignable' => true,

            'permissions' => [
                'suppliers.view' =>
                    'View suppliers',

                'suppliers.manage' =>
                    'Manage suppliers',
            ],
        ],

        'purchase-orders' => [
            'label' => 'Purchase orders',
            'assignable' => true,

            'permissions' => [
                'purchase-orders.view' =>
                    'View purchase orders',

                'purchase-orders.manage' =>
                    'Manage purchase orders',
            ],
        ],

        'payment-methods' => [
            'label' => 'Payment methods',
            'assignable' => true,

            'permissions' => [
                'payment-methods.view' =>
                    'View payment methods',

                'payment-methods.manage' =>
                    'Manage payment methods',
            ],
        ],

        'tax-rates' => [
            'label' => 'TVA rates',
            'assignable' => true,

            'permissions' => [
                'tax-rates.view' =>
                    'View TVA rates',

                'tax-rates.manage' =>
                    'Manage TVA rates',
            ],
        ],

        'location-assignments' => [
            'label' =>
                'Location assignments',

            'assignable' => false,

            'permissions' => [
                'location-assignments.view' =>
                    'View assignments',

                'location-assignments.manage' =>
                    'Manage assignments',
            ],
        ],

        'users' => [
            'label' => 'Users',
            'assignable' => false,

            'permissions' => [
                'users.manage' =>
                    'Manage users',
            ],
        ],

        'permissions' => [
            'label' => 'Permissions',
            'assignable' => false,

            'permissions' => [
                'permissions.manage' =>
                    'Manage permissions',
            ],
        ],

        'location-stocks' => [
            'label' => 'Location stocks',
            'assignable' => true,

            'permissions' => [
                'location-stocks.view' =>
                    'View location stocks',

                'location-stocks.manage' =>
                    'Manage location stocks',
            ],
        ],

        'stock-movements' => [
            'label' => 'Stock movements',
            'assignable' => true,

            'permissions' => [
                'stock-movements.view' => 'View stock movements',
                'stock-movements.manage' => 'Manage stock movements',
            ],
        ],

        'purchase-receipts' => [
            'label' => 'Purchase receipts',
            'assignable' => true,

            'permissions' => [
                'purchase-receipts.view' =>
                    'View purchase receipts',

                'purchase-receipts.manage' =>
                    'Create and update purchase receipts',

                'purchase-receipts.validate' =>
                    'Validate receipts and update stock',
            ],
        ],

        'customers' => [
    'label' => 'Customers',
    'assignable' => true,

    'permissions' => [
        'customers.view' =>
            'View customers',

        'customers.manage' =>
            'Manage customers',
    ],
],

'sales' => [
    'label' => 'Sales',
    'assignable' => true,

    'permissions' => [
        'sales.view' =>
            'View sales',

        'sales.manage' =>
            'Manage sales',

        'sales.confirm' =>
            'Confirm sales',

        'sales.cancel' =>
            'Cancel sales',
    ],
],

'sale-payments' => [
    'label' => 'Sale payments',
    'assignable' => true,

    'permissions' => [
        'sale-payments.view' =>
            'View sale payments',

        'sale-payments.manage' =>
            'Record sale payments',
    ],
],
    ],
];
