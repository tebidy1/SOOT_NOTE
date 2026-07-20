<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Symfony\Component\HttpFoundation\Response;

class SaveApiResponses
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Save response only for API routes and localhost environment
        if ($this->shouldSaveResponse($request)) {
            $this->saveResponse($request, $response);
        }

        return $response;
    }

    /**
     * Check if response should be saved
     */
    protected function shouldSaveResponse(Request $request): bool
    {
        return true;
    }

    /**
     * Save API response to JSON file
     */
    protected function saveResponse(Request $request, Response $response): void
    {
        try {
            $storagePath = base_path('res');

            // Create directory if it doesn't exist
            if (!File::exists($storagePath)) {
                File::makeDirectory($storagePath, 0755, true);
            }

            // Get route information
            $route = Route::current();
            $routeName = $route?->getName() ?? 'unnamed';
            $routeUri = $route?->uri() ?? $request->path();
            $routeMethod = $request->method();

            // Get response content
            $responseContent = $response->getContent();
            $decodedResponse = null;

            if ($responseContent) {
                $decodedResponse = json_decode($responseContent, true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    $decodedResponse = $responseContent;
                }
            }

            // Create filename based on route
            $filename = $this->generateFilename($routeName, $routeUri, $routeMethod);
            $filePath = $storagePath . '/' . $filename;

            // Load existing data if file exists
            $existingData = null;
            $updateCount = 0;
            if (File::exists($filePath)) {
                $existingContent = File::get($filePath);
                $existingData = json_decode($existingContent, true);
                if ($existingData && isset($existingData['meta']['update_count'])) {
                    $updateCount = (int) $existingData['meta']['update_count'];
                }
            }

            // Prepare response data
            $responseData = [
                'route' => [
                    'name' => $routeName,
                    'uri' => $routeUri,
                    'method' => $routeMethod,
                    'url' => $request->fullUrl(),
                ],
                'request' => [
                    'method' => $request->method(),
                    'headers' => $this->sanitizeHeaders($request->headers->all()),
                    'body' => $this->sanitizeRequestData($request->all()),
                    'query' => $request->query(),
                ],
                'response' => [
                    'status_code' => $response->getStatusCode(),
                    'headers' => $this->sanitizeHeaders($response->headers->all()),
                    'body' => $decodedResponse,
                ],
                'meta' => [
                    'created_at' => $existingData['meta']['created_at'] ?? now()->toIso8601String(),
                    'updated_at' => now()->toIso8601String(),
                    'update_count' => $updateCount + 1,
                    'first_saved' => $existingData === null,
                ],
            ];

            // Save to JSON file (update if exists, create if not)
            File::put($filePath, json_encode($responseData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));

            // Also save to a master index file
            $this->updateIndexFile($storagePath, $routeName, $routeUri, $routeMethod, $filename);
        } catch (\Exception $e) {
            // Silently fail - don't break the application
            Log::warning('Failed to save API response: ' . $e->getMessage());
        }
    }

    /**
     * Generate filename for response file
     */
    protected function generateFilename(?string $routeName, string $routeUri, string $method): string
    {
        if ($routeName && $routeName !== 'unnamed') {
            $name = str_replace(['.', '/', '\\'], '_', $routeName);
        } else {
            $name = str_replace(['/', '\\', '{', '}'], '_', $routeUri);
        }

        $name = preg_replace('/[^a-zA-Z0-9_-]/', '_', $name);
        $name = strtolower($method) . '_' . $name;

        return $name . '.json';
    }

    /**
     * Update index file with all routes
     */
    protected function updateIndexFile(string $storagePath, ?string $routeName, string $routeUri, string $method, string $filename): void
    {
        $indexPath = $storagePath . '/index.json';

        $index = [];
        if (File::exists($indexPath)) {
            $index = json_decode(File::get($indexPath), true) ?? [];
        }

        $routeKey = $routeName ?? $routeUri;

        // Get update count and created_at from existing index or file
        $updateCount = 0;
        $createdAt = now()->toIso8601String();

        if (isset($index[$routeKey])) {
            $updateCount = (int) ($index[$routeKey]['update_count'] ?? 0);
            $createdAt = $index[$routeKey]['created_at'] ?? $createdAt;
        } else {
            // Try to get from the actual file
            $filePath = $storagePath . '/' . $filename;
            if (File::exists($filePath)) {
                $fileData = json_decode(File::get($filePath), true);
                if (isset($fileData['meta'])) {
                    $updateCount = (int) ($fileData['meta']['update_count'] ?? 0);
                    $createdAt = $fileData['meta']['created_at'] ?? $createdAt;
                }
            }
        }

        $index[$routeKey] = [
            'name' => $routeName ?? 'unnamed',
            'uri' => $routeUri,
            'method' => $method,
            'file' => $filename,
            'created_at' => $createdAt,
            'last_updated' => now()->toIso8601String(),
            'update_count' => $updateCount + 1,
        ];

        File::put($indexPath, json_encode($index, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }

    /**
     * Sanitize request data (remove sensitive information)
     */
    protected function sanitizeRequestData(array $data): array
    {
        $sensitiveFields = ['password', 'password_confirmation', 'token', 'api_key', 'secret', 'authorization'];

        foreach ($sensitiveFields as $field) {
            if (isset($data[$field])) {
                $data[$field] = '***REDACTED***';
            }
        }

        return $data;
    }

    /**
     * Sanitize headers (remove sensitive information)
     */
    protected function sanitizeHeaders(array $headers): array
    {
        $sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];

        foreach ($sensitiveHeaders as $header) {
            $headerLower = strtolower($header);
            foreach ($headers as $key => $value) {
                if (strtolower($key) === $headerLower) {
                    $headers[$key] = ['***REDACTED***'];
                }
            }
        }

        return $headers;
    }
}
