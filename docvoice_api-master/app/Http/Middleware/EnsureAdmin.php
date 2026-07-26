<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EnsureAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next): JsonResponse|Closure
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'status' => false,
                'code' => 401,
                'message' => __('Unauthorized'),
            ], 401);
        }

        // Check if user is instance of User model
        if (!($user instanceof \App\Models\User)) {
            return response()->json([
                'status' => false,
                'code' => 403,
                'message' => __('User type not supported'),
            ], 403);
        }

        // Check if user has admin role
        $isAdmin = false;
        if ($user->role instanceof UserRole) {
            $isAdmin = $user->role === UserRole::Admin;
        } else {
            $isAdmin = $user->role === 'admin' || $user->role === UserRole::Admin->value;
        }

        if (!$isAdmin) {
            return response()->json([
                'status' => false,
                'code' => 403,
                'message' => __('You do not have permission to access this resource. Admin access required.'),
                'current_role' => $user->role instanceof UserRole ? $user->role->value : $user->role,
            ], 403);
        }

        return $next($request);
    }
}

