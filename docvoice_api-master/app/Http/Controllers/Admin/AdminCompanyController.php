<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\CompanyStatus;
use App\Http\Requests\Admin\StoreCompanyRequest;
use App\Http\Requests\Admin\UpdateCompanyRequest;
use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use LaraCore\Http\Controllers\BaseController;
use LaraCore\Traits\ControllerOperationsTrait;

class AdminCompanyController extends BaseController
{
    use ControllerOperationsTrait;

    public const CONFIG = [
        'search_fields' => ['name', 'domain', 'invitation_code', 'code'],
        'default_relations' => ['users'],
        'model_class' => Company::class,
        'request_class' => StoreCompanyRequest::class,
        'update_request_class' => UpdateCompanyRequest::class,
    ];

    /**
     * Display a listing of all companies (Admin only)
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $modelClass = static::CONFIG['model_class'];

            $query = $modelClass::query()
                ->with(static::CONFIG['default_relations']);

            // Apply status filter
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            // Apply search and filters
            $query = $this->applySearchAndFilters($query, $request, static::CONFIG['search_fields']);

            // Add users count
            $query->withCount('users');

            // Paginate
            $perPage = $request->get('per_page', 15);
            $companies = $query->paginate($perPage);

            return $this->paginatedResponse($companies, __('Companies retrieved successfully'));
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }

    /**
     * Store a newly created company with admin user
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // Validate using StoreCompanyRequest
            $storeRequest = app(StoreCompanyRequest::class);
            $storeRequest->merge($request->all());
            $storeRequest->setContainer(app());
            $storeRequest->setRedirector(app('redirect'));
            $storeRequest->validateResolved();
            $data = $storeRequest->validated();

            $company = Company::create([
                'name' => $data['name'],
                'domain' => $data['domain'] ?? null,
                'invitation_code' => $data['invitation_code'] ?? null,
                'plan_type' => $data['plan_type'] ?? 'basic',
                'status' => $data['status'] ?? 'active',
            ]);

            // Create admin user for the company
            if (isset($data['admin_email']) && isset($data['admin_password']) && isset($data['admin_name'])) {
                $admin = User::create([
                    'name' => $data['admin_name'],
                    'email' => $data['admin_email'],
                    'password' => Hash::make($data['admin_password']),
                    'company_id' => $company->id,
                    'role' => 'company_manager',
                ]);
            }

            $company->load(static::CONFIG['default_relations']);

            return $this->success($company, __('Company created successfully'), 201);
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }

    /**
     * Display the specified company with users
     */
    public function show($id): JsonResponse
    {
        try {
            $company = Company::with(static::CONFIG['default_relations'])->findOrFail($id);
            $company->loadCount('users');

            return $this->success($company, __('Company retrieved successfully'));
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 404);
        }
    }

    /**
     * Update the specified company
     */
    public function update(Request $request, $model): JsonResponse
    {
        try {
            // Validate using UpdateCompanyRequest
            $updateRequest = app(UpdateCompanyRequest::class);
            $updateRequest->merge($request->all());
            $updateRequest->setContainer(app());
            $updateRequest->setRedirector(app('redirect'));
            $updateRequest->validateResolved();
            $data = $updateRequest->validated();

            // Ensure $model is an instance of Company
            if (! $model instanceof Company) {
                $model = Company::findOrFail($model);
            }

            $company = $this->attach($data, $model, $request);

            return $this->success($company, __('Company updated successfully'));
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }

    /**
     * Remove the specified company
     */
    public function destroy($id): JsonResponse
    {
        try {
            $company = Company::findOrFail($id);

            // Check if company has users
            $usersCount = $company->users()->count();
            if ($usersCount > 0) {
                return $this->error(
                    [],
                    __('Cannot delete company with existing users. Please remove users first.'),
                    422
                );
            }

            $company->delete();

            return $this->success([], __('Company deleted successfully'));
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }

    /**
     * Toggle company status (active/suspended)
     */
    public function toggleStatus(Model $model): JsonResponse
    {
        try {
            // Ensure $model is an instance of Company
            $company = $model instanceof Company ? $model : Company::findOrFail($model->id);

            $newStatus = $company->status === CompanyStatus::Active
                ? CompanyStatus::Suspended
                : CompanyStatus::Active;

            $company->update(['status' => $newStatus]);
            $company->load(static::CONFIG['default_relations']);

            $message = $newStatus === CompanyStatus::Active
                ? __('Company activated successfully')
                : __('Company suspended successfully');

            return $this->success($company, $message);
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }

    /**
     * Get users for a specific company
     */
    public function users(Request $request, Company $company): JsonResponse
    {
        try {
            $perPage = $request->get('per_page', 15);
            $users = $company->users()
                ->with('company')
                ->paginate($perPage);

            return $this->paginatedResponse($users, __('Company users retrieved successfully'));
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }

    /**
     * Process data for the entity
     */
    protected function attach(array $data, ?Company $entity = null, ?Request $request = null): Company
    {
        if (is_null($entity)) {
            $entity = new Company;
        }

        $entity->fill($data);
        $entity->save();

        $entity->load(static::CONFIG['default_relations']);

        return $entity;
    }

    /**
     * Get company settings (Admin)
     */
    public function settings(Company $company): JsonResponse
    {
        try {
            return $this->success(
                ['settings' => $company->settings ?? []],
                __('Company settings retrieved successfully')
            );
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }

    /**
     * Update company settings (Admin)
     */
    public function updateSettings(Request $request, Company $company): JsonResponse
    {
        try {
            // Data sovereignty policy: no third-party AI provider keys are accepted.
            $request->validate([
                'specialty' => ['nullable', 'string'],
                'global_ai_prompt' => ['nullable', 'string'],
                'whatsapp_api_key' => ['nullable', 'string'],
                'whatsapp_phone_id' => ['nullable', 'string'],
                'whatsapp_business_id' => ['nullable', 'string'],
            ]);

            $currentSettings = $company->settings ?? [];

            $keys = [
                'specialty',
                'global_ai_prompt',
                'whatsapp_api_key',
                'whatsapp_phone_id',
                'whatsapp_business_id',
            ];

            foreach ($keys as $key) {
                if ($request->has($key) && $request->$key !== null && $request->$key !== '') {
                    $currentSettings[$key] = $request->$key;
                }
            }

            // Remove empty keys
            foreach ($currentSettings as $key => $value) {
                if (empty($value)) {
                    unset($currentSettings[$key]);
                }
            }

            $company->settings = $currentSettings;
            $company->save();

            return $this->success(
                $company->settings,
                __('Company settings updated successfully')
            );
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }
}
