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
    Schema::create('product_prices', function (Blueprint $table) {
    $table->id();

    $table->foreignId('product_id')
        ->constrained('products')
        ->restrictOnDelete();

    // Null means this is the default price for all locations.
    $table->foreignId('location_id')
        ->nullable()
        ->constrained('locations')
        ->restrictOnDelete();

    $table->foreignId('tax_rate_id')
        ->constrained('tax_rates')
        ->restrictOnDelete();

    $table->decimal('sale_price_ht', 12, 2);

    $table->timestamp('starts_at');
    $table->timestamp('ends_at')->nullable();

    $table->enum('status', [
        'active',
        'inactive',
    ])->default('active');

    $table->timestamps();

    $table->index([
        'product_id',
        'location_id',
        'status',
    ]);
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_prices');
    }
};
