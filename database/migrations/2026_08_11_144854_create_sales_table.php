<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales',function (Blueprint $table) {
                $table->id();

                $table->string(
                    'sale_number',
                    50
                )->unique();

                $table->foreignId(
                    'customer_id'
                )
                    ->nullable()
                    ->constrained('customers')
                    ->nullOnDelete();

                $table->foreignId(
                    'location_id'
                )
                    ->constrained('locations')
                    ->restrictOnDelete();

                $table->foreignId(
                    'created_by'
                )
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->timestamp(
                    'sale_date'
                )->useCurrent();

                $table->enum('status', [
                    'draft',
                    'confirmed',
                    'cancelled',
                ])->default('draft');

                $table->decimal(
                    'subtotal_ht',
                    15,
                    2
                )->default(0);

                $table->decimal(
                    'discount_total',
                    15,
                    2
                )->default(0);

                $table->decimal(
                    'tax_total',
                    15,
                    2
                )->default(0);

                $table->decimal(
                    'total_ttc',
                    15,
                    2
                )->default(0);

                $table->decimal(
                    'paid_amount',
                    15,
                    2
                )->default(0);

                $table->enum(
                    'payment_status',
                    [
                        'unpaid',
                        'partially_paid',
                        'paid',
                    ]
                )->default('unpaid');

                $table->foreignId(
                    'confirmed_by'
                )
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->timestamp(
                    'confirmed_at'
                )->nullable();

                $table->foreignId(
                    'cancelled_by'
                )
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->timestamp(
                    'cancelled_at'
                )->nullable();

                $table->string(
                    'cancellation_reason',
                    1000
                )->nullable();

                $table->text(
                    'notes'
                )->nullable();

                $table->timestamps();

                $table->index([
                    'location_id',
                    'status',
                    'sale_date',
                ], 'sales_location_status_date_index');

                $table->index([
                    'customer_id',
                    'sale_date',
                ], 'sales_customer_date_index');
            }
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
