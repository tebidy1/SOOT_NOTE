<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Message;
use App\Models\Channel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\DatabaseMessage;
use Illuminate\Notifications\Notification;

class NewMessageNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Message $message,
        public Channel $channel
    ) {
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    /**
     * Get the array representation of the notification for database.
     */
    public function toArray(object $notifiable): array
    {
        // Determine channel type - check if channel id is 0 (dummy channel for direct messages)
        // or check if channel has is_direct_message attribute set
        $isDirectMessage = $this->channel->id === 0 || 
                          (isset($this->channel->attributes['is_direct_message']) && $this->channel->attributes['is_direct_message']);
        
        return [
            'type' => 'new_message',
            'message_id' => $this->message->id,
            'channel_id' => $this->channel->id,
            'channel_name' => $this->channel->name,
            'channel_type' => $isDirectMessage ? 'dm' : 'channel',
            'sender_id' => $this->message->user_id,
            'sender_name' => $this->message->user->name ?? 'Unknown',
            'sender_avatar' => $this->message->user->profile_image_url ?? null,
            'content' => $this->message->content,
            'content_preview' => \Str::limit($this->message->content, 100),
            'created_at' => $this->message->created_at->toISOString(),
        ];
    }

    /**
     * Get the broadcastable representation of the notification.
     */
    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            'type' => 'new_message',
            'message_id' => $this->message->id,
            'channel_id' => $this->channel->id,
            'channel_name' => $this->channel->name,
            'sender_name' => $this->message->user->name ?? 'Unknown',
            'content_preview' => \Str::limit($this->message->content, 100),
            'unread_count' => $notifiable->unreadNotifications()->count() + 1,
        ]);
    }
}
