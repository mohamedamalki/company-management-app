<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(
            'expense_payments',
            function (Blueprint $table) {
                $table->id();

                $table->string(
                    'payment_number',
                    50
                )->unique();

                $table->foreignId(
                    'expense_id'
                )
                    ->constrained(
                        'expenses'
                    )
                    ->restrictOnDelete();

                $table->foreignId(
                    'payment_method_id'
                )
                    ->constrained(
                        'payment_methods'
                    )
                    ->restrictOnDelete();

                $table->foreignId(
                    'paid_by'
                )
                    ->nullable()
                    ->constrained(
                        'users'
                    )
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

                $table->text(
                    'notes'
                )->nullable();

                $table->timestamps();

                $table->index(
                    [
                        'expense_id',
                        'paid_at',
                    ],
                    'expense_payments_expense_date_index'
                );

                $table->index(
                    [
                        'payment_method_id',
                        'paid_at',
                    ],
                    'expense_payments_method_date_index'
                );
            }
        );
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'expense_payments'
        );
    }
};
