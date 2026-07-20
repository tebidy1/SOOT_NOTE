<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TenantResolver
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        // Try to get company_id from various sources
        $companyId = null;

        // 1. From authenticated user
        if ($request->user() && $request->user()->company_id) {
            $companyId = $request->user()->company_id;
        }

        // 2. From request body
        if (!$companyId && $request->has('company_id')) {
            $companyId = $request->input('company_id');
        }

        // 3. From query parameter
        if (!$companyId && $request->has('companyId')) {
            $companyId = $request->query('companyId');
        }

        // 4. From route parameter
        if (!$companyId && $request->route('company_id')) {
            $companyId = $request->route('company_id');
        }

        // 5. From header
        if (!$companyId && $request->hasHeader('X-Company-Id')) {
            $companyId = $request->header('X-Company-Id');
        }

        // Set company_id in request for easy access
        if ($companyId) {
            $request->merge(['company_id' => (int) $companyId]);
        }

        return $next($request);
    }
}

