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
    ],
];
