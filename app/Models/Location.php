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
    return $this->hasMany(
        LocationAssignment::class
    );
    }
}
