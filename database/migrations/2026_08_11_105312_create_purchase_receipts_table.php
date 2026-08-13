<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_receipts', function (Blueprint $table) {
                $table->id();

                $table->string('receipt_number')
                    ->unique();

                $table->foreignId('purchase_order_id')
                    ->constrained('purchase_orders')
                    ->restrictOnDelete();

                $table->foreignId('location_id')
                    ->constrained('locations')
                    ->restrictOnDelete();

                $table->foreignId('created_by')
                    ->constrained('users')
                    ->restrictOnDelete();

                $table->foreignId('validated_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->string('status', 30)
                    ->default('draft')
                    ->index();

                $table->timestamp('received_at')
                    ->nullable();

                $table->timestamp('validated_at')
                    ->nullable();

                $table->text('notes')->nullable();

                $table->timestamps();

                $table->index([
                    'location_id',
                    'status',
                    'received_at',
                ]);
            }
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_receipts');
    }
};
