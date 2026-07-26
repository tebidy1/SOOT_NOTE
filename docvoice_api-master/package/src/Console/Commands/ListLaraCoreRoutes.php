<?php

namespace LaraCore\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Route;

class ListLaraCoreRoutes extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'laracore:routes {--type=all : Route type (web, api, all)}';

    /**
     * The console command description.
     */
    protected $description = 'List all LaraCore package routes';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $type = $this->option('type');
        
        $this->info('LaraCore Package Routes');
        $this->info('=====================');
        
        $routes = collect(Route::getRoutes())->filter(function ($route) {
            $uri = $route->uri();
            return str_starts_with($uri, 'laracore') || str_starts_with($uri, 'api/v1/laracore');
        });
        
        if ($type === 'web') {
            $routes = $routes->filter(function ($route) {
                return str_starts_with($route->uri(), 'laracore');
            });
        } elseif ($type === 'api') {
            $routes = $routes->filter(function ($route) {
                return str_starts_with($route->uri(), 'api/v1/laracore');
            });
        }
        
        if ($routes->isEmpty()) {
            $this->warn('No LaraCore routes found.');
            return 0;
        }
        
        $tableData = $routes->map(function ($route) {
            return [
                'Method' => implode('|', $route->methods()),
                'URI' => $route->uri(),
                'Name' => $route->getName() ?: '-',
                'Action' => $route->getActionName(),
            ];
        })->toArray();
        
        $this->table(['Method', 'URI', 'Name', 'Action'], $tableData);
        
        $this->info('Total routes: ' . $routes->count());
        
        return 0;
    }
}
