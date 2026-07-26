<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\InboxNote;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use LaraCore\Http\Controllers\BaseController;

class CompanyDashboardController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $company = $user->company;

        if (!$company) {
            return $this->error([], __('Company not found'), 404);
        }

        $companyId = $company->id;

        $totalMembers = User::where('company_id', $companyId)->count();
        $activeMembers = User::where('company_id', $companyId)->where('status', 'active')->count();
        $onlineMembers = User::where('company_id', $companyId)->where('is_online', true)->count();
        $newMembersThisMonth = User::where('company_id', $companyId)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();
        $newMembersToday = User::where('company_id', $companyId)
            ->whereDate('created_at', today())
            ->count();

        $totalInboxNotes = InboxNote::where('company_id', $companyId)->count();
        $pendingNotes = InboxNote::where('company_id', $companyId)->where('status', 'pending')->count();
        $notesToday = InboxNote::where('company_id', $companyId)
            ->whereDate('created_at', today())
            ->count();
        $notesThisWeek = InboxNote::where('company_id', $companyId)
            ->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])
            ->count();
        $notesThisMonth = InboxNote::where('company_id', $companyId)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        $companyManagers = User::where('company_id', $companyId)
            ->where('role', 'company_manager')
            ->count();
        $members = User::where('company_id', $companyId)
            ->where('role', 'member')
            ->count();

        $result = [
            'company' => [
                'id' => $company->id,
                'name' => $company->name,
                'plan_type' => $company->plan_type,
                'status' => $company->status,
            ],
            'members' => [
                'total' => $totalMembers,
                'active' => $activeMembers,
                'online' => $onlineMembers,
                'company_managers' => $companyManagers,
                'members' => $members,
                'new_this_month' => $newMembersThisMonth,
                'new_today' => $newMembersToday,
            ],
            'inbox_notes' => [
                'total' => $totalInboxNotes,
                'pending' => $pendingNotes,
                'today' => $notesToday,
                'this_week' => $notesThisWeek,
                'this_month' => $notesThisMonth,
            ],
        ];

        return $this->success($result, __('Company statistics retrieved successfully'));
    }
}
