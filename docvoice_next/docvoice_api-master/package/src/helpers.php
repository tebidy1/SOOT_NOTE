<?php

use LaraCore\Helpers\HelperManager;

if (!function_exists('route_id')) {
    function route_id()
    {
        $r = request()->route();
        $n = request()->route()->parameterNames[0] ?? false;

        return $r->parameters[$n] ?? false;
    }}
if (!function_exists('laracore_helpers')) {
    /**
     * Get the LaraCore Helpers instance
     */
    function laracore_helpers(): HelperManager
    {
        return app('laracore.helpers');
    }
}

if (!function_exists('laracore_price')) {
    /**
     * Get the Price Helper instance
     */
    function laracore_price()
    {
        return laracore_helpers()->price();
    }
}

if (!function_exists('laracore_file')) {
    /**
     * Get the File Helper instance
     */
    function laracore_file()
    {
        return laracore_helpers()->file();
    }
}

if (!function_exists('laracore_user')) {
    /**
     * Get the User Helper instance
     */
    function laracore_user()
    {
        return laracore_helpers()->user();
    }
}

if (!function_exists('format_price')) {
    /**
     * Format price with currency
     */
    function format_price(float $price, string $currency = 'SAR'): string
    {
        return laracore_price()->format($price, $currency);
    }
}

if (!function_exists('format_file_size')) {
    /**
     * Format file size
     */
    function format_file_size(int $bytes): string
    {
        return laracore_file()->formatSize($bytes);
    }
}

if (!function_exists('get_user_initials')) {
    /**
     * Get user initials from name
     */
    function get_user_initials(string $name): string
    {
        return laracore_user()->getInitials($name);
    }
}

// Route Helper Functions
if (!function_exists('laracore_route')) {
    /**
     * Generate a URL to a named route in LaraCore package
     */
    function laracore_route(string $name, array $parameters = [], bool $absolute = true): string
    {
        return route('laracore.' . $name, $parameters, $absolute);
    }
}

if (!function_exists('laracore_api_route')) {
    /**
     * Generate a URL to a named API route in LaraCore package
     */
    function laracore_api_route(string $name, array $parameters = [], bool $absolute = true): string
    {
        return route('api.' . $name, $parameters, $absolute);
    }
}

if (!function_exists('laracore_web_url')) {
    /**
     * Generate a web URL for LaraCore package
     */
    function laracore_web_url(string $path = ''): string
    {
        $baseUrl = config('app.url');
        return $baseUrl . '/laracore' . ($path ? '/' . ltrim($path, '/') : '');
    }
}

if (!function_exists('laracore_api_url')) {
    /**
     * Generate an API URL for LaraCore package
     */
    function laracore_api_url(string $path = ''): string
    {
        $baseUrl = config('app.url');
        return $baseUrl . '/api/v1/laracore' . ($path ? '/' . ltrim($path, '/') : '');
    }
}

if (!function_exists('laracore_asset')) {
    /**
     * Generate a URL for LaraCore package assets
     */
    function laracore_asset(string $path): string
    {
        return asset('vendor/laracore/' . ltrim($path, '/'));
    }
}

if (!function_exists('route_id')) {
    /**
     * Get the route parameter ID from the current request
     */
    function route_id()
    {
        $r = request()->route();
        $n = request()->route()->parameterNames[0] ?? false;

        return $r->parameters[$n] ?? false;
    }
}
