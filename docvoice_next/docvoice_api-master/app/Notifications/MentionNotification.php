<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Message;
use App\Models\Channel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class MentionNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Message $message,
        public Channel $channel
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'mention',
            'message_id' => $this->message->id,
            'channel_id' => $this->channel->id,
            'channel_name' => $this->channel->name,
            'sender_id' => $this->message->user_id,
            'sender_name' => $this->message->user->name ?? 'Unknown',
            'sender_avatar' => $this->message->user->profile_image_url ?? null,
            'content' => $this->message->content,
            'content_preview' => \Str::limit($this->message->content, 100),
            'created_at' => $this->message->created_at->toISOString(),
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            'type' => 'mention',
            'message_id' => $this->message->id,
            'channel_id' => $this->channel->id,
            'channel_name' => $this->channel->name,
            'sender_name' => $this->message->user->name ?? 'Unknown',
            'content_preview' => \Str::limit($this->message->content, 100),
        ]);
    }
}
