<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class SaleReturn extends Model
{
    use HasFactory;

    public const STATUS_DRAFT = "draft";
    public const STATUS_VALIDATED = "validated";
    public const STATUS_CANCELLED = "cancelled";

    public const REFUND_NOT_REQUIRED = "not_required";
    public const REFUND_PENDING = "pending";
    public const REFUND_PARTIALLY_REFUNDED = "partially_refunded";
    public const REFUND_REFUNDED = "refunded";

    protected $fillable = [
        "return_number",
        "sale_id",
        "location_id",
        "created_by",
        "validated_by",
        "cancelled_by",
        "status",
        "refund_status",
        "reason",
        "notes",
        "cancellation_reason",
        "subtotal_ht",
        "discount_total",
        "tax_total",
        "total_ttc",
        "refunded_amount",
        "validated_at",
        "cancelled_at",
    ];

    protected function casts(): array
    {
        return [
            "subtotal_ht" => "decimal:2",
            "discount_total" => "decimal:2",
            "tax_total" => "decimal:2",
            "total_ttc" => "decimal:2",
            "refunded_amount" => "decimal:2",
            "validated_at" => "datetime",
            "cancelled_at" => "datetime",
        ];
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, "created_by");
    }

    public function validator(): BelongsTo
    {
        return $this->belongsTo(User::class, "validated_by");
    }

    public function canceller(): BelongsTo
    {
        return $this->belongsTo(User::class, "cancelled_by");
    }

    public function items(): HasMany
    {
        return $this->hasMany(SaleReturnItem::class);
    }

    public function refunds(): HasMany
    {
        return $this->hasMany(SaleRefund::class);
    }

    public function stockMovements(): MorphMany
    {
        return $this->morphMany(StockMovement::class, "reference");
    }
}
