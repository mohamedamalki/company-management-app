<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
        protected $fillable = [
        'category_id',
        'name',
        'sku',
        'barcode',
        'description',
        'purchase_price',
        'sale_price',
        'unit',
        'status',
    ];


    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
