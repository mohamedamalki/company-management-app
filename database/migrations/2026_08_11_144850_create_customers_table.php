<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(
            'customers',
            function (Blueprint $table) {
                $table->id();

                /*
                 * Only fournisseurs need an
                 * application user account.
                 */
                $table->foreignId('user_id')
                    ->nullable()
                    ->unique()
                    ->constrained('users')
                    ->nullOnDelete();

                /*
                 * Generated automatically:
                 * CUS-000001, CUS-000002...
                 */
                $table->string(
                    'code',
                    50
                )->unique();

                /*
                 * registered:
                 * A normal registered customer.
                 *
                 * fournisseur:
                 * A user who buys products from
                 * the company for resale.
                 */
                $table->enum('category', [
                    'registered',
                    'fournisseur',
                ])->default('registered');

                $table->enum(
                    'entity_type',
                    [
                        'individual',
                        'company',
                    ]
                )->default('individual');

                /*
                 * Required only when a customer
                 * account is created. Walk-in
                 * buyers do not get a record.
                 */
                $table->string('name');

                $table->string(
                    'phone',
                    30
                )->nullable();

                $table->string(
                    'email'
                )->nullable();

                /*
                 * Mainly used by companies and
                 * fournisseurs needing invoices.
                 */
                $table->string(
                    'ice',
                    15
                )
                    ->nullable()
                    ->unique();

                $table->string(
                    'address'
                )->nullable();

                $table->string(
                    'city',
                    100
                )->nullable();

                $table->enum('status', [
                    'active',
                    'inactive',
                ])->default('active');

                $table->text('notes')
                    ->nullable();

                $table->timestamps();

                $table->index([
                    'category',
                    'status',
                ], 'customers_category_status_index');

                $table->index(
                    'name',
                    'customers_name_index'
                );
            }
        );
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'customers'
        );
    }
};
