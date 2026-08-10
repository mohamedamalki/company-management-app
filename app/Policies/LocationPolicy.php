<?php

namespace App\Policies;

use App\Models\Location;
use App\Models\User;

class LocationPolicy
{
    public function viewStock(
        User $user,
        Location $location
    ): bool {
        if ($user->status !== 'active') {
            return false;
        }

        if ($user->role === 'admin') {
            return true;
        }

        if ($user->role !== 'responsable') {
            return false;
        }

        return $user
            ->assignedLocations()
            ->whereKey($location->id)
            ->exists();
    }

    public function adjustStock(
        User $user,
        Location $location
    ): bool {
        return $location->status === 'active'
            && $this->viewStock($user, $location);
    }

    public function updateMinimumQuantity(
        User $user,
        Location $location
    ): bool {
        return $this->adjustStock($user, $location);
    }
}
