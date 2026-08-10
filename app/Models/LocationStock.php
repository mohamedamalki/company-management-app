<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LocationStock extends Model
{
        use HasFactory;

    protected $fillable = [
        'location_id',
        'product_id',
        'quantity',
        'minimum_quantity',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'minimum_quantity' => 'decimal:3',
    ];

    protected $appends = [
        'stock_status',
    ];

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function movements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    public function getStockStatusAttribute(): string
    {
        $quantity = (float) $this->quantity;
        $minimum = (float) $this->minimum_quantity;

        if ($quantity <= 0) {
            return 'out_of_stock';
        }

        if ($quantity <= $minimum) {
            return 'low_stock';
        }

        return 'available';
    }
}
