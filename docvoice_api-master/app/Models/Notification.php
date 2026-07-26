<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Notifications\DatabaseNotification;

class Notification extends DatabaseNotification
{
    protected $table = 'notifications';

    protected $casts = [
        'id' => 'string',
        'data' => 'array',
        'read_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Helper to get data attributes easily
    public function getDataAttribute($value)
    {
        return is_string($value) ? json_decode($value, true) : $value;
    }
}

