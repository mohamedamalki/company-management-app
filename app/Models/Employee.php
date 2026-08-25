<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Employee extends Model
{
    use HasFactory;

    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'location_id',
        'position',
        'phone',
    ];

    /**
     * An employee can have many salary records.
     */
    public function salaries(): HasMany
    {
        return $this->hasMany(Salary::class);
    }
    public function location() {
        return $this->belongsTo(Location::class);
    }
}
