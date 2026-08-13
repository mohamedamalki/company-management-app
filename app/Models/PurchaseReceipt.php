<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class PurchaseReceipt extends Model
{
    use HasFactory;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_VALIDATED = 'validated';

    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'receipt_number',
        'purchase_order_id',
        'location_id',
        'created_by',
        'validated_by',
        'status',
        'received_at',
        'validated_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'received_at' => 'datetime',
            'validated_at' => 'datetime',
        ];
    }

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(
            PurchaseOrder::class
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

    public function validator(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'validated_by'
        );
    }

    public function items(): HasMany
    {
        return $this->hasMany(
            PurchaseReceiptItem::class
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
