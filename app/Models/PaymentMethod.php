<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PaymentMethod extends Model
{
        protected $fillable = [
        'name',
        'code',
        'requires_reference',
        'status',
    ];

    public function salePayments(): HasMany
    {
    return $this->hasMany(
        SalePayment::class
    );
    }
}
