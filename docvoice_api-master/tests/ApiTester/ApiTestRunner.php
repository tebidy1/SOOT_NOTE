<?php

declare(strict_types=1);

namespace Tests\ApiTester;

class ApiTestRunner
{
    private string $basePath;

    private RouteScanner $scanner;

    private ApiTester $tester;

    private StateManager $stateManager;

    private string $resultsDir;

    public function __construct(string $basePath, string $baseUrl = 'http://localhost:8001')
    {
        $this->basePath = $basePath;
        $this->resultsDir = $basePath.'/tests/ai-results';
        $this->ensureResultsDirectory();

        $this->scanner = new RouteScanner($basePath);
        $this->tester = new ApiTester($basePath, $baseUrl);
        $this->stateManager = new StateManager($basePath);
    }

    private function ensureResultsDirectory(): void
    {
        if (! is_dir($this->resultsDir)) {
            mkdir($this->resultsDir, 0755, true);
        }
    }

    public function scan(): array
    {
        echo "🔍 Scanning project for API endpoints...\n";
        $endpoints = $this->scanner->scan();

        $this->stateManager->setTotalEndpoints(count($endpoints));

        $this->saveScanResults($endpoints);

        echo '✅ Found '.count($endpoints)." endpoints\n";

        return $endpoints;
    }

    public function testAll(bool $resume = true): array
    {
        $endpoints = $this->scanner->scan();
        $this->stateManager->setTotalEndpoints(count($endpoints));

        $testedCount = $this->stateManager->getTestedCount();
        $totalCount = count($endpoints);

        if ($resume && $testedCount > 0) {
            echo "📊 Resuming: {$testedCount}/{$totalCount} endpoints already tested\n";
        }

        // Try to authenticate
        $this->authenticate();

        $results = [];
        $successCount = 0;
        $failCount = 0;

        foreach ($endpoints as $index => $endpoint) {
            try {
                $identifier = $endpoint['identifier'] ?? '';

                // Skip if already tested
                if ($resume && $this->stateManager->isTested($identifier)) {
                    echo "⏭️  Skipping {$identifier} (already tested)\n";

                    continue;
                }

                $current = $index + 1;
                echo "\n[{$current}/{$totalCount}] Testing {$identifier}...\n";

                $result = $this->tester->testEndpoint($endpoint);
                $results[] = $result;

                if ($result['success']) {
                    $successCount++;
                    $this->stateManager->markAsTested($identifier);
                    $this->saveResult($result);
                    echo "✅ Success ({$result['status_code']}) - {$result['response_time_ms']}ms\n";
                } else {
                    $failCount++;
                    $errorMsg = $result['error'] ?? "Status: {$result['status_code']}";
                    $this->stateManager->markAsFailed($identifier, [
                        'status_code' => $result['status_code'],
                        'error' => $errorMsg,
                    ]);
                    $this->saveFailedResult($result);
                    echo "❌ Failed: {$errorMsg}\n";
                }
            } catch (\Exception $e) {
                $failCount++;
                $identifier = $endpoint['identifier'] ?? 'Unknown';
                echo "❌ Exception testing {$identifier}: ".$e->getMessage()."\n";

                // Mark as failed
                $this->stateManager->markAsFailed($identifier, [
                    'status_code' => 0,
                    'error' => 'Exception: '.$e->getMessage(),
                ]);

                // Continue with next endpoint
                continue;
            }
        }

        $this->generateSummaryReport($results, $successCount, $failCount);

        return $results;
    }

    public function testOne(string $endpointIdentifier): array
    {
        $endpoints = $this->scanner->scan();

        foreach ($endpoints as $endpoint) {
            if (($endpoint['identifier'] ?? '') === $endpointIdentifier) {
                try {
                    echo "Testing {$endpointIdentifier}...\n";

                    $this->authenticate();
                    $result = $this->tester->testEndpoint($endpoint);

                    if ($result['success']) {
                        $this->stateManager->markAsTested($endpointIdentifier);
                        $this->saveResult($result);
                        echo "✅ Success\n";
                    } else {
                        $this->stateManager->markAsFailed($endpointIdentifier, [
                            'status_code' => $result['status_code'],
                            'error' => $result['error'] ?? "Status: {$result['status_code']}",
                        ]);
                        $this->saveFailedResult($result);
                        echo "❌ Failed\n";
                    }

                    return $result;
                } catch (\Exception $e) {
                    echo '❌ Exception: '.$e->getMessage()."\n";
                    $this->stateManager->markAsFailed($endpointIdentifier, [
                        'status_code' => 0,
                        'error' => 'Exception: '.$e->getMessage(),
                    ]);
                    throw $e;
                }
            }
        }

        throw new \Exception("Endpoint not found: {$endpointIdentifier}");
    }

