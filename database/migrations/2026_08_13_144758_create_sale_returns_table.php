<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(
            'sale_returns',
            function (Blueprint $table) {
                $table->id();

                $table->string(
                    'return_number',
                    50
                )->unique();

                $table->foreignId('sale_id')
                    ->constrained('sales')
                    ->restrictOnDelete();

                $table->foreignId('location_id')
                    ->constrained('locations')
                    ->restrictOnDelete();

                $table->foreignId('created_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->foreignId('validated_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->foreignId('cancelled_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->string('status', 30)
                    ->default('draft')
                    ->index();

                $table->string(
                    'refund_status',
                    30
                )
                    ->default('not_required')
                    ->index();

                $table->text('reason');

                $table->text('notes')
                    ->nullable();

                $table->text(
                    'cancellation_reason'
                )->nullable();

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
                    'refunded_amount',
                    15,
                    2
                )->default(0);

                $table->timestamp(
                    'validated_at'
                )->nullable();

                $table->timestamp(
                    'cancelled_at'
                )->nullable();

                $table->timestamps();

                $table->index(
                    [
                        'sale_id',
                        'status',
                    ],
                    'sale_returns_sale_status_index'
                );

                $table->index(
                    [
                        'location_id',
                        'created_at',
                    ],
                    'sale_returns_location_date_index'
                );
            }
        );
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'sale_returns'
        );
    }
};
