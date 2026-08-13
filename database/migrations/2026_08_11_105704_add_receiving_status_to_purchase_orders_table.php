<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
                $table->string(
                    'receiving_status',
                    30
                )
                    ->default('pending')
                    ->after('status')
                    ->index();
            }
        );
    }

    public function down(): void
    {
        Schema::table(
            'purchase_orders',
            function (Blueprint $table) {
                $table->dropColumn(
                    'receiving_status'
                );
            }
        );
    }
};
