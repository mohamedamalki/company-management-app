<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductPrice extends Model
{
    protected $fillable = [
        'product_id',
        'location_id',
        'tax_rate_id',
        'sale_price_ht',
        'starts_at',
        'ends_at',
        'status',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function taxRate(): BelongsTo
    {
        return $this->belongsTo(TaxRate::class);
    }

    public function tiers(): HasMany
    {
    return $this->hasMany(ProductPriceTier::class)
        ->orderBy('min_quantity');
    }
}
