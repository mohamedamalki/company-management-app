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

    public const STATUS_DRAFT = 'draft';
    public const STATUS_CONFIRMED = 'confirmed';
    public const STATUS_CANCELLED = 'cancelled';

    public const PAYMENT_UNPAID = 'unpaid';
    public const PAYMENT_PARTIALLY_PAID =
        'partially_paid';
    public const PAYMENT_PAID = 'paid';

    protected $fillable = [
        'sale_number',
        'customer_id',
        'location_id',
        'created_by',
        'confirmed_by',
        'cancelled_by',
        'sale_date',
        'apply_tax',
        'tax_exemption_reason',
        'status',
        'payment_status',
        'subtotal_ht',
        'discount_total',
        'tax_total',
        'total_ttc',
        'paid_amount',
        'returned_amount',
        'refunded_amount',
        'notes',
        'confirmed_at',
        'cancelled_at',
        'cancellation_reason',
    ];

    /**
     * Automatically include these calculated
     * values in JSON responses.
     */
    protected $appends = [
        'net_total',
        'net_paid_amount',
        'remaining_amount',
        'refundable_amount',
    ];

    protected function casts(): array
    {
        return [
            'sale_date' => 'datetime',
            'confirmed_at' => 'datetime',
            'cancelled_at' => 'datetime',

            'apply_tax' => 'boolean',

            'subtotal_ht' => 'decimal:2',
            'discount_total' => 'decimal:2',
            'tax_total' => 'decimal:2',
            'total_ttc' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'returned_amount' => 'decimal:2',
            'refunded_amount' => 'decimal:2',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

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

    public function saleReturns(): HasMany
    {
        return $this->hasMany(
            SaleReturn::class
        );
    }

    public function refunds(): HasMany
    {
        return $this->hasMany(
            SaleRefund::class
        );
    }

    public function stockMovements(): MorphMany
    {
        return $this->morphMany(
            StockMovement::class,
            'reference'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Calculated attributes
    |--------------------------------------------------------------------------
    */

    /**
     * Sale total after validated returns.
     */
    public function getNetTotalAttribute(): float
    {
        return round(
            max(
                (float) $this->total_ttc -
                (float) $this->returned_amount,
                0
            ),
            2
        );
    }

    /**
     * Money received after refunds.
     */
    public function getNetPaidAmountAttribute(): float
    {
        return round(
            max(
                (float) $this->paid_amount -
                (float) $this->refunded_amount,
                0
            ),
            2
        );
    }

    /**
     * Amount the customer still needs to pay.
     */
    public function getRemainingAmountAttribute(): float
    {
        return round(
            max(
                $this->net_total -
                $this->net_paid_amount,
                0
            ),
            2
        );
    }

    /**
     * Amount the company must refund.
     */
    public function getRefundableAmountAttribute(): float
    {
        return round(
            max(
                $this->net_paid_amount -
                $this->net_total,
                0
            ),
            2
        );
    }
}
