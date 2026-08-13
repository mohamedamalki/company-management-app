<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(
            'sale_payments',
            function (Blueprint $table) {
                $table->id();

                $table->string(
                    'payment_number',
                    50
                )->unique();

                $table->foreignId(
                    'sale_id'
                )
                    ->constrained('sales')
                    ->cascadeOnDelete();

                $table->foreignId(
                    'payment_method_id'
                )
                    ->constrained(
                        'payment_methods'
                    )
                    ->restrictOnDelete();

                $table->foreignId(
                    'received_by'
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
                    'paid_at'
                )->useCurrent();

                $table->text('notes')
                    ->nullable();

                $table->timestamps();

                $table->index([
                    'sale_id',
                    'paid_at',
                ], 'sale_payments_sale_date_index');
            }
        );
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'sale_payments'
        );
    }
};
