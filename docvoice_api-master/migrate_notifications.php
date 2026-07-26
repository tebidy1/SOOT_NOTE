<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

// Get old notifications
$oldNotifications = DB::table('old_notifications')->get();

echo "Found {$oldNotifications->count()} old notifications\n";

foreach ($oldNotifications as $oldNotif) {
    $data = [
        'type' => $oldNotif->type,
        'message_id' => $oldNotif->message_id,
        'channel_id' => $oldNotif->channel_id,
        'content' => $oldNotif->content,
        'created_at' => $oldNotif->created_at,
    ];
    
    if ($oldNotif->from_user_id) {
        $sender = DB::table('users')->find($oldNotif->from_user_id);
        if ($sender) {
            $data['sender_id'] = $sender->id;
            $data['sender_name'] = $sender->name;
            $data['sender_avatar'] = $sender->profile_image_url;
        }
    }
    
    if ($oldNotif->channel_id) {
        $channel = DB::table('channels')->find($oldNotif->channel_id);
        if ($channel) {
            $data['channel_name'] = $channel->name;
            $data['channel_type'] = $channel->is_direct_message ? 'dm' : 'channel';
        }
    }
    
    if ($oldNotif->message_id) {
        $message = DB::table('messages')->find($oldNotif->message_id);
        if ($message) {
            $data['content_preview'] = Str::limit($message->content, 100);
        }
    }
    
    DB::table('notifications')->insert([
        'id' => (string) Str::uuid(),
        'type' => 'App\\Notifications\\NewMessageNotification',
        'notifiable_type' => 'App\\Models\\User',
        'notifiable_id' => $oldNotif->user_id,
        'data' => json_encode($data),
        'read_at' => $oldNotif->is_read ? $oldNotif->updated_at : null,
        'created_at' => $oldNotif->created_at,
        'updated_at' => $oldNotif->updated_at,
    ]);
}

echo "Migrated {$oldNotifications->count()} notifications successfully!\n";
echo "Laravel notifications count: " . DB::table('notifications')->count() . "\n";
