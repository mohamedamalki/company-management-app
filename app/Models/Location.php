<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Location extends Model
{
    protected $fillable = [
        'name',
        'code',
        'type',
        'address',
        'phone',
        'status',
    ];

    public function users(): HasMany
    {
    return $this->hasMany(User::class);
    }

    public function assignments(): HasMany
    {
    return $this->hasMany(LocationAssignment::class);
    }

    public function productPrices(): HasMany
    {
    return $this->hasMany(ProductPrice::class);
    }

    public function stocks(): HasMany
    {
    return $this->hasMany(LocationStock::class);
    }

    public function stockMovements(): HasMany
    {
    return $this->hasMany(StockMovement::class);
    }

    public function purchaseReceipts(): HasMany
    {
    return $this->hasMany(
        PurchaseReceipt::class
    );
    }

    public function sales(): HasMany
    {
    return $this->hasMany(
        Sale::class
    );
    }

    public function expenses(): HasMany
{
    return $this->hasMany(
        Expense::class
    );
}
}
