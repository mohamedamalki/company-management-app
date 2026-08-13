<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->boolean('apply_tax')
                ->default(true)
                ->after('sale_date');

            $table->string('tax_exemption_reason')
                ->nullable()
                ->after('apply_tax');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn([
                'apply_tax',
                'tax_exemption_reason',
            ]);
        });
    }
};
