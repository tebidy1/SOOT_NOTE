<?php

return [
    /*
    |--------------------------------------------------------------------------
    | LaraCore Package Routes Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains the configuration for LaraCore package routes.
    | You can customize the route prefixes, middleware, and other settings here.
    |
    */

    // Web routes configuration
    'web' => [
        'prefix' => 'laracore',
        'middleware' => ['web'],
        'namespace' => 'LaraCore\Http\Controllers',
        'as' => 'laracore.',
    ],

    // API routes configuration
    'api' => [
        'prefix' => 'api/v1/laracore',
        'middleware' => ['api'],
        'namespace' => 'LaraCore\Http\Controllers\Api',
        'as' => 'api.laracore.',
    ],

    // Route groups configuration
    'groups' => [
        'examples' => [
            'prefix' => 'examples',
            'as' => 'examples.',
        ],
        'helpers' => [
            'prefix' => 'helpers',
            'as' => 'helpers.',
        ],
        'dashboard' => [
            'prefix' => 'dashboard',
            'as' => 'dashboard.',
        ],
    ],

    // Route caching configuration
    'cache' => [
        'enabled' => env('LARACORE_ROUTES_CACHE', false),
        'ttl' => env('LARACORE_ROUTES_CACHE_TTL', 3600), // 1 hour
    ],

    // Rate limiting configuration
    'rate_limit' => [
        'enabled' => env('LARACORE_RATE_LIMIT', true),
        'max_attempts' => env('LARACORE_RATE_LIMIT_MAX', 60),
        'decay_minutes' => env('LARACORE_RATE_LIMIT_DECAY', 1),
    ],
];
