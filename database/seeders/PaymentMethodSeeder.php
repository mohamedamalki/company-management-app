<?php

namespace Database\Seeders;

use App\Models\PaymentMethod;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PaymentMethodSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $methods = [
            [
                'name' => 'Cash',
                'code' => 'CASH',
                'requires_reference' => false,
            ],
            [
                'name' => 'Bank card',
                'code' => 'CARD',
                'requires_reference' => true,
            ],
            [
                'name' => 'Cheque',
                'code' => 'CHEQUE',
                'requires_reference' => true,
            ],
            [
                'name' => 'Bank transfer',
                'code' => 'BANK_TRANSFER',
                'requires_reference' => true,
            ],
        ];

        foreach ($methods as $method) {
            PaymentMethod::updateOrCreate(
                [
                    'code' => $method['code'],
                ],
                [
                    'name' => $method['name'],
                    'requires_reference' =>
                        $method['requires_reference'],
                    'status' => 'active',
                ]
            );
        }
    }
}
