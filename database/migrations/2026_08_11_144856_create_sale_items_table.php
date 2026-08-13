<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sale_items', function (Blueprint $table) {
                $table->id();

                $table->foreignId(
                    'sale_id'
                )
                    ->constrained('sales')
                    ->cascadeOnDelete();

                $table->foreignId(
                    'product_id'
                )
                    ->constrained('products')
                    ->restrictOnDelete();

                /*
                 * Product snapshots preserve the invoice
                 * if product information changes later.
                 */
                $table->string(
                    'product_name'
                );

                $table->string(
                    'product_reference'
                )->nullable();

                $table->string(
                    'unit',
                    50
                )->default('piece');

                $table->decimal(
                    'quantity',
                    15,
                    3
                );

                $table->decimal(
                    'unit_price_ht',
                    15,
                    2
                );

                $table->decimal(
                    'discount_amount',
                    15,
                    2
                )->default(0);

                /*
                 * This is a TVA snapshot, for example 20.00.
                 */
                $table->decimal(
                    'tax_rate',
                    5,
                    2
                )->default(0);

                $table->decimal(
                    'total_ht',
                    15,
                    2
                );

                $table->decimal(
                    'tax_amount',
                    15,
                    2
                );

                $table->decimal(
                    'total_ttc',
                    15,
                    2
                );

                $table->timestamps();

                $table->unique(
                    [
                        'sale_id',
                        'product_id',
                    ],
                    'sale_product_unique'
                );

                $table->index(
                    'product_id',
                    'sale_items_product_index'
                );
            }
        );
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'sale_items'
        );
    }
};
