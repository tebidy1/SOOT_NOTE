<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Login Configuration
    |--------------------------------------------------------------------------
    |
    | إعدادات تسجيل الدخول التلقائي للـ Agent
    |
    */
    'login' => [
        'enabled' => env('API_AGENT_LOGIN_ENABLED', true),
        'method' => env('API_AGENT_LOGIN_METHOD', 'POST'),
        'url' => env('API_AGENT_LOGIN_URL', '/api/auth/login'),
        'email' => env('API_AGENT_EMAIL', 'admin@example.com'),
        'password' => env('API_AGENT_PASSWORD', 'password'),
        'token_key' => env('API_AGENT_TOKEN_KEY', 'token'),
        'token_type' => env('API_AGENT_TOKEN_TYPE', 'Bearer'), // Bearer or Sanctum
    ],

    /*
    |--------------------------------------------------------------------------
    | Exclude Routes
    |--------------------------------------------------------------------------
    |
    | قائمة الـ routes المستثناة من الاختبار
    |
    */
    'exclude' => [
        'GET' => [
            'sanctum/csrf-cookie',
            'api/csrf-cookie',
        ],
        'POST' => [],
        'PUT' => [],
        'PATCH' => [],
        'DELETE' => [],
    ],

    /*
    |--------------------------------------------------------------------------
    | Save Path
    |--------------------------------------------------------------------------
    |
    | مسار حفظ نتائج الاختبارات
    |
    */
    'save_path' => storage_path('api-agent-results'),

    /*
    |--------------------------------------------------------------------------
    | Base URL
    |--------------------------------------------------------------------------
    |
    | URL الأساسي للـ API
    |
    */
    'base_url' => env('API_AGENT_BASE_URL', env('APP_URL', 'http://localhost:8001')),

    /*
    |--------------------------------------------------------------------------
    | Timeout
    |--------------------------------------------------------------------------
    |
    | مهلة انتظار الاستجابة (بالثواني)
    |
    */
    'timeout' => env('API_AGENT_TIMEOUT', 30),

    /*
    |--------------------------------------------------------------------------
    | Retry Failed
    |--------------------------------------------------------------------------
    |
    | إعادة محاولة الـ endpoints الفاشلة
    |
    */
    'retry_failed' => env('API_AGENT_RETRY_FAILED', false),
    'max_retries' => env('API_AGENT_MAX_RETRIES', 3),
];

