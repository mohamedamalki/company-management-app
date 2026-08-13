<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseReceiptItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_receipt_id',
        'purchase_order_item_id',
        'product_id',
        'received_quantity',
        'accepted_quantity',
        'rejected_quantity',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'received_quantity' => 'decimal:3',
            'accepted_quantity' => 'decimal:3',
            'rejected_quantity' => 'decimal:3',
        ];
    }

    public function purchaseReceipt(): BelongsTo
    {
        return $this->belongsTo(
            PurchaseReceipt::class
        );
    }

    public function purchaseOrderItem(): BelongsTo
    {
        return $this->belongsTo(
            PurchaseOrderItem::class
        );
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(
            Product::class
        );
    }
}
