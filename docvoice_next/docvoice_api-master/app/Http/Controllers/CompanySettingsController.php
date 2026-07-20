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

        $request->validate([
            'groq_api_key' => ['nullable', 'string'],
            'gemini_api_key' => ['nullable', 'string'],
            'groq_model_pref' => ['nullable', 'string', 'in:whisper-large-v3,whisper-large-v3-turbo'],
            'specialty' => ['nullable', 'string'],
            'global_ai_prompt' => ['nullable', 'string'],
        ]);

        $currentSettings = $company->settings ?? [];

        // Update only provided keys
        $keys = ['groq_api_key', 'gemini_api_key', 'groq_model_pref', 'specialty', 'global_ai_prompt'];
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
