<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(
            'sale_refunds',
            function (Blueprint $table) {
                $table->id();

                $table->string(
                    'refund_number',
                    50
                )->unique();

                $table->foreignId(
                    'sale_return_id'
                )
                    ->constrained(
                        'sale_returns'
                    )
                    ->restrictOnDelete();

                $table->foreignId('sale_id')
                    ->constrained('sales')
                    ->restrictOnDelete();

                $table->foreignId(
                    'payment_method_id'
                )
                    ->constrained(
                        'payment_methods'
                    )
                    ->restrictOnDelete();

                $table->foreignId(
                    'refunded_by'
                )
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->decimal(
                    'amount',
                    15,
                    2
                );

                $table->string(
                    'reference'
                )->nullable();

                $table->timestamp(
                    'refunded_at'
                )->useCurrent();

                $table->text('notes')
                    ->nullable();

                $table->timestamps();

                $table->index(
                    [
                        'sale_id',
                        'refunded_at',
                    ],
                    'sale_refunds_sale_date_index'
                );

                $table->index(
                    [
                        'sale_return_id',
                        'refunded_at',
                    ],
                    'sale_refunds_return_date_index'
                );
            }
        );
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'sale_refunds'
        );
    }
};
