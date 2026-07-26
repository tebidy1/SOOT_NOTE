<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanySettingsController extends Controller
{
    /**
     * Get company settings
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $company = $user->company;

        if (!$company) {
            return response()->json([
                'success' => false,
                'message' => 'Company not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'settings' => $company->settings ?? [],
        ]);
    }

    /**
     * Update company settings
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        $company = $user->company;

        if (!$company) {
            return response()->json([
                'success' => false,
                'message' => 'Company not found',
            ], 404);
        }

        // Only company managers and admins can update settings
        if (!in_array($user->role->value ?? $user->role, ['admin', 'company_manager'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        // Data sovereignty policy: no third-party AI provider keys are accepted.
        // Oracle OCI is the only permitted AI/STT service.
        $request->validate([
            'specialty' => ['nullable', 'string'],
            'global_ai_prompt' => ['nullable', 'string'],
        ]);

        $currentSettings = $company->settings ?? [];

        $keys = ['specialty', 'global_ai_prompt'];
        foreach ($keys as $key) {
            if ($request->has($key)) {
                $currentSettings[$key] = $request->$key;
            }
        }

        $company->settings = $currentSettings;
        $company->save();

        return response()->json([
            'success' => true,
            'message' => 'Settings updated successfully',
            'settings' => $company->settings,
        ]);
    }
}
