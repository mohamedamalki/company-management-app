<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PurchaseOrder extends Model
{
    use HasFactory;

    public const RECEIVING_PENDING = 'pending';

    public const RECEIVING_PARTIALLY_RECEIVED = 'partially_received';

    public const RECEIVING_RECEIVED = 'received';

    protected $fillable = [
        'order_number',
        'supplier_id',
        'location_id',
        'created_by',
        'order_date',
        'expected_date',
        'status',
        'receiving_status',
        'subtotal_ht',
        'tax_amount',
        'total_ttc',
        'notes',
    ];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(
            Supplier::class
        );
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(
            Location::class
        );
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'created_by'
        );
    }

    public function items(): HasMany
    {
        return $this->hasMany(
            PurchaseOrderItem::class
        );
    }

    public function receipts(): HasMany
    {
        return $this->hasMany(
            PurchaseReceipt::class
        );
    }
}
