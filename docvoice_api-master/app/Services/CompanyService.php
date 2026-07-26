<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Company;
use Illuminate\Support\Collection;

class CompanyService
{
    /**
     * حساب إحصائيات الشركة
     */
    public function calculateCompanyStats(Company $company): array
    {
        return [
            'total_users' => $company->users()->count(),
            'active_users' => $company->users()->active()->count(),
            'inactive_users' => $company->users()->inactive()->count(),
            'admin_users' => $company->users()->admins()->count(),
            'total_workspaces' => $company->workspaces()->count(),
            'recent_users' => $this->getRecentUsers($company, 5),
            'user_growth' => $this->calculateUserGrowth($company),
        ];
    }

    /**
     * الحصول على المستخدمين الجدد في الشركة
     */
    public function getRecentUsers(Company $company, int $limit = 10): Collection
    {
        return $company->users()
            ->latest()
            ->take($limit)
            ->get(['id', 'name', 'email', 'created_at']);
    }

    /**
     * حساب نمو المستخدمين في آخر 6 أشهر
     */
    public function calculateUserGrowth(Company $company): array
    {
        $months = collect(range(0, 5))->map(function ($i) use ($company) {
            $startOfMonth = now()->subMonths($i)->startOfMonth();
            $endOfMonth = now()->subMonths($i)->endOfMonth();

            return [
                'month' => $startOfMonth->format('Y-m'),
                'month_name' => $startOfMonth->format('M Y'),
                'users_count' => $company->users()
                    ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                    ->count(),
            ];
        })->reverse()->values();

        return $months->toArray();
    }

    /**
     * التحقق من صحة بيانات الشركة قبل الحذف
     */
    public function canDeleteCompany(Company $company): array
    {
        $issues = [];

        // التحقق من وجود مستخدمين
        if ($company->users()->exists()) {
            $usersCount = $company->users()->count();
            $issues[] = "توجد {$usersCount} مستخدم مرتبط بهذه الشركة";
        }

        // التحقق من وجود مساحات عمل
        if ($company->workspaces()->exists()) {
            $workspacesCount = $company->workspaces()->count();
            $issues[] = "توجد {$workspacesCount} مساحة عمل مرتبطة بهذه الشركة";
        }

        return [
            'can_delete' => empty($issues),
            'issues' => $issues,
        ];
    }

    /**
     * تنظيف بيانات الشركة وإعداد البيانات التقليدية
     */
    public function prepareCompanyData(array $data): array
    {
        // إنشاء شعار افتراضي من الحرف الأول
        if (empty($data['logo']) && ! empty($data['name'])) {
            $data['logo'] = strtoupper(substr($data['name'], 0, 1));
        }

        // تنظيف البيانات
        $data['name'] = trim($data['name']);
        $data['email'] = isset($data['email']) ? strtolower(trim($data['email'])) : null;
        $data['phone'] = isset($data['phone']) ? preg_replace('/[^0-9+]/', '', $data['phone']) : null;

        return $data;
    }

    /**
     * الحصول على قائمة الشركات النشطة مع إحصائيات مبسطة
     */
    public function getActiveCompaniesWithStats(): Collection
    {
        return Company::active()
            ->withCount(['users', 'workspaces'])
            ->orderBy('name')
            ->get(['id', 'name', 'logo', 'created_at']);
    }

    /**
     * البحث في الشركات بناءً على معايير متعددة
     */
    public function searchCompanies(string $searchTerm): Collection
    {
        return Company::where(function ($query) use ($searchTerm) {
            $query->where('name', 'like', "%{$searchTerm}%")
                ->orWhere('description', 'like', "%{$searchTerm}%")
                ->orWhere('email', 'like', "%{$searchTerm}%");
        })
            ->withCount(['users', 'workspaces'])
            ->orderBy('name')
            ->get();
    }
}