    public function retryFailed(): array
    {
        $failed = $this->stateManager->getFailedEndpoints();

        if (empty($failed)) {
            echo "No failed endpoints to retry.\n";

            return [];
        }

        echo '🔄 Retrying '.count($failed)." failed endpoints...\n";

        $endpoints = $this->scanner->scan();
        $endpointMap = [];
        foreach ($endpoints as $endpoint) {
            $endpointMap[$endpoint['identifier'] ?? ''] = $endpoint;
        }

        $this->authenticate();
        $results = [];

        foreach ($failed as $failedEndpoint) {
            try {
                // Handle both string and array formats
                if (is_string($failedEndpoint)) {
                    $identifier = $failedEndpoint;
                } elseif (is_array($failedEndpoint) && isset($failedEndpoint['endpoint'])) {
                    $identifier = $failedEndpoint['endpoint'];
                } else {
                    echo "⚠️  Skipping invalid failed endpoint format\n";

                    continue;
                }

                if (! isset($endpointMap[$identifier])) {
                    echo "⚠️  Endpoint not found in scan: {$identifier}\n";

                    continue;
                }

                echo "Retrying {$identifier}...\n";
                $result = $this->tester->testEndpoint($endpointMap[$identifier]);
                $results[] = $result;

                if ($result['success']) {
                    $this->stateManager->removeFromFailed($identifier);
                    $this->stateManager->markAsTested($identifier);
                    $this->saveResult($result);
                    echo "✅ Success\n";
                } else {
                    $errorMsg = $result['error'] ?? "Status: {$result['status_code']}";
                    echo "❌ Still failed: {$errorMsg}\n";
                }
            } catch (\Exception $e) {
                echo '❌ Error testing endpoint: '.$e->getMessage()."\n";

                // Continue with next endpoint
                continue;
            }
        }

        return $results;
    }

    public function resetState(): void
    {
        $this->stateManager->reset();
        echo "✅ State reset successfully\n";
    }

    private function authenticate(): void
    {
        // Always use test user ID authentication for testing
        $this->tester->setTestUserId(1);

        // Also try to get token if possible
        $this->tester->authenticate();

        echo "✅ Using test user ID authentication (iid=1)\n";
    }

    private function saveScanResults(array $endpoints): void
    {
        $file = $this->resultsDir.'/scan-results.json';
        file_put_contents(
            $file,
            json_encode([
                'timestamp' => date('Y-m-d H:i:s'),
                'total_endpoints' => count($endpoints),
                'endpoints' => $endpoints,
                'by_method' => $this->scanner->getEndpointsByMethod(),
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
        );
    }

    private function saveResult(array $result): void
    {
        $identifier = $result['endpoint'];
        $filename = $this->sanitizeFilename($identifier).'.json';
        $file = $this->resultsDir.'/'.$filename;

        file_put_contents(
            $file,
            json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
        );
    }

    private function saveFailedResult(array $result): void
    {
        $file = $this->resultsDir.'/failed_endpoints.json';
        $failed = [];

        if (file_exists($file)) {
            $content = file_get_contents($file);
            $failed = json_decode($content, true) ?? [];
        }

        $failed[] = $result;

        file_put_contents(
            $file,
            json_encode($failed, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
        );
    }

    private function generateSummaryReport(array $results, int $successCount, int $failCount): void
    {
        $total = count($results);
        $successRate = $total > 0 ? round(($successCount / $total) * 100, 2) : 0;

        $report = [
            'timestamp' => date('Y-m-d H:i:s'),
            'summary' => [
                'total_endpoints' => $this->stateManager->getTotalCount(),
                'tested' => $this->stateManager->getTestedCount(),
                'failed' => $this->stateManager->getFailedCount(),
                'pending' => $this->stateManager->getPendingCount(),
                'success_rate' => $successRate.'%',
            ],
            'results' => $results,
        ];

        $file = $this->resultsDir.'/summary-report.json';
        file_put_contents(
            $file,
            json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
        );

        echo "\n📊 Summary Report:\n";
        echo "   Total: {$total}\n";
        echo "   Success: {$successCount}\n";
        echo "   Failed: {$failCount}\n";
        echo "   Success Rate: {$successRate}%\n";
        echo "   Report saved to: {$file}\n";
    }

    private function sanitizeFilename(string $filename): string
    {
        return preg_replace('/[^a-zA-Z0-9\-_]/', '-', $filename);
    }

    public function getState(): array
    {
        return $this->stateManager->getState();
    }
}
