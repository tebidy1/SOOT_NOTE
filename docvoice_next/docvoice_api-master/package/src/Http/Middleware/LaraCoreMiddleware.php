<?php

namespace LaraCore\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LaraCoreMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Add package headers
        $response = $next($request);
        
        $response->headers->set('X-Package', 'LaraCore');
        $response->headers->set('X-Package-Version', '1.0.0');
        
        return $response;
    }
}
