<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Gate::before(
            function (
                User $user,
                string $ability
            ): ?bool {
                $role = strtolower(
                    trim($user->role)
                );

                return $role === 'admin'
                    ? true
                    : null;
            }
        );
    }
}
