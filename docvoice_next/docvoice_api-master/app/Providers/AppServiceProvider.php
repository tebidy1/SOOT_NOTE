<?php

declare(strict_types=1);

namespace App\Providers;

use App\Models\Channel;

use App\Policies\ChannelPolicy;
use App\Policies\TopicPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Channel::class => ChannelPolicy::class,
        Topic::class => TopicPolicy::class,
    ];

    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Merge API Agent config
        $this->mergeConfigFrom(
            base_path('config/laravel_api_agent.php'),
            'laravel_api_agent'
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register policies
        foreach ($this->policies as $model => $policy) {
            Gate::policy($model, $policy);
        }


    }
}
