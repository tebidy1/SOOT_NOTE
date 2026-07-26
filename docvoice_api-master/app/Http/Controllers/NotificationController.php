<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Get all notifications for authenticated user
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $notifications = $user->notifications()
            ->latest()
            ->paginate($request->input('per_page', 50));

        // Transform notifications to match frontend expectation
        $notifications->getCollection()->transform(function ($notification) {
            return $this->formatNotification($notification);
        });

        return response()->json([
            'success' => true,
            'message' => 'Notifications retrieved successfully',
            'data' => $notifications,
        ]);
    }

    /**
     * Get unread notifications count
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $user = $request->user();

        $count = $user->unreadNotifications()->count();

        return response()->json([
            'success' => true,
            'message' => 'Unread count retrieved successfully',
            'data' => ['unread_count' => $count],
        ]);
    }

    /**
     * Get unread notifications
     */
    public function unread(Request $request): JsonResponse
    {
        $user = $request->user();

        $notifications = $user->unreadNotifications()
            ->latest()
            ->paginate($request->input('per_page', 50));

        $notifications->getCollection()->transform(function ($notification) {
            return $this->formatNotification($notification);
        });

        return response()->json([
            'success' => true,
            'message' => 'Unread notifications retrieved successfully',
            'data' => $notifications,
        ]);
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(string $id, Request $request): JsonResponse
    {
        $user = $request->user();

        $notification = $user->notifications()->findOrFail($id);
        $notification->markAsRead();

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read',
            'data' => $this->formatNotification($notification),
        ]);
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $request->user();

        $user->unreadNotifications->markAsRead();

        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read',
        ]);
    }

    /**
     * Mark notifications as read by channel
     */
    public function markChannelAsRead(int $channelId, Request $request): JsonResponse
    {
        $user = $request->user();

        // Mark notifications with this channel_id in data as read
        // Note: This assumes data->channel_id exists
        $user->unreadNotifications()
            ->where('data->channel_id', $channelId)
            ->get()
            ->markAsRead();

        return response()->json([
            'success' => true,
            'message' => 'Channel notifications marked as read',
        ]);
    }

    /**
     * Delete notification
     */
    public function destroy(string $id): JsonResponse
    {
        $user = request()->user();

        $notification = $user->notifications()->findOrFail($id);
        $notification->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notification deleted successfully',
        ]);
    }

    /**
     * Delete all read notifications
     */
    public function deleteAllRead(Request $request): JsonResponse
    {
        $user = $request->user();

        $user->readNotifications()->delete();

        return response()->json([
            'success' => true,
            'message' => 'All read notifications deleted',
        ]);
    }

    /**
     * Get notification statistics
     */
    public function statistics(): JsonResponse
    {
        $user = request()->user();

        $stats = [
            'total' => $user->notifications()->count(),
            'unread' => $user->unreadNotifications()->count(),
            'read' => $user->readNotifications()->count(),
            'by_type' => $user->notifications()
                ->get()
                ->groupBy('type')
                ->map(fn($group) => $group->count())
                ->toArray(),
        ];

        return response()->json([
            'success' => true,
            'message' => 'Notification statistics retrieved successfully',
            'data' => $stats,
        ]);
    }

    /**
     * Format notification for frontend
     */
    private function formatNotification($notification)
    {
        $data = $notification->data;
        
        // Ensure data is array
        if (is_string($data)) {
            $data = json_decode($data, true);
        }

        // Add ID and read status to the data
        $data['id'] = $notification->id;
        $data['read_at'] = $notification->read_at;
        $data['created_at'] = $notification->created_at;
        $data['is_read'] = $notification->read_at !== null;
        $data['unread_count'] = $notification->read_at === null ? 1 : 0;
        
        // Map type if not present (or simplify class name)
        if (!isset($data['type'])) {
            $data['type'] = class_basename($notification->type);
        }

        // Map sender info
        if (isset($data['sender_id'])) {
            $data['from_user_id'] = $data['sender_id'];
            $data['from_user'] = [
                'id' => $data['sender_id'],
                'name' => $data['sender_name'] ?? 'Unknown',
                'profile_image_url' => $data['sender_avatar'] ?? null,
            ];
        }

        // Map channel info
        if (isset($data['channel_id'])) {
            $data['channel_id'] = $data['channel_id'];
            $data['channel'] = [
                'id' => $data['channel_id'],
                'name' => $data['channel_name'] ?? 'Unknown',
            ];
        }

        // Map message info
        if (isset($data['message_id'])) {
            $data['message_id'] = $data['message_id'];
        }

        // Map direct message info
        if (isset($data['direct_message_id'])) {
            $data['direct_message_id'] = $data['direct_message_id'];
        }

        return $data;
    }
}
