<?php

declare(strict_types=1);

namespace Tests\ApiTester;

use Illuminate\Support\Facades\Route;

class RouteScanner
{
    private string $basePath;

    private array $endpoints = [];

    public function __construct(string $basePath)
    {
        $this->basePath = $basePath;
    }

    public function scan(): array
    {
        $this->endpoints = [];

        // Load Laravel routes
        $this->loadLaravelRoutes();

        // Scan route files directly
        $this->scanRouteFiles();

        return $this->endpoints;
    }

    private function loadLaravelRoutes(): void
    {
        try {
            // Check if Laravel is already bootstrapped
            if (class_exists(\Illuminate\Support\Facades\Route::class)) {
                // Laravel is already loaded, use it directly
                $routes = \Illuminate\Support\Facades\Route::getRoutes();
            } else {
                // Bootstrap Laravel if not already loaded
                require_once $this->basePath.'/vendor/autoload.php';
                $app = require $this->basePath.'/bootstrap/app.php';
                
                // Check if $app is Application instance
                if (!($app instanceof \Illuminate\Contracts\Foundation\Application)) {
                    // If bootstrap/app.php returns something else, try to get app from container
                    if (function_exists('app')) {
                        $app = app();
                    } else {
                        throw new \Exception('Failed to bootstrap Laravel application');
                    }
                }
                
                $app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();
                $routes = \Illuminate\Support\Facades\Route::getRoutes();
            }

            foreach ($routes as $route) {
                $uri = $route->uri();
                $methods = $route->methods();
                $action = $route->getAction();

                // Only process API routes
                // In Laravel 11, routes are already prefixed with 'api' in the URI
                // So we check for routes that start with 'api/' or are in the 'api' middleware group
                $middleware = $route->middleware();
                $isApiRoute = str_starts_with($uri, 'api/')
                    || str_starts_with($uri, 'auth/')
                    || in_array('api', $middleware)
                    || str_contains(implode('|', $middleware), 'api');

                if (! $isApiRoute) {
                    continue;
                }

                // Skip closure routes that are not API endpoints
                if (isset($action['uses']) && is_string($action['uses'])) {
                    foreach ($methods as $method) {
                        if ($method === 'HEAD') {
                            continue;
                        }

                        // Build full URI - Laravel already includes 'api' prefix
                        $fullUri = $uri;
                        if (! str_starts_with($fullUri, '/')) {
                            $fullUri = '/'.$fullUri;
                        }
                        // Ensure it starts with /api
                        if (! str_starts_with($fullUri, '/api')) {
                            if (str_starts_with($fullUri, '/auth')) {
                                $fullUri = '/api'.$fullUri;
                            } else {
                                $fullUri = '/api'.$fullUri;
                            }
                        }

                        $this->addEndpoint([
                            'method' => $method,
                            'uri' => $uri,
                            'full_uri' => $fullUri,
                            'name' => $route->getName(),
                            'action' => $action['uses'],
                            'middleware' => $route->middleware(),
                            'controller' => $this->extractController($action['uses']),
                            'controller_method' => $this->extractMethod($action['uses']),
                        ]);
                    }
                } elseif (isset($action['uses']) && is_callable($action['uses'])) {
                    // Handle closure routes
                    foreach ($methods as $method) {
                        if ($method === 'HEAD') {
                            continue;
                        }

                        // Build full URI
                        $fullUri = $uri;
                        if (! str_starts_with($fullUri, '/')) {
                            $fullUri = '/'.$fullUri;
                        }
                        if (! str_starts_with($fullUri, '/api')) {
                            $fullUri = '/api'.$fullUri;
                        }

                        $this->addEndpoint([
                            'method' => $method,
                            'uri' => $uri,
                            'full_uri' => $fullUri,
                            'name' => $route->getName(),
                            'action' => 'Closure',
                            'middleware' => $route->middleware(),
                            'controller' => null,
                            'controller_method' => null,
                        ]);
                    }
                }
            }
        } catch (\Exception $e) {
            // Fallback to file scanning if Laravel bootstrap fails
            error_log('Laravel bootstrap failed: '.$e->getMessage());
        }
    }

