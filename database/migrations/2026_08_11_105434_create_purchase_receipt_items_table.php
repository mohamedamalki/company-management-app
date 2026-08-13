<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_receipt_items', function (Blueprint $table) {
                $table->id();

                $table->foreignId('purchase_receipt_id')
                    ->constrained('purchase_receipts')
                    ->cascadeOnDelete();

                $table->foreignId('purchase_order_item_id')
                    ->constrained('purchase_order_items')
                    ->restrictOnDelete();

                $table->foreignId('product_id')
                    ->constrained('products')
                    ->restrictOnDelete();

                $table->decimal(
                    'received_quantity',
                    15,
                    3
                );

                $table->decimal(
                    'accepted_quantity',
                    15,
                    3
                );

                $table->decimal(
                    'rejected_quantity',
                    15,
                    3
                )->default(0);

                $table->text('notes')->nullable();

                $table->timestamps();

                $table->unique(
                    [
                        'purchase_receipt_id',
                        'purchase_order_item_id',
                    ],
                    'receipt_order_item_unique'
                );
            }
        );
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'purchase_receipt_items'
        );
    }
};
