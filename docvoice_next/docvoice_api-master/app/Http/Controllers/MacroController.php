<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Macro\StoreMacroRequest;
use App\Http\Requests\Macro\UpdateMacroRequest;
use App\Models\Macro;
use App\Models\MedicalDepartment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use LaraCore\Http\Controllers\BaseController;
use LaraCore\Traits\ControllerOperationsTrait;

class MacroController extends BaseController
{
    use ControllerOperationsTrait;

    public const CONFIG = [
        'search_fields' => ['trigger', 'content'],
        'default_relations' => ['user', 'company', 'medicalDepartments'],
        'model_class' => Macro::class,
        'request_class' => StoreMacroRequest::class,
    ];

    /**
     * Display a listing of the resource.
     * Auto-filter by authenticated user's company.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $modelClass = static::CONFIG['model_class'];
            $userId = auth()->id();

            $query = $modelClass::query()
                ->with(static::CONFIG['default_relations']);

            // Auto-filter by authenticated user's company
            if (auth()->check() && auth()->user()->company_id) {
                $query->where('company_id', auth()->user()->company_id);
            }

            // Eager load favorites for current user
            if ($userId) {
                $query->with(['favoritedBy' => function ($q) use ($userId) {
                    $q->where('user_id', $userId);
                }]);
            }

            // Apply search and filters
            $query = $this->applySearchAndFilters($query, $request, static::CONFIG['search_fields']);

            // Paginate
            $perPage = $request->get('per_page', 15);
            $macros = $query->paginate($perPage);

            // Add is_favorite dynamically
            $macros->getCollection()->transform(function ($macro) use ($userId) {
                $macro->setAttribute('is_favorite', $macro->isFavoriteByUser($userId));
                return $macro;
            });

            return $this->paginatedResponse($macros, __('Resources retrieved successfully'));
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show($id): JsonResponse
    {
        try {
            $modelClass = static::CONFIG['model_class'];
            $userId = auth()->id();

            $relations = array_merge(
                static::CONFIG['default_relations'],
                isset(static::CONFIG['show_relations']) ? static::CONFIG['show_relations'] : []
            );

            $query = $modelClass::with($relations);

            // Auto-filter by authenticated user's company
            if (auth()->check() && auth()->user()->company_id) {
                $query->where('company_id', auth()->user()->company_id);
            }

            // Eager load favorites for current user
            if ($userId) {
                $query->with(['favoritedBy' => function ($q) use ($userId) {
                    $q->where('user_id', $userId);
                }]);
            }

            $model = $query->findOrFail($id);

            // Add is_favorite dynamically
            $model->setAttribute('is_favorite', $model->isFavoriteByUser($userId));

            return $this->success($model, __('Resource retrieved successfully'));
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 404);
        }
    }

    /**
     * Get macros by medical department
     */
    public function getByDepartment(string $departmentId, Request $request): JsonResponse
    {
        try {
            $department = MedicalDepartment::find($departmentId);

            if (!$department) {
                return $this->error([], __('Department not found'), 404);
            }

            $query = Macro::query()
                ->whereHas('medicalDepartments', function ($q) use ($department) {
                    $q->where('medical_departments.id', $department->id);
                })
                ->with(static::CONFIG['default_relations']);

            // Apply user filter if provided
            if ($request->has('user_id')) {
                $query->where('user_id', $request->user_id);
            }

            // Apply company filter if provided
            if ($request->has('company_id')) {
                $query->where('company_id', $request->company_id);
            }

            $macros = $query->orderBy('trigger', 'asc')->get();

            // Add is_favorite dynamically for authenticated users
            $userId = auth()->id();
            foreach ($macros as $macro) {
                $macro->setAttribute('is_favorite', $macro->isFavoriteByUser($userId));
            }

            return $this->success($macros, __('Macros retrieved successfully'));
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }

    /**
     * Get favorite macros
     */
    public function getFavorites(Request $request): JsonResponse
    {
        try {
            $userId = auth()->id();

            if (!$userId) {
                return $this->error([], __('User not authenticated'), 401);
            }

            $query = Macro::query()
                ->whereHas('favoritedBy', function ($q) use ($userId) {
                    $q->where('user_id', $userId);
                })
                ->with(static::CONFIG['default_relations']);

            // Apply company filter if provided
            if ($request->has('company_id')) {
                $query->where('company_id', $request->company_id);
            }

            $macros = $query->orderBy('trigger', 'asc')->get();

            // Add is_favorite dynamically
            foreach ($macros as $macro) {
                $macro->setAttribute('is_favorite', true);
            }

            return $this->success($macros, __('Favorite macros retrieved successfully'));
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }

    /**
     * Get most used macros
     */
    public function getMostUsed(Request $request): JsonResponse
    {
        try {
            $limit = $request->get('limit', 10);
            $query = Macro::query()
                ->with(static::CONFIG['default_relations']);

            // Apply user filter if provided
            if ($request->has('user_id')) {
                $query->where('user_id', $request->user_id);
            }

            // Apply company filter if provided
            if ($request->has('company_id')) {
                $query->where('company_id', $request->company_id);
            }

            $macros = $query->orderBy('usage_count', 'desc')
                ->orderBy('last_used', 'desc')
                ->limit($limit)
                ->get();

            // Add is_favorite dynamically for authenticated users
            $userId = auth()->id();
            foreach ($macros as $macro) {
                $macro->setAttribute('is_favorite', $macro->isFavoriteByUser($userId));
            }

            return $this->success($macros, __('Most used macros retrieved successfully'));
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }

    /**
     * Toggle favorite status
     */
    public function toggleFavorite($id): JsonResponse
    {
        try {
            $query = Macro::query();
            if (auth()->check() && auth()->user()->company_id) {
                $query->where('company_id', auth()->user()->company_id);
            }
            $macro = $query->findOrFail($id);
            $userId = auth()->id();

            if (!$userId) {
                return $this->error([], __('User not authenticated'), 401);
            }

            if ($macro->isFavoriteByUser($userId)) {
                $macro->favoritedBy()->detach($userId);
            } else {
                $macro->favoritedBy()->attach($userId);
            }

            $macro->load(static::CONFIG['default_relations']);
            $macro->setAttribute('is_favorite', $macro->isFavoriteByUser($userId));

            return $this->success($macro, __('Favorite status updated successfully'));
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }

    /**
     * Increment usage count
     */
    public function incrementUsage($id): JsonResponse
    {
        try {
            $query = Macro::query();
            if (auth()->check() && auth()->user()->company_id) {
                $query->where('company_id', auth()->user()->company_id);
            }
            $macro = $query->findOrFail($id);
            $macro->usage_count = ($macro->usage_count ?? 0) + 1;
            $macro->last_used = now();
            $macro->save();

            $macro->load(static::CONFIG['default_relations']);

            return $this->success($macro, __('Usage count updated successfully'));
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }

    /**
     * Assign medical departments to a macro
     */
    public function assignDepartments(Request $request, $id): JsonResponse
    {
        try {
            $query = Macro::query();
            if (auth()->check() && auth()->user()->company_id) {
                $query->where('company_id', auth()->user()->company_id);
            }
            $macro = $query->findOrFail($id);
            $departmentIds = $request->input('medical_department_ids', []);

            $macro->medicalDepartments()->sync($departmentIds);

            $macro->load(static::CONFIG['default_relations']);

            return $this->success($macro, __('Departments assigned successfully'));
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }

    /**
     * Process data and files for the entity
     */
    protected function attach(array $data, ?Macro $entity = null, ?Request $request = null): Macro
    {
        $isUpdate = !is_null($entity) && $entity->exists;

        if (is_null($entity)) {
            $entity = new Macro();
        }

        // Validate company ownership on update
        if ($isUpdate && auth()->check() && auth()->user()->company_id) {
            if ($entity->company_id !== auth()->user()->company_id) {
                throw new \Exception(__('Macro not found'));
            }
        }

        // Fill basic data
        $entity->fill($data);

        // Add current user ID if not present and user is authenticated
        if (!$entity->user_id && auth()->check()) {
            $entity->user_id = auth()->id();
        }

        // Add company ID from user if not present
        if (!$entity->company_id && auth()->check() && auth()->user()->company_id) {
            $entity->company_id = auth()->user()->company_id;
        }

        // Save the model
        $entity->save();

        // Sync medical departments if provided
        if (isset($data['medical_department_ids'])) {
            $entity->medicalDepartments()->sync($data['medical_department_ids']);
        }

        // Load relationships for response
        $entity->load(static::CONFIG['default_relations']);

        // Add is_favorite dynamically for authenticated users
        $userId = auth()->id();
        $entity->setAttribute('is_favorite', $entity->isFavoriteByUser($userId));

        return $entity;
    }
}
