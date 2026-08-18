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
                'due_date' => '17'
            ],
            [
                'name' => 'Water',
                'code' => 'WATER',
                'due_date' => '17'
            ],
            [
                'name' => 'Rent',
                'code' => 'RENT',
                'due_date' => '17'
            ],
            [
                'name' => 'Salaries',
                'code' => 'SALARIES',
                'due_date' => '17'
            ],
            [
                'name' => 'Internet',
                'code' => 'INTERNET',
                'due_date' => '17'
            ],
        ];

        foreach ($categories as $category) {
            ExpenseCategory::updateOrCreate(
                [
                    'code' => $category['code'],
                ],
                [
                    'name' => $category['name'],
                    'due_date' => $category['due_date'],
                    'is_active' => true,
                ]

            );
        }
    }
}
