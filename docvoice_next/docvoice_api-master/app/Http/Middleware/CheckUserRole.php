<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CheckUserRole
{
    public function handle(Request $request, Closure $next, string $role): JsonResponse|Closure
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'status' => false,
                'code' => 401,
                'message' => __('Unauthorized'),
            ], 401);
        }

        // Check if user is instance of User model and has the required role
        if (!($user instanceof \App\Models\User)) {
            return response()->json([
                'status' => false,
                'code' => 403,
                'message' => __('User type not supported'),
            ], 403);
        }

        if (!$this->hasRole($user, $role)) {
            return response()->json([
                'status' => false,
                'code' => 403,
                'current_role' => $user->role->value ?? $user->role,
                'required_role' => $role,
                'message' => __('You do not have permission to access this resource'),
            ], 403);
        }

        return $next($request);
    }

    private function hasRole(\App\Models\User $user, string $role): bool
    {
        // Check if user has the required role
        if ($role === 'company_member') {
            return $user->company_id !== null;
        }

        // Support enum comparison
        if ($user->role instanceof UserRole) {
            return $user->role->value === $role;
        }

        return $user->role === $role;
    }
}
