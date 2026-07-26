<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Exception;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

trait ControllerOperationsTrait
{
    use ResponseTrait;

    // abstract protected function attach(array $data, ?Model $entity = null, ?Request $request = null);

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        return $this->getIndexResponse(
            static::CONFIG['model_class'],
            $request,
            static::CONFIG['search_fields'],
            static::CONFIG['default_relations']
        );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        // The specific FormRequest will be resolved by Laravel's service container
        // based on the route or controller method binding if you type-hint it
        // in the controller method itself. Since we are in a trait, we get it from config.
        $requestClass = static::CONFIG['request_class'];

        try {
            $validatedData = [];

            if ($requestClass && class_exists($requestClass)) {
                $formRequest = app($requestClass);
                $formRequest->merge($request->all());
                $formRequest->setContainer(app());
                $formRequest->setRedirector(app('redirect'));
                $formRequest->validateResolved();
                $validatedData = $formRequest->validated();
            } else {
                // If no FormRequest class, use request data directly
                $validatedData = $request->all();
            }

            $entity = $this->attach($validatedData, null, $request);

            return $this->createdResponse($entity, __('Resource created successfully'));
        } catch (ValidationException $e) {
            return $this->validationErrorResponse($e->errors());
        } catch (Exception $e) {
            return $this->serverErrorResponse(__('Failed to create resource: ').$e->getMessage());
        }
    }

    /**
     * Display the specified resource.
     */
    public function show($id): JsonResponse
    {
        try {
            $modelClass = static::CONFIG['model_class'];

            $relations = array_merge(
                static::CONFIG['default_relations'],
                isset(static::CONFIG['show_relations']) ? static::CONFIG['show_relations'] : []
            );
            $model = $modelClass::with($relations)->findOrFail($id);

            return $this->success($model, __('Resource retrieved successfully'));
        } catch (Exception $e) {
            return $this->error([], $e->getMessage(), 404);
            // return $this->error([], $e->getMessage(), 404);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $model, $m): JsonResponse
    {
        $requestClass = static::CONFIG['request_class'];

        try {
            $validatedData = [];

            if ($requestClass && class_exists($requestClass)) {
                $formRequest = app($requestClass);
                $formRequest->merge($request->all());
                $formRequest->setContainer(app());
                $formRequest->setRedirector(app('redirect'));
                $formRequest->validateResolved();
                $validatedData = $formRequest->validated();
            } else {
                // If no FormRequest class, use request data directly
                $validatedData = $request->all();
            }

            // Ensure $model is an instance of Model
            if (! $model instanceof Model) {
                $modelClass = static::CONFIG['model_class'];
                $model = $modelClass::findOrFail($model);
            }

            $entity = $this->attach($validatedData, $model, $request);

            return $this->updatedResponse($entity, __('Resource updated successfully'));
        } catch (ValidationException $e) {
            return $this->validationErrorResponse($e->errors());
        } catch (Exception $e) {
            return $this->serverErrorResponse(__('Failed to update resource: ').$e->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id, $t): JsonResponse
    {
        try {
            $modelClass = static::CONFIG['model_class'];
            $model = $modelClass::findOrFail($id);

            $model->delete();

            return $this->deletedResponse(__('Resource deleted successfully'));
        } catch (Exception $e) {
            return $this->serverErrorResponse(__('Failed to delete resource: ').$e->getMessage());
        }
    }

    /**
     * Restore a soft deleted resource.
     * DISABLED: Soft delete is disabled in this project.
     */
    public function restore(int $id): JsonResponse
    {
        return $this->error([], __('Soft delete is disabled'), 405);
    }

    /**
     * Force delete a resource permanently.
     * DISABLED: Soft delete is disabled in this project.
     */
    public function forceDelete(int $id): JsonResponse
    {
        return $this->error([], __('Soft delete is disabled'), 405);
    }

    /**
     * Toggle the active status of a resource.
     */
    public function toggleStatus(Model $model): JsonResponse
    {
        return $this->toggleModelStatus($model);
    }

    /**
     * Get trashed (soft deleted) resources.
     * DISABLED: Soft delete is disabled in this project.
     */
    public function trashed(Request $request): JsonResponse
    {
        return $this->error([], __('Soft delete is disabled'), 405);
    }

    /**
     * Bulk delete multiple resources.
     */
    public function bulkDelete(Request $request): JsonResponse
    {
        return $this->bulkDeleteResources(static::CONFIG['model_class'], $request, $this->getTableName());
    }

    /**
     * Export data to CSV or Excel.
     */
    public function export(Request $request): JsonResponse
    {
        return $this->exportResources($request, $this->getTableName());
    }

    /**
     * Get model statistics.
     */
    public function statistics(): JsonResponse
    {
        return $this->getModelStatistics(static::CONFIG['model_class']);
    }

    protected function toggleModelStatus(Model $model, string $field = 'is_active'): JsonResponse
    {
        try {
            $model->update([$field => ! $model->{$field}]);

            $message = $model->{$field}
                ? __('Resource activated successfully')
                : __('Resource deactivated successfully');

            return $this->success($model, $message);

        } catch (Exception $e) {
            return $this->serverErrorResponse(
                __('Failed to toggle resource status: ').$e->getMessage()
            );
        }
    }

    /**
     * Get trashed (soft deleted) resources with pagination.
     * DISABLED: Soft delete is disabled in this project.
     */
    protected function getTrashedResources(string $modelClass, Request $request): JsonResponse
    {
        return $this->error([], __('Soft delete is disabled'), 405);
    }

    /**
     * Restore a soft deleted resource.
     * DISABLED: Soft delete is disabled in this project.
     */
    protected function restoreResource(string $modelClass, int $id): JsonResponse
    {
        return $this->error([], __('Soft delete is disabled'), 405);
    }

    /**
     * Force delete a resource permanently.
     * DISABLED: Soft delete is disabled in this project.
     */
    protected function forceDeleteResource(string $modelClass, int $id): JsonResponse
    {
        return $this->error([], __('Soft delete is disabled'), 405);
    }

    /**
     * Bulk delete multiple resources.
     */
    protected function bulkDeleteResources(string $modelClass, Request $request, string $tableName): JsonResponse
    {
        try {
            $request->validate([
                'ids' => 'required|array|min:1',
                'ids.*' => "integer|exists:{$tableName},id",
            ]);

            $deletedCount = $modelClass::whereIn('id', $request->ids)->delete();

            return $this->success(
                ['deleted_count' => $deletedCount],
                __('Resources deleted successfully')
            );

        } catch (Exception $e) {
            return $this->serverErrorResponse(
                __('Failed to delete resources: ').$e->getMessage()
            );
        }
    }

    /**
     * Get the table name for the model.
     */
    protected function getTableName(): string
    {
        $modelClass = static::CONFIG['model_class'];

        return (new $modelClass)->getTable();
    }

    /**
     * Get basic statistics for a model.
     */
    protected function getModelStatistics(string $modelClass, array $customStats = []): JsonResponse
    {
        try {
            $stats = [
                'total' => $modelClass::count(),
                'active' => $modelClass::where('is_active', true)->count(),
                'inactive' => $modelClass::where('is_active', false)->count(),
                'created_today' => $modelClass::whereDate('created_at', today())->count(),
                'created_this_week' => $modelClass::whereBetween('created_at', [
                    now()->startOfWeek(),
                    now()->endOfWeek(),
                ])->count(),
                'created_this_month' => $modelClass::whereMonth('created_at', now()->month)->count(),
            ];

            // دمج الإحصائيات المخصصة
            $stats = array_merge($stats, $customStats);

            return $this->success($stats, __('Statistics retrieved successfully'));

        } catch (Exception $e) {
            return $this->serverErrorResponse(
                __('Failed to retrieve statistics: ').$e->getMessage()
            );
        }
    }

    /**
     * Export resources to CSV or Excel.
     */
    protected function exportResources(Request $request, string $resourceName): JsonResponse
    {
        try {
            // يمكن تنفيذ منطق التصدير هنا
            // مثال: استخدام Laravel Excel أو CSV export

            return $this->success(
                ['export_url' => "exports/{$resourceName}.csv"],
                __('Export started successfully')
            );

        } catch (Exception $e) {
            return $this->serverErrorResponse(
                __('Failed to export resources: ').$e->getMessage()
            );
        }
    }

    /**
     * Apply search and filters to query.
     *
     * @param  mixed  $query
     * @return mixed
     */
    protected function applySearchAndFilters($query, Request $request, array $searchFields = ['name', 'description'])
    {
        // البحث العام
        if ($request->has('search') && ! empty($request->search)) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchFields, $searchTerm) {
                foreach ($searchFields as $field) {
                    $q->orWhere($field, 'like', "%{$searchTerm}%");
                }
            });
        }

        // فلترة حسب الحالة النشطة
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // فلترة حسب التاريخ
        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // ترتيب النتائج
        $sortBy = $request->get('sort_by', 'created_at');
        $sortDirection = $request->get('sort_direction', 'desc');
        $query->orderBy($sortBy, $sortDirection);

        return $query;
    }

    /**
     * Get paginated index response.
     */
    protected function getIndexResponse(
        string $modelClass,
        Request $request,
        array $searchFields = ['name', 'description'],
        array $relations = []
    ): JsonResponse {
        try {
            $perPage = $request->get('per_page', 15);
            $query = $modelClass::query();

            // تحميل العلاقات
            if (! empty($relations)) {
                $query->with($relations);
            }

            // تطبيق البحث والفلاتر
            $query = $this->applySearchAndFilters($query, $request, $searchFields);

            // الترقيم
            $resources = $query->paginate($perPage);

            return $this->paginatedResponse(
                $resources,
                __('Resources retrieved successfully')
            );

        } catch (Exception $e) {
            return $this->serverErrorResponse(
                __('Failed to retrieve resources: ').$e->getMessage()
            );
        }
    }

    /**
     * Get single resource with relations.
     */
    protected function getShowResponse(Model $model, array $relations = []): JsonResponse
    {
        try {
            // تحميل العلاقات إذا لزم الأمر
            if (! empty($relations)) {
                $model->load($relations);
            }

            return $this->success(
                $model,
                __('Resource retrieved successfully')
            );

        } catch (Exception $e) {
            return $this->serverErrorResponse(
                __('Failed to retrieve resource: ').$e->getMessage()
            );
        }
    }

    /**
     * Load all helper files from the module.
     */
    protected function loadHelpers(): void
    {
        $helperPath = module_path('Dash', 'Helpers');

        if (is_dir($helperPath)) {
            foreach (glob($helperPath.'/*.php') as $filename) {
                require_once $filename;
            }
        }
    }
}
