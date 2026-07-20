<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\MedicalDepartment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MedicalDepartmentController extends Controller
{
    use ResponseTrait;

    /**
     * Get all active medical departments.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $locale = $request->header('Accept-Language', 'en');

            $departments = MedicalDepartment::active()
                ->ordered()
                ->get()
                ->map(function ($department) use ($locale) {
                    return [
                        'id' => $department->id,
                        'name_en' => $department->name_en,
                        'name_ar' => $department->name_ar,
                        'name' => $locale === 'ar' ? $department->name_ar : $department->name_en,
                        'icon' => $department->icon,
                        'color' => $department->color,
                        'relevant_categories' => $department->relevant_categories ?? ['General'],
                    ];
                });

            return $this->success($departments, __('Medical departments retrieved successfully'));
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }

    /**
     * Get a specific medical department by ID.
     */
    public function show(Request $request, string $departmentId): JsonResponse
    {
        try {
            $locale = $request->header('Accept-Language', 'en');

            $department = MedicalDepartment::find($departmentId);

            if (!$department) {
                return $this->notFoundResponse(__('Medical department not found'));
            }

            return $this->success([
                'id' => $department->id,
                'name_en' => $department->name_en,
                'name_ar' => $department->name_ar,
                'name' => $locale === 'ar' ? $department->name_ar : $department->name_en,
                'icon' => $department->icon,
                'color' => $department->color,
                'relevant_categories' => $department->relevant_categories ?? ['General'],
            ], __('Medical department retrieved successfully'));
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }

    /**
     * Update the current user's medical department.
     */
    public function updateUserDepartment(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'department_id' => 'required|integer|exists:medical_departments,id',
            ]);

            $user = $request->user();
            $department = MedicalDepartment::find($request->input('department_id'));

            if (!$department) {
                return $this->notFoundResponse(__('Medical department not found'));
            }

            $user->medical_department_id = $department->id;
            $user->save();

            return $this->success([
                'medical_department_id' => $department->id,
                'medical_department_name' => $department->name_en,
                'medical_department_name_ar' => $department->name_ar,
            ], __('Medical department updated successfully'));
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }

    /**
     * Get the current user's selected medical department.
     */
    public function getUserDepartment(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $locale = $request->header('Accept-Language', 'en');

            if (!$user->medical_department_id) {
                return $this->success(null, __('No medical department selected'));
            }

            $department = $user->medicalDepartment;

            if (!$department) {
                return $this->success(null, __('No medical department selected'));
            }

            return $this->success([
                'id' => $department->id,
                'name_en' => $department->name_en,
                'name_ar' => $department->name_ar,
                'name' => $locale === 'ar' ? $department->name_ar : $department->name_en,
                'icon' => $department->icon,
                'color' => $department->color,
            ], __('User medical department retrieved successfully'));
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }

    /**
     * Remove the current user's medical department selection.
     */
    public function removeUserDepartment(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $user->medical_department_id = null;
            $user->save();

            return $this->success(null, __('Medical department removed successfully'));
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }
}