    private function scanRouteFiles(): void
    {
        $routeFiles = [
            $this->basePath.'/routes/api.php',
            $this->basePath.'/routes/auth.php',
        ];

        foreach ($routeFiles as $file) {
            if (file_exists($file)) {
                $this->parseRouteFile($file);
            }
        }
    }

    private function parseRouteFile(string $file): void
    {
        $content = file_get_contents($file);

        // Extract Route:: definitions
        preg_match_all(
            '/Route::(get|post|put|patch|delete|any)\s*\([\'"]([^\'"]+)[\'"],\s*\[([^\]]+)\]\)/i',
            $content,
            $matches,
            PREG_SET_ORDER
        );

        foreach ($matches as $match) {
            $method = strtoupper($match[1]);
            $uri = $match[2];
            $controller = trim($match[3]);

            $this->addEndpoint([
                'method' => $method,
                'uri' => $uri,
                'full_uri' => str_starts_with($uri, '/') ? $uri : '/api/'.$uri,
                'controller' => $this->extractController($controller),
                'controller_method' => $this->extractMethod($controller),
            ]);
        }

        // Extract Route::prefix and Route::group patterns
        preg_match_all(
            '/Route::(prefix|group|middleware)\([\'"]([^\'"]+)[\'"]\)->group\s*\(function\s*\(\)\s*\{([^}]+)\}/s',
            $content,
            $groupMatches,
            PREG_SET_ORDER
        );

        // Extract resource routes
        preg_match_all(
            '/Route::(resource|apiResource)\s*\([\'"]([^\'"]+)[\'"],\s*\[([^\]]+)\]\)/i',
            $content,
            $resourceMatches,
            PREG_SET_ORDER
        );

        foreach ($resourceMatches as $match) {
            $resource = $match[2];
            $controller = trim($match[3]);

            $resourceRoutes = [
                ['method' => 'GET', 'uri' => $resource, 'action' => 'index'],
                ['method' => 'POST', 'uri' => $resource, 'action' => 'store'],
                ['method' => 'GET', 'uri' => $resource.'/{id}', 'action' => 'show'],
                ['method' => 'PUT', 'uri' => $resource.'/{id}', 'action' => 'update'],
                ['method' => 'PATCH', 'uri' => $resource.'/{id}', 'action' => 'update'],
                ['method' => 'DELETE', 'uri' => $resource.'/{id}', 'action' => 'destroy'],
            ];

            foreach ($resourceRoutes as $route) {
                $this->addEndpoint([
                    'method' => $route['method'],
                    'uri' => $route['uri'],
                    'full_uri' => '/api/'.$route['uri'],
                    'controller' => $this->extractController($controller),
                    'controller_method' => $route['action'],
                ]);
            }
        }
    }

    private function extractController(string $action): ?string
    {
        if (str_contains($action, '::')) {
            return explode('::', $action)[0];
        }

        return null;
    }

    private function extractMethod(string $action): ?string
    {
        if (str_contains($action, '::')) {
            return explode('::', $action)[1] ?? null;
        }
        if (str_contains($action, '@')) {
            return explode('@', $action)[1] ?? null;
        }

        return null;
    }

    private function addEndpoint(array $endpoint): void
    {
        $identifier = $endpoint['method'].'|'.$endpoint['full_uri'];

        // Avoid duplicates
        foreach ($this->endpoints as $existing) {
            if ($existing['identifier'] === $identifier) {
                return;
            }
        }

        $endpoint['identifier'] = $identifier;
        $this->endpoints[] = $endpoint;
    }

    public function getEndpoints(): array
    {
        return $this->endpoints;
    }

    public function getEndpointsByMethod(): array
    {
        $grouped = [];
        foreach ($this->endpoints as $endpoint) {
            $method = $endpoint['method'];
            if (! isset($grouped[$method])) {
                $grouped[$method] = [];
            }
            $grouped[$method][] = $endpoint;
        }

        return $grouped;
    }
}
