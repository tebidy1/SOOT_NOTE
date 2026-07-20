<?php

declare(strict_types=1);

namespace App\Enums;

enum PlanType: string
{
    case Basic = 'basic';
    case Standard = 'standard';
    case Premium = 'premium';
    case Enterprise = 'enterprise';
}
