<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Tests\ApiTester\PayloadGenerator;
use Tests\ApiTester\DatabaseIdResolver;

$basePath = __DIR__;
$generator = new PayloadGenerator($basePath);
$resolver = new DatabaseIdResolver();
$generator->setIdResolver($resolver);

$endpoint = [
    'identifier' => 'PUT|/api/companies/{id}',
    'method' => 'PUT',
    'uri' => '/api/companies/{id}',
    'full_uri' => 'http://localhost:8001/api/companies/{id}',
    'controller' => 'App\Http\Controllers\CompanyController',
    'controller_method' => 'update',
];

echo "Finding request class...\n";
$requestClass = $generator->findRequestClass($endpoint);
echo "Request Class: " . ($requestClass ?? 'None') . "\n";

echo "Generating payload...\n";
$payload = $generator->generatePayload($endpoint, $requestClass);
print_r($payload);

if (empty($payload)) {
    echo "Payload is empty, trying fallback...\n";
    // Simulate ApiTester fallback logic
    if (str_contains($endpoint['uri'], 'company')) {
        $payload = [
            'name' => 'Test Company',
            'admin_email' => 'admin'.time().'@example.com',
            'admin_password' => 'password123',
            'admin_name' => 'Admin User',
        ];
        echo "Fallback payload:\n";
        print_r($payload);
    }
}
