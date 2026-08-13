<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Sale extends Model
{
    use HasFactory;

    public const STATUS_DRAFT =
        'draft';

    public const STATUS_CONFIRMED =
        'confirmed';

    public const STATUS_CANCELLED =
        'cancelled';

    public const PAYMENT_UNPAID =
        'unpaid';

    public const PAYMENT_PARTIALLY_PAID =
        'partially_paid';

    public const PAYMENT_PAID =
        'paid';

    protected $fillable = [
        'sale_number',
        'customer_id',
        'location_id',
        'created_by',
        'sale_date',
        'status',
        'subtotal_ht',
        'discount_total',
        'tax_total',
        'total_ttc',
        'paid_amount',
        'payment_status',
        'confirmed_by',
        'confirmed_at',
        'cancelled_by',
        'cancelled_at',
        'cancellation_reason',
        'notes',
        'apply_tax',
        'tax_exemption_reason',
    ];

    protected function casts(): array
    {
        return [
            'sale_date' => 'datetime',
            'confirmed_at' => 'datetime',
            'cancelled_at' => 'datetime',

            'subtotal_ht' => 'decimal:2',
            'discount_total' => 'decimal:2',
            'tax_total' => 'decimal:2',
            'total_ttc' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'apply_tax' => 'boolean',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(
            Customer::class
        );
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(
            Location::class
        );
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'created_by'
        );
    }

    public function confirmedBy(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'confirmed_by'
        );
    }

    public function cancelledBy(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'cancelled_by'
        );
    }

    public function items(): HasMany
    {
        return $this->hasMany(
            SaleItem::class
        );
    }

    public function payments(): HasMany
    {
        return $this->hasMany(
            SalePayment::class
        );
    }

    public function stockMovements(): MorphMany
    {
        return $this->morphMany(
            StockMovement::class,
            'reference'
        );
    }
}
