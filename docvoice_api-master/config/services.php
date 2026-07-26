<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'oci' => [
        'tenancy_id' => env('OCI_TENANCY_ID'),
        'user_id' => env('OCI_USER_ID'),
        'fingerprint' => env('OCI_FINGERPRINT'),
        'compartment_id' => env('OCI_COMPARTMENT_ID'),
        'private_key' => env('OCI_PRIVATE_KEY'),
        'region' => env('OCI_REGION', 'me-riyadh-1'),
        'namespace' => env('OCI_NAMESPACE'),
        'speech_bucket' => env('OCI_SPEECH_BUCKET'),
        'speech_output_bucket' => env('OCI_SPEECH_OUTPUT_BUCKET'),
        'generative_ai_model' => env('OCI_GENERATIVE_AI_MODEL', 'cohere.command-a-03-2025'),
    ],

];
