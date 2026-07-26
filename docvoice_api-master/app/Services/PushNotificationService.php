<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Notification;
use App\Models\PushSubscription;
use App\Models\Message;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\Log;
use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\AndroidConfig;
use Kreait\Firebase\Messaging\ApnsConfig;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification as FirebaseNotification;

class PushNotificationService
{
    private $messaging;

    public function __construct()
    {
        try {
            $credentialsPath = config('firebase.credentials');
            if (file_exists($credentialsPath)) {
                $factory = (new Factory)->withServiceAccount($credentialsPath);
                $this->messaging = $factory->createMessaging();
            }
        } catch (\Exception $e) {
            Log::warning('Firebase not initialized: '.$e->getMessage());
            $this->messaging = null;
        }
    }

    /**
     * Send push notification to user
     */
    public function sendToUser(int $userId, array $payload): bool
    {
        try {
            $subscriptions = PushSubscription::where('user_id', $userId)
                ->whereNotNull('fcm_token')
                ->get();

            if ($subscriptions->isEmpty()) {
                Log::info("No FCM subscriptions found for user {$userId}");

                return false;
            }

            $successCount = 0;
            foreach ($subscriptions as $subscription) {
                if ($this->sendFCMNotification($subscription, $payload)) {
                    $successCount++;
                }
            }

            return $successCount > 0;
        } catch (\Exception $e) {
            Log::error('Push notification error: '.$e->getMessage());

            return false;
        }
    }

    /**
     * Send push notification when a notification is created
     */
    public function sendNotificationCreated(DatabaseNotification|Notification $notification): bool
    {
        try {
            // Check if notification is read - only send FCM for unread notifications
            if ($notification->read_at !== null) {
                Log::info('Skipping push notification - notification is already read', [
                    'notification_id' => $notification->id,
                    'notifiable_id' => $notification->notifiable_id,
                    'read_at' => $notification->read_at,
                ]);

                return false;
            }

            Log::info('Sending push notification for notification', [
                'notification_id' => $notification->id,
                'notifiable_id' => $notification->notifiable_id,
                'notifiable_type' => $notification->notifiable_type,
            ]);

            $data = $notification->data;
            // Ensure data is array
            if (is_string($data)) {
                $data = json_decode($data, true);
            }

            if (! is_array($data)) {
                Log::warning('Notification data is not an array', [
                    'notification_id' => $notification->id,
                    'data_type' => gettype($data),
                ]);

                return false;
            }

            // Get notification body - try multiple sources
            $body = $data['content'] ?? '';
            if (empty($body) && isset($data['message_content'])) {
                $body = $data['message_content'];
            }
            if (empty($body) && isset($data['direct_message_content'])) {
                $body = $data['direct_message_content'];
            }
            if (empty($body)) {
                $body = __('New notification');
            }

            $payload = [
                'title' => $this->getNotificationTitle($notification, $data),
                'body' => $body,
                'data' => [
                    'type' => $data['type'] ?? 'unknown',
                    'notification_id' => $notification->id,
                    'message_id' => $data['message_id'] ?? null,
                    'channel_id' => $data['channel_id'] ?? null,
                    'direct_message_id' => $data['direct_message_id'] ?? null,
                    'from_user_id' => $data['sender_id'] ?? null,
                    'notification_tag' => $this->getNotificationTag($notification, $data),
                ],
            ];

            Log::debug('Push notification payload', [
                'title' => $payload['title'],
                'body' => $payload['body'],
                'data_type' => $payload['data']['type'],
            ]);

            // Add image URL based on notification type
            if (isset($data['channel_name'])) {
                $payload['data']['channel_name'] = $data['channel_name'];
            }

            if (isset($data['sender_name'])) {
                $payload['data']['user_name'] = $data['sender_name'];
                $payload['data']['user_image_url'] = $data['sender_avatar'] ?? null;
            }

            // Add unread count
            if (isset($data['channel_id'])) {
                // We need the user_id from notifiable_id
                $userId = $notification->notifiable_id;
                $user = \App\Models\User::find($userId);

                if ($user) {
                    $notification = $user->unreadNotifications()
                        ->where('data->channel_id', $data['channel_id'])
                        ->first();
                    
                    if ($notification) {
                        $nData = $notification->data;
                        if (is_string($nData)) $nData = json_decode($nData, true);
                        $payload['data']['unread_count'] = $nData['unread_count'] ?? 1;
                    } else {
                        $payload['data']['unread_count'] = 0;
                    }
                } else {
                    $payload['data']['unread_count'] = 0;
                }
            } elseif (isset($data['direct_message_id']) && isset($data['sender_id'])) {
                // For direct messages, count unread messages from the sender
                $userId = $notification->notifiable_id;
                $unreadCount = \App\Models\DirectMessage::where('from_user_id', $data['sender_id'])
                    ->where('to_user_id', $userId)
                    ->where('is_read', false)
                    ->count();
                $payload['data']['unread_count'] = $unreadCount;
            }

            $result = $this->sendToUser($notification->notifiable_id, $payload);

            Log::info('Push notification result', [
                'notification_id' => $notification->id,
                'user_id' => $notification->notifiable_id,
                'sent' => $result,
            ]);

            return $result;
        } catch (\Exception $e) {
            Log::error('Push notification error: '.$e->getMessage(), [
                'notification_id' => $notification->id ?? null,
                'trace' => $e->getTraceAsString(),
            ]);

            return false;
        }
    }

