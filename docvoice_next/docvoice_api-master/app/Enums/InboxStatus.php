<?php

declare(strict_types=1);

namespace App\Enums;

enum InboxStatus: string
{
    case PENDING = 'pending';
    case PROCESSED = 'processed';
    case ARCHIVED = 'archived';
}
