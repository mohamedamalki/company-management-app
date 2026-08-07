<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
    Schema::create('purchase_order_items', function (Blueprint $table) {
        $table->id();

        $table->foreignId(
            'purchase_order_id'
        )
            ->constrained('purchase_orders')
            ->cascadeOnDelete();

        $table->foreignId('product_id')
            ->constrained('products')
            ->restrictOnDelete();

        $table->decimal(
            'quantity',
            12,
            3
        );

        $table->decimal(
            'unit_price_ht',
            12,
            2
        );

        /*
         * Store the TVA percentage used when
         * the order was created.
         */
        $table->decimal(
            'tax_rate',
            5,
            2
        )->default(0);

        $table->decimal(
            'line_total_ht',
            14,
            2
        );

        $table->decimal(
            'line_tax_amount',
            14,
            2
        );

        $table->decimal(
            'line_total_ttc',
            14,
            2
        );

        $table->timestamps();

        $table->unique([
            'purchase_order_id',
            'product_id',
        ]);
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_order_items');
    }
};
