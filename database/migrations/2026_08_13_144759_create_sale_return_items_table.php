<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(
            'sale_return_items',
            function (Blueprint $table) {
                $table->id();

                $table->foreignId(
                    'sale_return_id'
                )
                    ->constrained(
                        'sale_returns'
                    )
                    ->cascadeOnDelete();

                $table->foreignId(
                    'sale_item_id'
                )
                    ->constrained(
                        'sale_items'
                    )
                    ->restrictOnDelete();

                $table->foreignId(
                    'product_id'
                )
                    ->constrained('products')
                    ->restrictOnDelete();

                $table->decimal(
                    'quantity',
                    15,
                    3
                );

                $table->decimal(
                    'restock_quantity',
                    15,
                    3
                )->default(0);

                $table->decimal(
                    'damaged_quantity',
                    15,
                    3
                )->default(0);

                $table->string(
                    'product_name'
                );

                $table->string(
                    'product_reference'
                )->nullable();

                $table->string(
                    'unit',
                    50
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

                $table->decimal(
                    'tax_rate',
                    8,
                    4
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
                )->default(0);

                $table->decimal(
                    'total_ttc',
                    15,
                    2
                );

                $table->text('notes')
                    ->nullable();

                $table->timestamps();

                $table->unique(
                    [
                        'sale_return_id',
                        'sale_item_id',
                    ],
                    'sale_return_item_unique'
                );
            }
        );
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'sale_return_items'
        );
    }
};
