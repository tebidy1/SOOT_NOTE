<?php

declare(strict_types=1);

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case CompanyManager = 'company_manager';
    case Member = 'member';
}

