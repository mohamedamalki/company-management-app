<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(
            'expenses',
            function (Blueprint $table) {
                $table->id();

                $table->string(
                    'expense_number',
                    50
                )->unique();

                $table->foreignId(
                    'expense_category_id'
                )
                    ->constrained(
                        'expense_categories'
                    )
                    ->restrictOnDelete();

                /*
                 * Null means that the expense belongs
                 * to the entire company.
                 */
                $table->foreignId(
                    'location_id'
                )
                    ->nullable()
                    ->constrained(
                        'locations'
                    )
                    ->restrictOnDelete();

                /*
                 * Optional because expenses such as
                 * salaries may not have a supplier.
                 */
                $table->foreignId(
                    'supplier_id'
                )
                    ->nullable()
                    ->constrained(
                        'suppliers'
                    )
                    ->nullOnDelete();

                /*
                 * The selected TVA configuration.
                 */
                $table->foreignId(
                    'tax_rate_id'
                )
                    ->nullable()
                    ->constrained(
                        'tax_rates'
                    )
                    ->nullOnDelete();

                $table->foreignId(
                    'created_by'
                )
                    ->constrained(
                        'users'
                    )
                    ->restrictOnDelete();

                $table->foreignId(
                    'approved_by'
                )
                    ->nullable()
                    ->constrained(
                        'users'
                    )
                    ->nullOnDelete();

                $table->foreignId(
                    'cancelled_by'
                )
                    ->nullable()
                    ->constrained(
                        'users'
                    )
                    ->nullOnDelete();

                $table->string('title');

                $table->string(
                    'bill_reference',
                    100
                )->nullable();

                $table->date(
                    'issue_date'
                );

                $table->decimal(
                    'amount_ht',
                    15,
                    2
                )->default(0);

                /*
                 * TVA rate snapshot.
                 *
                 * Even if the TaxRate model changes later,
                 * this expense keeps its original rate.
                 */
                $table->decimal(
                    'tax_rate',
                    8,
                    4
                )->default(0);

                $table->decimal(
                    'tax_amount',
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

                $table->string(
                    'payment_status',
                    30
                )->default('unpaid');

                $table->string(
                    'status',
                    30
                )->default('draft');

                $table->text(
                    'notes'
                )->nullable();

                $table->string(
                    'document_path'
                )->nullable();

                $table->timestamp(
                    'approved_at'
                )->nullable();

                $table->timestamp(
                    'cancelled_at'
                )->nullable();

                $table->text(
                    'cancellation_reason'
                )->nullable();

                $table->timestamps();

                $table->index(
                    [
                        'status',
                        'payment_status',
                    ],
                    'expenses_status_payment_index'
                );

                $table->index(
                    [
                        'location_id',
                        'issue_date',
                    ],
                    'expenses_location_issue_index'
                );

                $table->index(
                    [
                        'expense_category_id',
                        'issue_date',
                    ],
                    'expenses_category_issue_index'
                );

                $table->index(
                    [
                        'payment_status',
                    ],
                    'expenses_payment_status_index'
                );
            }
        );
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'expenses'
        );
    }
};
