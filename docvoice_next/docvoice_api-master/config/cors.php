<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'storage/*', 'auth/*', 'pairing/*'],

    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'https://tafaahum.vercel.app',
        'http://localhost:8000',
        'http://localhost:8002',
        'http://localhost:9002',
        'http://127.0.0.1:8000',
        'http://localhost:8011',
        'http://127.0.0.1:8011',
        'http://0.0.0.0:8011',
        'https://sootnote.com',
        'https://www.sootnote.com',
        'https://marketplace.zoom.us'
    ],

    'allowed_origins_patterns' => [
        '#^http://localhost:\d+$#',
        '#^http://127\.0\.0\.1:\d+$#',
        '#^http://0\.0\.0\.0:\d+$#',
        '#^https:\/\/.*\.trycloudflare\.com$#',
        '#^https:\/\/.*\.sootnote\.com$#',
        '#^https:\/\/.*\.vercel\.app$#'
    ],
    'allowed_headers' => ['*'],

    'exposed_headers' => [],
    'max_age' => 0,

    'supports_credentials' => true,

];
