<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Channel;
use App\Models\User;

class ChannelPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        // All authenticated users can view channels
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Channel $channel): bool
    {
        // User can view channel if:
        // 1. They are admin
        // 2. They are company_manager in the same company
        // 3. They are a member of the channel
        if ($user->role === UserRole::Admin) {
            return true;
        }

        if ($user->role === UserRole::CompanyManager && $user->company_id === $channel->company_id) {
            return true;
        }

        // Check if user is a member of the channel
        return $channel->members()->where('user_id', $user->id)->exists();
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user, ?int $companyId = null): bool
    {
        // Admin can create channels in any company
        if ($user->role === UserRole::Admin) {
            return true;
        }

        // Company manager can create channels in their own company
        if ($user->role === UserRole::CompanyManager) {
            // If company_id is provided, check if it matches user's company
            if ($companyId !== null) {
                return $user->company_id === $companyId;
            }

            // If no company_id provided, allow (will be set to user's company)
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Channel $channel): bool
    {
        // Admin can update any channel
        if ($user->role === UserRole::Admin) {
            return true;
        }

        // Company manager can update channels in their own company
        if ($user->role === UserRole::CompanyManager) {
            return $user->company_id === $channel->company_id;
        }

        // Creator can update their own channel
        return $user->id === $channel->created_by;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Channel $channel): bool
    {
        // Admin can delete any channel
        if ($user->role === UserRole::Admin) {
            return true;
        }

        // Company manager can delete channels in their own company
        if ($user->role === UserRole::CompanyManager) {
            return $user->company_id === $channel->company_id;
        }

        // Creator can delete their own channel
        return $user->id === $channel->created_by;
    }

    /**
     * Determine whether the user can restore the model.
     * DISABLED: Soft delete is disabled in this project.
     */
    public function restore(User $user, Channel $channel): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     * DISABLED: Soft delete is disabled in this project.
     */
    public function forceDelete(User $user, Channel $channel): bool
    {
        return false;
    }

    /**
     * Determine whether the user can add members to the channel.
     */
    public function addMember(User $user, Channel $channel): bool
    {
        // Admin can add members to any channel
        if ($user->role === UserRole::Admin) {
            return true;
        }

        // Company manager can add members to channels in their own company
        if ($user->role === UserRole::CompanyManager) {
            return $user->company_id === $channel->company_id;
        }

        // Creator can add members to their own channel
        return $user->id === $channel->created_by;
    }

    /**
     * Determine whether the user can remove members from the channel.
     */
    public function removeMember(User $user, Channel $channel): bool
    {
        // Admin can remove members from any channel
        if ($user->role === UserRole::Admin) {
            return true;
        }

        // Company manager can remove members from channels in their own company
        if ($user->role === UserRole::CompanyManager) {
            return $user->company_id === $channel->company_id;
        }

        // Creator can remove members from their own channel
        return $user->id === $channel->created_by;
    }
}
