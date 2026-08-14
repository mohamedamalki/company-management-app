<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleReturnItem extends Model
{
    use HasFactory;

    protected $fillable = [
        "sale_return_id",
        "sale_item_id",
        "product_id",
        "quantity",
        "restock_quantity",
        "damaged_quantity",
        "product_name",
        "product_reference",
        "unit",
        "unit_price_ht",
        "discount_amount",
        "tax_rate",
        "total_ht",
        "tax_amount",
        "total_ttc",
        "notes",
    ];

    protected function casts(): array
    {
        return [
            "quantity" => "decimal:3",
            "restock_quantity" => "decimal:3",
            "damaged_quantity" => "decimal:3",
            "unit_price_ht" => "decimal:2",
            "discount_amount" => "decimal:2",
            "tax_rate" => "decimal:4",
            "total_ht" => "decimal:2",
            "tax_amount" => "decimal:2",
            "total_ttc" => "decimal:2",
        ];
    }

    public function saleReturn(): BelongsTo
    {
        return $this->belongsTo(SaleReturn::class);
    }

    public function saleItem(): BelongsTo
    {
        return $this->belongsTo(SaleItem::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
