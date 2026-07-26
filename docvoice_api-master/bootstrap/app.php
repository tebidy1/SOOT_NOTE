<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Trust proxies for proper HTTPS detection
        $middleware->trustProxies(at: '*');

        $middleware->web(remove: [
            \Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class,
        ]);

        $middleware->api(prepend: [
            \App\Http\Middleware\TrustProxies::class,
            \App\Http\Middleware\ForceHttps::class,
            \App\Http\Middleware\ForceJsonResponse::class,
            \App\Http\Middleware\LogFatalErrors::class,
            \App\Http\Middleware\LogErrors::class,
            \App\Http\Middleware\TenantResolver::class,
        ]);

        $middleware->api(remove: [
            \Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class,
            \Illuminate\Session\Middleware\StartSession::class,
            \Illuminate\View\Middleware\ShareErrorsFromSession::class,
        ]);

        // Register custom middleware aliases
        $middleware->alias([
            'role' => \App\Http\Middleware\CheckUserRole::class,
            'auth.by.iid' => \App\Http\Middleware\AuthByIid::class,
            'admin' => \App\Http\Middleware\EnsureAdmin::class,
            'SaveApiResponses' => \App\Http\Middleware\SaveApiResponses::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Log all exceptions
        $exceptions->report(function (Throwable $e) {
            $request = request();

            $context = [
                'exception' => get_class($e),
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ];

            if ($request) {
                $context['url'] = $request->fullUrl();
                $context['method'] = $request->method();
                $context['ip'] = $request->ip();
                $context['user_agent'] = $request->userAgent();
                $context['user_id'] = auth()->id();

                // Sanitize request data
                $data = $request->all();
                $sensitiveFields = ['password', 'password_confirmation', 'token', 'api_key', 'secret'];
                foreach ($sensitiveFields as $field) {
                    if (isset($data[$field])) {
                        $data[$field] = '***REDACTED***';
                    }
                }
                $context['request_data'] = $data;
            }

            // Check if it's a fatal error
            $isFatalError = $e instanceof \Symfony\Component\ErrorHandler\Error\FatalError
                || str_contains($e->getMessage(), 'must be compatible')
                || str_contains($e->getMessage(), 'Declaration of')
                || str_contains($e->getMessage(), 'FatalError');

            if ($isFatalError) {
                // Log fatal errors to separate channel
                \Illuminate\Support\Facades\Log::channel('fatal_errors')->error('Fatal Error', $context);
            }

            // Log database errors with SQL query
            if ($e instanceof \Illuminate\Database\QueryException) {
                $context['sql'] = $e->getSql();
                $context['bindings'] = $e->getBindings();
                \Illuminate\Support\Facades\Log::error('Database Query Exception', $context);
            } elseif ($e instanceof \Illuminate\Validation\ValidationException) {
                $context['errors'] = $e->errors();
                \Illuminate\Support\Facades\Log::warning('Validation Exception', $context);
            } elseif ($e instanceof \Illuminate\Auth\AuthenticationException) {
                \Illuminate\Support\Facades\Log::warning('Authentication Exception', $context);
            } else {
                \Illuminate\Support\Facades\Log::error('Application Exception', $context);
            }
        });
    })->create();
