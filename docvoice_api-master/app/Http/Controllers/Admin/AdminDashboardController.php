<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\CompanyStatus;
use App\Models\Company;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use LaraCore\Http\Controllers\BaseController;

class AdminDashboardController extends BaseController
{
    /**
     * Get general statistics for admin dashboard
     */
    public function dashboardStatistics(Request $request): JsonResponse
    {
        try {
            $stats = [
                'companies' => [
                    'total' => Company::count(),
                    'active' => Company::where('status', CompanyStatus::Active->value)->count(),
                    'suspended' => Company::where('status', CompanyStatus::Suspended->value)->count(),
                    'created_today' => Company::whereDate('created_at', today())->count(),
                    'created_this_week' => Company::whereBetween('created_at', [
                        now()->startOfWeek(),
                        now()->endOfWeek(),
                    ])->count(),
                    'created_this_month' => Company::whereMonth('created_at', now()->month)->count(),
                ],
                'users' => [
                    'total' => User::count(),
                    'admins' => User::where('role', 'admin')->count(),
                    'company_managers' => User::where('role', 'company_manager')->count(),
                    'members' => User::where('role', 'member')->count(),
                    'active' => User::where('status', 'active')->count(),
                    'online' => User::where('is_online', true)->count(),
                    'created_today' => User::whereDate('created_at', today())->count(),
                    'created_this_week' => User::whereBetween('created_at', [
                        now()->startOfWeek(),
                        now()->endOfWeek(),
                    ])->count(),
                    'created_this_month' => User::whereMonth('created_at', now()->month)->count(),
                ],
            ];

            return $this->success($stats, __('Statistics retrieved successfully'));
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }

    /**
     * Get companies statistics
     */
    public function dashboardCompaniesStatistics(Request $request): JsonResponse
    {
        try {
            $stats = Company::selectRaw('
                COUNT(*) as total,
                SUM(CASE WHEN status = "active" THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN status = "suspended" THEN 1 ELSE 0 END) as suspended,
                SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as created_today,
                SUM(CASE WHEN YEARWEEK(created_at) = YEARWEEK(NOW()) THEN 1 ELSE 0 END) as created_this_week,
                SUM(CASE WHEN MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW()) THEN 1 ELSE 0 END) as created_this_month
            ')->first();

            return $this->success($stats, __('Companies statistics retrieved successfully'));
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }

    /**
     * Get users statistics
     */
    public function dashboardUsersStatistics(Request $request): JsonResponse
    {
        try {
            $stats = User::selectRaw('
                COUNT(*) as total,
                SUM(CASE WHEN role = "admin" THEN 1 ELSE 0 END) as admins,
                SUM(CASE WHEN role = "company_manager" THEN 1 ELSE 0 END) as company_managers,
                SUM(CASE WHEN role = "member" THEN 1 ELSE 0 END) as members,
                SUM(CASE WHEN status = "active" THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN is_online = 1 THEN 1 ELSE 0 END) as online,
                SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as created_today,
                SUM(CASE WHEN YEARWEEK(created_at) = YEARWEEK(NOW()) THEN 1 ELSE 0 END) as created_this_week,
                SUM(CASE WHEN MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW()) THEN 1 ELSE 0 END) as created_this_month
            ')->first();

            return $this->success($stats, __('Users statistics retrieved successfully'));
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }
}