    /**
     * Send direct push notification for a channel message
     */
    public function sendChannelMessageNotification(Message $message, array $userIds): void
    {
        try {
            $channelName = $message->channel->name ?? 'Channel';
            $senderName = $message->user->name ?? 'User';
            
            $payload = [
                'title' => "#{$channelName}",
                'body' => "{$senderName}: {$message->content}",
                'data' => [
                    'type' => 'channel_message',
                    'message_id' => $message->id,
                    'channel_id' => $message->channel_id,
                    'channel_name' => $channelName,
                    'from_user_id' => $message->user_id,
                    'user_name' => $senderName,
                    'user_image_url' => $message->user->profile_image_url,
                ],
            ];

            foreach ($userIds as $userId) {
                $this->sendToUser((int)$userId, $payload);
            }
            
            Log::info("Sent channel message push notifications to " . count($userIds) . " users");
        } catch (\Exception $e) {
            Log::error('Failed to send channel message notification: '.$e->getMessage());
        }
    }

    /**
     * Send direct push notification for a mention
     */
    public function sendMentionNotification(Message $message, array $userIds): void
    {
        try {
            $channelName = $message->channel->name ?? 'Channel';
            $senderName = $message->user->name ?? 'User';
            
            $payload = [
                'title' => __("You were mentioned by {$senderName}"),
                'body' => $message->content,
                'data' => [
                    'type' => 'mention',
                    'message_id' => $message->id,
                    'channel_id' => $message->channel_id,
                    'channel_name' => $channelName,
                    'from_user_id' => $message->user_id,
                    'user_name' => $senderName,
                    'user_image_url' => $message->user->profile_image_url,
                ],
            ];

            foreach ($userIds as $userId) {
                $this->sendToUser((int)$userId, $payload);
            }
            
            Log::info("Sent mention push notifications to " . count($userIds) . " users");
        } catch (\Exception $e) {
            Log::error('Failed to send mention notification: '.$e->getMessage());
        }
    }

    /**
     * Get unique notification tag for grouping notifications
     */
    private function getNotificationTag(DatabaseNotification|Notification $notification, array $data): string
    {
        if (isset($data['channel_id'])) {
            return "channel_{$data['channel_id']}";
        }

        if (isset($data['direct_message_id']) && isset($data['sender_id'])) {
            // For direct messages, create a consistent tag based on user IDs
            $userIds = [$notification->notifiable_id, $data['sender_id']];
            sort($userIds);

            return "dm_{$userIds[0]}_{$userIds[1]}";
        }

        return "notification_{$notification->id}";
    }

    /**
     * Get notification title based on type
     */
    private function getNotificationTitle(DatabaseNotification|Notification $notification, array $data): string
    {
        $type = $data['type'] ?? '';

        return match ($type) {
            'mention' => __('You were mentioned'),
            'direct_message' => __('New direct message'),
            'channel_message' => __('New message in channel'),
            'channel_added' => __('Added to channel'),
            default => __('New notification'),
        };
    }

    /**
     * Send push notification using Firebase Cloud Messaging (FCM)
     */
    private function sendFCMNotification(PushSubscription $subscription, array $payload): bool
    {
        try {
            if (! $this->messaging || ! $subscription->fcm_token) {
                Log::warning('FCM not available or token missing', [
                    'user_id' => $subscription->user_id,
                    'has_messaging' => $this->messaging !== null,
                    'has_token' => ! empty($subscription->fcm_token),
                ]);

                return false;
            }

            // Create Firebase notification
            $firebaseNotification = FirebaseNotification::create(
                $payload['title'] ?? __('New notification'),
                $payload['body'] ?? ''
            );

            // Create message data
            $data = [];
            if (isset($payload['data']) && is_array($payload['data'])) {
                foreach ($payload['data'] as $key => $value) {
                    $data[$key] = is_string($value) ? $value : json_encode($value);
                }
            }

            // Create Android config with sound
            $androidConfig = AndroidConfig::fromArray([
                'priority' => 'high',
                'notification' => [
                    'sound' => 'default',
                    'channel_id' => 'messages',
                    'importance' => 'high',
                    'priority' => 'high',
                ],
            ]);

            // Create APNS config for iOS (if needed)
            $apnsConfig = ApnsConfig::fromArray([
                'headers' => [
                    'apns-priority' => '10',
                ],
                'payload' => [
                    'aps' => [
                        'sound' => 'default',
                        'badge' => 1,
                    ],
                ],
            ]);

            // Build the message
            $message = CloudMessage::withTarget('token', $subscription->fcm_token)
                ->withNotification($firebaseNotification)
                ->withData($data)
                ->withAndroidConfig($androidConfig)
                ->withApnsConfig($apnsConfig);

            // Send the message
            $this->messaging->send($message);

            Log::info('FCM notification sent successfully', [
                'user_id' => $subscription->user_id,
                'device_type' => $subscription->device_type,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to send FCM notification: '.$e->getMessage(), [
                'user_id' => $subscription->user_id,
                'error' => $e->getTraceAsString(),
            ]);

            // If token is invalid, delete the subscription
            if (str_contains($e->getMessage(), 'Invalid registration token') ||
                str_contains($e->getMessage(), 'registration-token-not-registered')) {
                Log::info('Deleting invalid FCM token', ['subscription_id' => $subscription->id]);
                $subscription->delete();
            }

            return false;
        }
    }

    /**
     * Send push notification using Web Push API (legacy support)
     */
    private function sendPushNotification(PushSubscription $subscription, array $payload): void
    {
        try {
            // Legacy Web Push support - only if endpoint exists
            if (! $subscription->endpoint) {
                return;
            }

            Log::info('Web Push notification (legacy)', [
                'user_id' => $subscription->user_id,
                'endpoint' => $subscription->endpoint,
                'payload' => $payload,
            ]);

            // TODO: Implement actual Web Push API call if needed
        } catch (\Exception $e) {
            Log::error('Failed to send Web Push notification: '.$e->getMessage());
        }
    }
}
