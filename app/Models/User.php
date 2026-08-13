<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, HasRoles;

    protected string $guard_name = 'web';

    protected $fillable = [
        'name',
        'email',
        'role',
        'status',
        'password'
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function stockMovements(): HasMany
{
    return $this->hasMany(StockMovement::class);
}

    public function assignedLocations(): BelongsToMany
    {
    return $this->belongsToMany(
        Location::class,
        'location_assignments',
        'user_id',
        'location_id'
    )->withTimestamps();
    }

    public function createdPurchaseReceipts(): HasMany
    {
    return $this->hasMany(
        PurchaseReceipt::class,
        'created_by'
    );
    }

    public function validatedPurchaseReceipts(): HasMany
    {
    return $this->hasMany(
        PurchaseReceipt::class,
        'validated_by'
    );
    }

    public function customerAccount(): HasOne
    {
    return $this->hasOne(Customer::class);
    }

        public function fournisseurAccount(): HasOne
    {
        return $this->hasOne(Customer::class)
            ->where(
                'category',
                Customer::CATEGORY_FOURNISSEUR
            );
    }

public function createdSales(): HasMany
{
    return $this->hasMany(
        Sale::class,
        'created_by'
    );
}

public function confirmedSales(): HasMany
{
    return $this->hasMany(
        Sale::class,
        'confirmed_by'
    );
}

public function cancelledSales(): HasMany
{
    return $this->hasMany(
        Sale::class,
        'cancelled_by'
    );
}

public function receivedSalePayments(): HasMany
{
    return $this->hasMany(
        SalePayment::class,
        'received_by'
    );
}
}
