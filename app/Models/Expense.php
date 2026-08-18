<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Expense extends Model
{
    use HasFactory;

    public const STATUS_DRAFT =
        'draft';

    public const STATUS_APPROVED =
        'approved';

    public const STATUS_CANCELLED =
        'cancelled';

    public const PAYMENT_UNPAID =
        'unpaid';

    public const PAYMENT_PARTIALLY_PAID =
        'partially_paid';

    public const PAYMENT_PAID =
        'paid';

    protected $fillable = [
        'expense_number',
        'expense_category_id',
        'location_id',
        'supplier_id',
        'tax_rate_id',
        'created_by',
        'approved_by',
        'cancelled_by',
        'title',
        'bill_reference',
        'issue_date',
        'amount_ht',
        'tax_rate',
        'tax_amount',
        'total_ttc',
        'paid_amount',
        'payment_status',
        'status',
        'notes',
        'document_path',
        'approved_at',
        'cancelled_at',
        'cancellation_reason',
    ];

    protected $appends = [
        'remaining_amount',
        'is_overdue',
    ];

    protected function casts(): array
    {
        return [
            'issue_date' => 'date',
            'amount_ht' => 'decimal:2',
            'tax_rate' => 'decimal:4',
            'tax_amount' => 'decimal:2',
            'total_ttc' => 'decimal:2',
            'paid_amount' => 'decimal:2',

            'approved_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(
            ExpenseCategory::class,
            'expense_category_id'
        );
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(
            Location::class
        );
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(
            Supplier::class
        );
    }

    public function taxRate(): BelongsTo
    {
        return $this->belongsTo(
            TaxRate::class
        );
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'created_by'
        );
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'approved_by'
        );
    }

    public function canceller(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'cancelled_by'
        );
    }

    public function payments(): HasMany
    {
        return $this->hasMany(
            ExpensePayment::class
        );
    }

    public function getRemainingAmountAttribute(): float
    {
        return round(
            max(
                (float) $this->total_ttc -
                (float) $this->paid_amount,
                0
            ),
            2
        );
    }

    public function getIsOverdueAttribute(): bool
    {
        if (
            !$this->due_date ||
            $this->status !==
                self::STATUS_APPROVED ||
            $this->payment_status ===
                self::PAYMENT_PAID
        ) {
            return false;
        }

        return $this->due_date->isBefore(
            today()
        );
    }

    public function scopeApproved(
        Builder $query
    ): Builder {
        return $query->where(
            'status',
            self::STATUS_APPROVED
        );
    }

    public function scopeOutstanding(
        Builder $query
    ): Builder {
        return $query
            ->where(
                'status',
                self::STATUS_APPROVED
            )
            ->whereIn(
                'payment_status',
                [
                    self::PAYMENT_UNPAID,
                    self::PAYMENT_PARTIALLY_PAID,
                ]
            );
    }

    public function scopeOverdue(
        Builder $query
    ): Builder {
        return $query
            ->outstanding()
            ->whereNotNull(
                'due_date'
            )
            ->whereDate(
                'due_date',
                '<',
                today()
            );
    }
}
