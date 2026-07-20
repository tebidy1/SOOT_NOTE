<?php

declare(strict_types=1);

namespace App\Enums;

enum NotificationType: string
{
    case Mention = 'mention';
    case DirectMessage = 'direct_message';
    case ChannelMessage = 'channel_message';
    case ChannelAdded = 'channel_added';
}

