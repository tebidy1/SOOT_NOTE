<?php

namespace LaraCore;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Facade;
use LaraCore\Helpers\HelperManager;

class CoreServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Register HelperManager as singleton
        $this->app->singleton('laracore.helpers', function () {
            return new HelperManager();
        });

        // Register the Helpers facade alias
        Facade::setFacadeApplication($this->app);

        // Add alias to the application
        $this->app->alias('laracore.helpers', HelperManager::class);
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Load routes
        $this->loadRoutesFrom(__DIR__ . '/../routes/web.php');
        $this->loadRoutesFrom(__DIR__ . '/../routes/api.php');

        // The middleware is already registered in the main app bootstrap file
        // so we don't need to register it here to avoid conflicts

        // Publish any config files if needed
        // $this->publishes([
        //     __DIR__.'/../config/core.php' => config_path('core.php'),
        // ], 'core-config');
    }
}