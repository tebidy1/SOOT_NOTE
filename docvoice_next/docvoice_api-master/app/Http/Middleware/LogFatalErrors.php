<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Symfony\Component\ErrorHandler\Error\FatalError;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class LogFatalErrors
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        try {
            return $next($request);
        } catch (Throwable $e) {
            if ($this->isFatalError($e)) {
                $this->logFatalError($request, $e);
            }
            throw $e;
        }
    }

    /**
     * Check if the exception is a fatal error
     */
    protected function isFatalError(Throwable $e): bool
    {
        return $e instanceof FatalError
            || str_contains($e->getMessage(), 'must be compatible')
            || str_contains($e->getMessage(), 'Declaration of')
            || str_contains($e->getMessage(), 'FatalError');
    }

    /**
     * Log fatal error to separate file
     */
    protected function logFatalError(Request $request, Throwable $e): void
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

        Log::channel('fatal_errors')->error('Fatal Error', $context);
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
