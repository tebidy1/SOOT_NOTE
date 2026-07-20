<?php

namespace LaraCore\Traits;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

trait NotificationTrait
{
    /**
     * Send a notification to a user or multiple users.
     *
     * @param mixed $users
     * @param string $notificationClass
     * @param array $data
     * @return void
     */
    protected function sendNotification($users, string $notificationClass, array $data = []): void
    {
        try {
            Notification::send($users, new $notificationClass($data));
        } catch (\Exception $e) {
            \Log::error('Notification error: ' . $e->getMessage());
        }
    }

    /**
     * Send a notification to a user or multiple users based on a model event.
     *
     * @param Model $model
     * @param mixed $users
     * @param string $event
     * @param array $additionalData
     * @return void
     */
    protected function sendModelNotification(Model $model, $users, string $event, array $additionalData = []): void
    {
        $modelName = class_basename($model);
        $notificationClass = "App\\Notifications\\{$modelName}{$event}Notification";

        if (!class_exists($notificationClass)) {
            $notificationClass = "Modules\\Gumra\\Notifications\\{$modelName}{$event}Notification";

            if (!class_exists($notificationClass)) {
                \Log::warning("Notification class {$notificationClass} does not exist");
                return;
            }
        }

        $data = array_merge([
            'model' => $model,
            'event' => $event,
            'model_id' => $model->id,
            'model_type' => get_class($model),
        ], $additionalData);

        $this->sendNotification($users, $notificationClass, $data);
    }

    /**
     * Send a notification when a model is created.
     *
     * @param Model $model
     * @param mixed $users
     * @param array $additionalData
     * @return void
     */
    protected function sendCreatedNotification(Model $model, $users, array $additionalData = []): void
    {
        $this->sendModelNotification($model, $users, 'Created', $additionalData);
    }

    /**
     * Send a notification when a model is updated.
     *
     * @param Model $model
     * @param mixed $users
     * @param array $additionalData
     * @return void
     */
    protected function sendUpdatedNotification(Model $model, $users, array $additionalData = []): void
    {
        $this->sendModelNotification($model, $users, 'Updated', $additionalData);
    }

    /**
     * Send a notification when a model is deleted.
     *
     * @param Model $model
     * @param mixed $users
     * @param array $additionalData
     * @return void
     */
    protected function sendDeletedNotification(Model $model, $users, array $additionalData = []): void
    {
        $this->sendModelNotification($model, $users, 'Deleted', $additionalData);
    }

    /**
     * Send a notification when a model status is changed.
     *
     * @param Model $model
     * @param mixed $users
     * @param string $oldStatus
     * @param string $newStatus
     * @param array $additionalData
     * @return void
     */
    protected function sendStatusChangedNotification(Model $model, $users, string $oldStatus, string $newStatus, array $additionalData = []): void
    {
        $data = array_merge([
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
        ], $additionalData);

        $this->sendModelNotification($model, $users, 'StatusChanged', $data);
    }

    /**
     * Send a notification when a model is assigned to a user.
     *
     * @param Model $model
     * @param mixed $users
     * @param mixed $assignedTo
     * @param array $additionalData
     * @return void
     */
    protected function sendAssignedNotification(Model $model, $users, $assignedTo, array $additionalData = []): void
    {
        $data = array_merge([
            'assigned_to' => $assignedTo,
        ], $additionalData);

        $this->sendModelNotification($model, $users, 'Assigned', $data);
    }

    /**
     * Send a notification when a comment is added to a model.
     *
     * @param Model $model
     * @param mixed $users
     * @param string $comment
     * @param mixed $commentedBy
     * @param array $additionalData
     * @return void
     */
    protected function sendCommentNotification(Model $model, $users, string $comment, $commentedBy, array $additionalData = []): void
    {
        $data = array_merge([
            'comment' => $comment,
            'commented_by' => $commentedBy,
        ], $additionalData);

        $this->sendModelNotification($model, $users, 'Commented', $data);
    }

    /**
     * Send a custom notification.
     *
     * @param mixed $users
     * @param string $title
     * @param string $message
     * @param string $type
     * @param array $additionalData
     * @return void
     */
    protected function sendCustomNotification($users, string $title, string $message, string $type = 'info', array $additionalData = []): void
    {
        $notificationClass = "Modules\\Gumra\\Notifications\\CustomNotification";

        $data = array_merge([
            'title' => $title,
            'message' => $message,
            'type' => $type,
        ], $additionalData);

        $this->sendNotification($users, $notificationClass, $data);
    }
}
