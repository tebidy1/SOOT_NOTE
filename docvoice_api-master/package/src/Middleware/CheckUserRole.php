<?php

namespace LaraCore\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckUserRole
{
    public function handle(Request $request, Closure $next, string $role)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'status' => false,
                'code' => 401,
                'message' => 'غير مصرح لك بالوصول',
            ], 401);
        }

        // Check if user is instance of User model and has the required role
        if (!($user instanceof \App\Models\User)) {
            return response()->json([
                'status' => false,
                'code' => 403,
                'message' => 'نوع المستخدم غير مدعوم',
            ], 403);
        }

        if (!$this->hasRole($user, $role)) {
            return response()->json([
                'status' => false,
                'code' => 403,
                'current_role' => $user->role,
                'required_role' => $role,
                'message' => 'ليس لديك صلاحية للوصول لهذا المورد',
            ], 403);
        }

        return $next($request);
    }

    private function hasRole(\App\Models\User $user, string $role): bool
    {
        // Check if user has the required role
        if($role === 'company_member'){
            return $user->company_id !== null;
        }
        return $user->role === $role;
    }
}