#!/usr/bin/env php
<?php

declare(strict_types=1);

/**
 * Laravel Smart API Tester Agent Pro
 *
 * Usage:
 *   php run-tests.php scan              - Scan all endpoints
 *   php run-tests.php test              - Test all endpoints (with resume)
 *   php run-tests.php test-one "GET|/api/users"  - Test single endpoint
 *   php run-tests.php retry-failed      - Retry failed endpoints
 *   php run-tests.php reset             - Reset state
 */

require __DIR__.'/../../vendor/autoload.php';

use Tests\ApiTester\ApiTestRunner;

// Get base path (2 levels up from this file)
$basePath = dirname(dirname(__DIR__));

// Get base URL from environment or use default
$baseUrl = $_ENV['API_BASE_URL'] ?? 'http://localhost:8001';

$runner = new ApiTestRunner($basePath, $baseUrl);

$command = $argv[1] ?? 'test';

try {
    switch ($command) {
        case 'scan':
            $runner->scan();
            break;

        case 'test':
            $runner->testAll(resume: true);
            break;

        case 'test-one':
            if (! isset($argv[2])) {
                echo "❌ Error: Endpoint identifier required\n";
                echo "Usage: php run-tests.php test-one \"GET|/api/users\"\n";
                exit(1);
            }
            $runner->testOne($argv[2]);
            break;

        case 'retry-failed':
            $runner->retryFailed();
            break;

        case 'reset':
            echo '⚠️  This will reset all test state. Continue? (yes/no): ';
            $handle = fopen('php://stdin', 'r');
            $line = fgets($handle);
            if (trim($line) === 'yes') {
                $runner->resetState();
            } else {
                echo "Cancelled.\n";
            }
            break;

        case 'status':
            $state = $runner->getState();
            echo "📊 Test Status:\n";
            echo "   Total Endpoints: {$state['total_endpoints']}\n";
            echo "   Tested: {$state['tested_count']}\n";
            echo "   Failed: {$state['failed_count']}\n";
            echo "   Pending: {$state['pending_count']}\n";
            echo "   Last Updated: {$state['last_updated']}\n";
            break;

        default:
            echo "❌ Unknown command: {$command}\n";
            echo "\nAvailable commands:\n";
            echo "  scan          - Scan all API endpoints\n";
            echo "  test          - Test all endpoints (with resume)\n";
            echo "  test-one      - Test a single endpoint\n";
            echo "  retry-failed  - Retry all failed endpoints\n";
            echo "  reset         - Reset test state\n";
            echo "  status        - Show test status\n";
            exit(1);
    }
} catch (\Exception $e) {
    echo '❌ Error: '.$e->getMessage()."\n";
    echo $e->getTraceAsString()."\n";
    exit(1);
}
