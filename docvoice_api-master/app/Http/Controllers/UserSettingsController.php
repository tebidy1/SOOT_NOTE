<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use LaraCore\Http\Controllers\BaseController;

class UserSettingsController extends BaseController
{
    /**
     * Get current user settings.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            return $this->success($user->settings ?? [], __('Settings retrieved successfully'));
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }

    /**
     * Update user settings.
     */
    public function update(Request $request, $model = null): JsonResponse
    {
        try {
            $request->validate([
                'settings' => 'required|array',
            ]);

            $user = $request->user();
            // Merge settings
            $currentSettings = $user->settings ?? [];
            $newSettings = array_merge($currentSettings, $request->input('settings'));
            
            $user->settings = $newSettings;
            $user->save();

            return $this->success($user->settings, __('Settings updated successfully'));
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }
}
