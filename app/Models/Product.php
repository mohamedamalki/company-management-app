<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, SoftDeletes;

        protected $fillable = [
        'category_id',
        'brand_id',
        'name',
        'reference',
        'description',
        'unit',
    ];


    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function brand(): BelongsTo
    {
    return $this->belongsTo(Brand::class);
    }

    public function prices(): HasMany
    {
    return $this->hasMany(ProductPrice::class);
    }

    public function currentGlobalPrice(): HasOne
    {
    return $this->hasOne(ProductPrice::class)
        ->whereNull('location_id')
        ->where('status', 'active')
        ->latestOfMany('starts_at');
    }

    public function locationStocks(): HasMany
{
    return $this->hasMany(LocationStock::class);
}

public function stockMovements(): HasMany
{
    return $this->hasMany(StockMovement::class);
}
}
