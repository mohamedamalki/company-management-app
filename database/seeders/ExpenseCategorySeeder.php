<?php

namespace Database\Seeders;

use App\Models\ExpenseCategory;
use Illuminate\Database\Seeder;

class ExpenseCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Electricity',
                'code' => 'ELECTRICITY',
            ],
            [
                'name' => 'Water',
                'code' => 'WATER',
            ],
            [
                'name' => 'Rent',
                'code' => 'RENT',
            ],
            [
                'name' => 'Salaries',
                'code' => 'SALARIES',
            ],
            [
                'name' => 'Internet',
                'code' => 'INTERNET',
            ],
            [
                'name' => 'Maintenance',
                'code' => 'MAINTENANCE',
            ],
            [
                'name' => 'Transport',
                'code' => 'TRANSPORT',
            ],
            [
                'name' => 'Taxes',
                'code' => 'TAXES',
            ],
            [
                'name' => 'Other',
                'code' => 'OTHER',
            ],
        ];

        foreach ($categories as $category) {
            ExpenseCategory::updateOrCreate(
                [
                    'code' => $category['code'],
                ],
                [
                    'name' => $category['name'],
                    'is_active' => true,
                ]
            );
        }
    }
}
