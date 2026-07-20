<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ForceHttps
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Don't force HTTPS for gumra-ai.com domains that use HTTP
        $host = $request->getHost();
        $shouldForceHttps = !$request->secure() &&
            app()->environment('production') &&
            !str_contains($host, 'sootnote.com');

        if ($shouldForceHttps) {
            return redirect()->secure($request->getRequestUri(), 301);
        }

        $response = $next($request);

        // Only set HTTPS headers in production
        if ($request->secure() && app()->environment('production')) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        return $response;
    }
}
