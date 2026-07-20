<?php

declare(strict_types=1);

namespace Tests\ApiTester;

class StateManager
{
    private string $stateFilePath;

    private array $state = [];

    public function __construct(string $basePath)
    {
        $this->stateFilePath = $basePath.'/tests/ai-results/endpoint-state.json';
        $this->ensureDirectoryExists();
        $this->loadState();
    }

    private function ensureDirectoryExists(): void
    {
        $dir = dirname($this->stateFilePath);
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
    }

    private function loadState(): void
    {
        if (file_exists($this->stateFilePath)) {
            $content = file_get_contents($this->stateFilePath);
            $this->state = json_decode($content, true) ?? [];
        }

        // Initialize default structure
        if (! isset($this->state['tested_endpoints'])) {
            $this->state = [
                'last_updated' => date('Y-m-d H:i:s'),
                'tested_endpoints' => [],
                'failed_endpoints' => [],
                'total_endpoints' => 0,
                'tested_count' => 0,
                'failed_count' => 0,
                'pending_count' => 0,
            ];
        }
    }

    public function isTested(string $endpoint): bool
    {
        return in_array($endpoint, $this->state['tested_endpoints'] ?? [], true);
    }

    public function markAsTested(string $endpoint): void
    {
        if (! $this->isTested($endpoint)) {
            $this->state['tested_endpoints'][] = $endpoint;
            $this->state['tested_count'] = count($this->state['tested_endpoints']);
            $this->state['last_updated'] = date('Y-m-d H:i:s');
            $this->saveState();
        }
    }

    public function markAsFailed(string $endpoint, array $errorDetails = []): void
    {
        $failedEndpoint = [
            'endpoint' => $endpoint,
            'timestamp' => date('Y-m-d H:i:s'),
            'error' => $errorDetails,
        ];

        // Check if already in failed list
        $exists = false;
        foreach ($this->state['failed_endpoints'] as $key => $failed) {
            // Handle both string and array formats
            $failedEndpointId = is_string($failed) ? $failed : ($failed['endpoint'] ?? null);
            if ($failedEndpointId === $endpoint) {
                $this->state['failed_endpoints'][$key] = $failedEndpoint;
                $exists = true;
                break;
            }
        }

        if (! $exists) {
            $this->state['failed_endpoints'][] = $failedEndpoint;
        }

        $this->state['failed_count'] = count($this->state['failed_endpoints']);
        $this->state['last_updated'] = date('Y-m-d H:i:s');
        $this->saveState();
    }

    public function removeFromFailed(string $endpoint): void
    {
        $this->state['failed_endpoints'] = array_filter(
            $this->state['failed_endpoints'],
            function ($failed) use ($endpoint) {
                // Handle both string and array formats
                if (is_string($failed)) {
                    return $failed !== $endpoint;
                } elseif (is_array($failed) && isset($failed['endpoint'])) {
                    return $failed['endpoint'] !== $endpoint;
                }

                return true; // Keep invalid formats
            }
        );
        // Re-index array
        $this->state['failed_endpoints'] = array_values($this->state['failed_endpoints']);
        $this->state['failed_count'] = count($this->state['failed_endpoints']);
        $this->saveState();
    }

    public function setTotalEndpoints(int $total): void
    {
        $this->state['total_endpoints'] = $total;
        $this->state['pending_count'] = $total - $this->state['tested_count'];
        $this->saveState();
    }

    public function getState(): array
    {
        return $this->state;
    }

    public function getTestedCount(): int
    {
        return $this->state['tested_count'] ?? 0;
    }

    public function getFailedCount(): int
    {
        return $this->state['failed_count'] ?? 0;
    }

    public function getPendingCount(): int
    {
        return $this->state['pending_count'] ?? 0;
    }

    public function getTotalCount(): int
    {
        return $this->state['total_endpoints'] ?? 0;
    }

    public function reset(): void
    {
        $this->state = [
            'last_updated' => date('Y-m-d H:i:s'),
            'tested_endpoints' => [],
            'failed_endpoints' => [],
            'total_endpoints' => $this->state['total_endpoints'] ?? 0,
            'tested_count' => 0,
            'failed_count' => 0,
            'pending_count' => $this->state['total_endpoints'] ?? 0,
        ];
        $this->saveState();
    }

    private function saveState(): void
    {
        file_put_contents(
            $this->stateFilePath,
            json_encode($this->state, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
        );
    }

    public function getFailedEndpoints(): array
    {
        return $this->state['failed_endpoints'] ?? [];
    }
}
