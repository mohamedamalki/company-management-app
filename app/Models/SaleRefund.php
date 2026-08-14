<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleRefund extends Model
{
    use HasFactory;

    protected $fillable = [
        "refund_number",
        "sale_return_id",
        "sale_id",
        "payment_method_id",
        "refunded_by",
        "amount",
        "reference",
        "refunded_at",
        "notes",
    ];

    protected function casts(): array
    {
        return [
            "amount" => "decimal:2",
            "refunded_at" => "datetime",
        ];
    }

    public function saleReturn(): BelongsTo
    {
        return $this->belongsTo(SaleReturn::class);
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class);
    }

    public function refunder(): BelongsTo
    {
        return $this->belongsTo(User::class, "refunded_by");
    }
}
