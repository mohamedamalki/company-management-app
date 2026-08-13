<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    use HasFactory;

    public const CATEGORY_REGISTERED = 'registered';
    public const CATEGORY_FOURNISSEUR = 'fournisseur';

    public const ENTITY_INDIVIDUAL = 'individual';
    public const ENTITY_COMPANY = 'company';

    public const STATUS_ACTIVE = 'active';
    public const STATUS_INACTIVE = 'inactive';

    protected $fillable = [
        'user_id',
        'code',
        'category',
        'entity_type',
        'name',
        'phone',
        'email',
        'ice',
        'address',
        'city',
        'status',
        'notes',
        'credit_limit',
        'payment_terms_days',
    ];

    protected $casts = [
        'credit_limit' => 'decimal:2',
        'payment_terms_days' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    /**
     * Registered customers, excluding fournisseurs.
     */
    public function scopeRegistered(
        Builder $query
    ): Builder {
        return $query->where(
            'category',
            self::CATEGORY_REGISTERED
        );
    }

    /**
     * Fournisseurs who buy products from the company.
     */
    public function scopeFournisseurs(
        Builder $query
    ): Builder {
        return $query->where(
            'category',
            self::CATEGORY_FOURNISSEUR
        );
    }

    public function scopeActive(
        Builder $query
    ): Builder {
        return $query->where(
            'status',
            self::STATUS_ACTIVE
        );
    }
}
