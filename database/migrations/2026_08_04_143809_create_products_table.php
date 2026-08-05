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
    Schema::create('products', function (Blueprint $table) {
    $table->id();

    $table->foreignId('category_id')
        ->constrained('categories')
        ->restrictOnDelete();

    $table->string('name');

    // Internal company product code
    $table->string('sku')->unique();

    // Manufacturer barcode
    $table->string('barcode')
        ->nullable()
        ->unique();

    $table->foreignId('brand_id')
        ->nullable()
        ->constrained('brands')
        ->nullOnDelete();

    $table->text('description')->nullable();

    $table->decimal(
        'purchase_price',
        12,
        2
    );

    $table->decimal(
        'sale_price',
        12,
        2
    );

    $table->string('unit')
        ->default('piece');

    $table->timestamps();
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
