<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::updateOrCreate(
            [
            'email' => 'admin@gmail.com',
            ],
            [
            'name' => 'mohamed',
            'password' => Hash::make('mohamed123456'),
            'role' => 'admin',
            'status' => 'active'
            ]
        );
    }
}
