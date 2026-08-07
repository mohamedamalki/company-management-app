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
    Schema::create('purchase_orders', function (Blueprint $table) {
    $table->id();

    $table->string('order_number')
        ->unique();

    $table->foreignId('supplier_id')
        ->constrained('suppliers')
        ->restrictOnDelete();

    $table->foreignId('location_id')
        ->constrained('locations')
        ->restrictOnDelete();

    $table->foreignId('created_by')
        ->constrained('users')
        ->restrictOnDelete();

    $table->date('order_date');

    $table->date('expected_date')
        ->nullable();

    $table->enum('status', [
        'draft',
        'ordered',
        'partially_received',
        'received',
        'cancelled',
    ])->default('draft');

    $table->decimal(
        'subtotal_ht',
        14,
        2
    )->default(0);

    $table->decimal(
        'tax_amount',
        14,
        2
    )->default(0);

    $table->decimal(
        'total_ttc',
        14,
        2
    )->default(0);

    $table->text('notes')
        ->nullable();

    $table->timestamps();
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_orders');
    }
};
