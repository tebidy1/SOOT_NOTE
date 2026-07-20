<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\Channel;
use App\Models\User;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

// User-specific private channel (for notifications, mentions, starred messages)
Broadcast::channel('user.{userId}', function (User $user, int $userId) {
    return (int) $user->id === (int) $userId;
});

// Channel-specific private channel (for messages, reactions, members)
Broadcast::channel('channel.{channelId}', function (User $user, int $channelId) {
    // Check if user is a member of this channel
    $channel = Channel::find($channelId);
    
    if (!$channel) {
        return false;
    }
    
    // Check if user belongs to the same company
    if ($user->company_id !== $channel->company_id) {
        return false;
    }
    
    // Check if user is a member of the channel
    return $channel->members()->where('user_id', $user->id)->exists();
});

// Company-wide private channel (for company events, new channels)
Broadcast::channel('company.{companyId}', function (User $user, int $companyId) {
    return (int) $user->company_id === (int) $companyId;
});

// Direct message conversation channel
Broadcast::channel('conversation.{userId1}.{userId2}', function (User $user, int $userId1, int $userId2) {
    // User must be one of the participants
    return (int) $user->id === (int) $userId1 || (int) $user->id === (int) $userId2;
});

// Thread-specific channel (for thread replies)
Broadcast::channel('thread.{messageId}', function (User $user, int $messageId) {
    // Check if user has access to the message's channel
    $message = \App\Models\Message::find($messageId);
    
    if (!$message) {
        return false;
    }
    
    // Check if user belongs to the same company
    if ($user->company_id !== $message->company_id) {
        return false;
    }
    
    // Check if user is a member of the channel
    return $message->channel->members()->where('user_id', $user->id)->exists();
});

// Message-specific channel (for reactions on a specific message)
Broadcast::channel('message.{messageId}', function (User $user, int $messageId) {
    $message = \App\Models\Message::find($messageId);
    
    if (!$message) {
        return false;
    }
    
    // Check if user belongs to the same company
    if ($user->company_id !== $message->company_id) {
        return false;
    }
    
    // Check if user is a member of the channel
    return $message->channel->members()->where('user_id', $user->id)->exists();
});

// Presence channel for company (to track online users)
Broadcast::channel('presence-company.{companyId}', function (User $user, int $companyId) {
    if ((int) $user->company_id === (int) $companyId) {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'profile_image_url' => $user->profile_image_url ?? null,
        ];
    }
    
    return false;
});
