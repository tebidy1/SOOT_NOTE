<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Topic;
use App\Models\User;

class TopicPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        // All authenticated users can view topics
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Topic $topic): bool
    {
        // User can view topic if they are a member of the channel
        return $topic->channel->members()->where('user_id', $user->id)->exists();
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user, ?int $channelId = null): bool
    {
        if (!$channelId) {
            return false;
        }

        $channel = \App\Models\Channel::find($channelId);
        if (!$channel) {
            return false;
        }

        // Admin can create topics in any channel
        if ($user->role === UserRole::Admin) {
            return true;
        }

        // Company manager can create topics in channels of their own company
        if ($user->role === UserRole::CompanyManager) {
            return $user->company_id === $channel->company_id;
        }

        // Channel creator can create topics
        return $user->id === $channel->created_by;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Topic $topic): bool
    {
        $channel = $topic->channel;

        // Admin can update any topic
        if ($user->role === UserRole::Admin) {
            return true;
        }

        // Company manager can update topics in channels of their own company
        if ($user->role === UserRole::CompanyManager) {
            return $user->company_id === $channel->company_id;
        }

        // Channel creator can update topics
        return $user->id === $channel->created_by;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Topic $topic): bool
    {
        $channel = $topic->channel;

        // Admin can delete any topic
        if ($user->role === UserRole::Admin) {
            return true;
        }

        // Company manager can delete topics in channels of their own company
        if ($user->role === UserRole::CompanyManager) {
            return $user->company_id === $channel->company_id;
        }

        // Channel creator can delete topics
        return $user->id === $channel->created_by;
    }
}
