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
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();

            $table->foreignId('location_id')
                ->constrained('locations')
                ->restrictOnDelete();

            $table->foreignId('product_id')
                ->constrained('products')
                ->restrictOnDelete();

            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('type', 50)
                ->index();

            $table->decimal('quantity', 15, 3);
            $table->decimal('quantity_before', 15, 3);
            $table->decimal('quantity_after', 15, 3);

            $table->nullableMorphs('reference');

            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index([
                'location_id',
                'product_id',
                'created_at',
            ], 'stock_movements_location_product_date_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
