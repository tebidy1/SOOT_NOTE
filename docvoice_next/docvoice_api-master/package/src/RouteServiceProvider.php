<?php

namespace LaraCore;

use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

class RouteServiceProvider extends ServiceProvider
{
    /**
     * The path to your application's "home" route.
     *
     * Typically, users are redirected here after authentication.
     */
    public const HOME = '/home';

    /**
     * Define your route model bindings, pattern filters, and other route configuration.
     */
    public function boot(): void
    {
        $this->routes(function () {
            $this->mapWebRoutes();
            $this->mapApiRoutes();
        });
    }

    /**
     * Define the "web" routes for the application.
     *
     * These routes all receive session state, CSRF protection, etc.
     */
    protected function mapWebRoutes(): void
    {
        Route::middleware('web')
            ->group(function () {
                $this->loadWebRoutes();
            });
    }

    /**
     * Define the "api" routes for the application.
     *
     * These routes are typically stateless.
     */
    protected function mapApiRoutes(): void
    {
        Route::middleware('api')
            ->prefix('api')
            ->group(function () {
                $this->loadApiRoutes();
            });
    }

    /**
     * Load web routes from the package
     */
    protected function loadWebRoutes(): void
    {
        $webRoutesPath = __DIR__ . '/../routes/web.php';

        if (file_exists($webRoutesPath)) {
            Route::group([
                'namespace' => 'LaraCore\Http\Controllers',
            ], function () use ($webRoutesPath) {
                require $webRoutesPath;
            });
        }
    }

    /**
     * Load API routes from the package
     */
    protected function loadApiRoutes(): void
    {
        $apiRoutesPath = __DIR__ . '/../routes/api.php';

        if (file_exists($apiRoutesPath)) {
            Route::group([
                'namespace' => 'LaraCore\Http\Controllers\Api',
                'prefix' => 'v1',
            ], function () use ($apiRoutesPath) {
                require $apiRoutesPath;
            });
        }
    }
}
