<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class LogErrors
{
    /**
     * Handle an incoming request and log any errors.
     */
    public function handle(Request $request, Closure $next): Response
    {
        try {
            $response = $next($request);

            // Log non-successful responses
            if ($response->getStatusCode() >= 400) {
                $this->logErrorResponse($request, $response);
            }

            return $response;
        } catch (Throwable $e) {
            $this->logException($request, $e);
            throw $e;
        }
    }

    /**
     * Log error response
     */
    protected function logErrorResponse(Request $request, Response $response): void
    {
        $this->ensureLogDirectoryExists();

        $context = [
            'url' => $request->fullUrl(),
            'method' => $request->method(),
            'status_code' => $response->getStatusCode(),
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'user_id' => Auth::id(),
            'request_data' => $this->sanitizeRequestData($request),
            'response_data' => $this->getResponseData($response),
        ];

        Log::channel('http_errors')->error('HTTP Error Response', $context);
    }

    /**
     * Log exception
     */
    protected function logException(Request $request, Throwable $e): void
    {
        $this->ensureLogDirectoryExists();

        $context = [
            'exception' => get_class($e),
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString(),
            'url' => $request->fullUrl(),
            'method' => $request->method(),
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'user_id' => Auth::id(),
            'request_data' => $this->sanitizeRequestData($request),
        ];

        // Log database errors with SQL query
        if ($e instanceof QueryException) {
            $context['sql'] = $e->getSql();
            $context['bindings'] = $e->getBindings();
            Log::channel('http_errors')->error('Database Query Exception', $context);
        } elseif ($e instanceof ValidationException) {
            $context['errors'] = $e->errors();
            Log::channel('http_errors')->warning('Validation Exception', $context);
        } elseif ($e instanceof AuthenticationException) {
            Log::channel('http_errors')->warning('Authentication Exception', $context);
        } else {
            Log::channel('http_errors')->error('Application Exception', $context);
        }
    }

    /**
     * Sanitize request data (remove sensitive information)
     */
    protected function sanitizeRequestData(Request $request): array
    {
        $data = $request->all();

        // Remove sensitive fields
        $sensitiveFields = ['password', 'password_confirmation', 'token', 'api_key', 'secret'];

        foreach ($sensitiveFields as $field) {
            if (isset($data[$field])) {
                $data[$field] = '***REDACTED***';
            }
        }

        return $data;
    }

    /**
     * Get response data
     */
    protected function getResponseData(Response $response): ?array
    {
        try {
            $content = $response->getContent();
            if ($content) {
                $decoded = json_decode($content, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    return $decoded;
                }
            }
        } catch (\Exception $e) {
            // Ignore errors when getting response data
        }

        return null;
    }

    /**
     * Ensure log directory exists
     */
    protected function ensureLogDirectoryExists(): void
    {
        $logPath = base_path('res_debug');
        if (! File::exists($logPath)) {
            File::makeDirectory($logPath, 0755, true);
        }
    }
}
