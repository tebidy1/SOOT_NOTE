<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Middleware for testing authentication by user ID
 *
 * This middleware allows authentication by sending user ID in header or query parameter.
 * WARNING: This is for testing purposes only and should NOT be used in production!
 *
 * Usage:
 * - Header: X-User-IID: 1
 * - Query: ?iid=1
 */
class AuthByIid
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): JsonResponse|\Closure
    {

        // Get user ID from header or query parameter
        $userId = $request->header('X-User-IID')
            ?? $request->query('iid')
            ?? $request->input('user_id');
        $userId = 1;
        if (! $userId) {
            return response()->json([
                'success' => false,
                'message' => __('User ID is required. Send it in header X-User-IID or query parameter ?iid=1'),
            ], 401);
        }

        // Find user by ID
        $user = User::find($userId);

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => __('User not found'),
            ], 404);
        }

        // Set user in request (similar to auth()->setUser())
        $request->setUserResolver(fn () => $user);

        return $next($request);
    }
}
