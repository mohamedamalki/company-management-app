<?php

namespace App\Providers;

use App\Models\Location;
use App\Policies\LocationPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap application services.
     */
    public function boot(): void
    {
        Gate::policy(
            Location::class,
            LocationPolicy::class
        );
    }
}
