<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Company\FindCompanyRequest;
use App\Http\Requests\Company\StoreCompanyRequest;
use App\Models\Company;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use LaraCore\Http\Controllers\BaseController;
use LaraCore\Traits\ControllerOperationsTrait;

class CompanyController extends BaseController
{
    use ControllerOperationsTrait;

    public const CONFIG = [
        'search_fields' => ['name', 'domain', 'invitation_code'],
        'default_relations' => [],
        'model_class' => Company::class,
        'request_class' => StoreCompanyRequest::class,
    ];

    /**
     * Find company by invitation code or name
     */
    public function find(FindCompanyRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();

            $query = Company::query();

            if (isset($data['invitation_code'])) {
                $query->where('invitation_code', $data['invitation_code']);
            } elseif (isset($data['company_name'])) {
                $query->where('name', 'like', '%'.$data['company_name'].'%');
            }

            $company = $query->first();

            if (! $company) {
                return $this->error([], __('Company not found'), 404);
            }

            return $this->success($company, __('Company found successfully'));
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }

    /**
     * Verify invitation code and return company data
     */
    public function verifyCode(string $code): JsonResponse
    {
        try {
            $company = Company::where('code', $code)->first();

            if (! $company) {
                return $this->error([], __('Invalid invitation code'), 404);
            }

            return $this->success([
                'id' => $company->id,
                'name' => $company->name,
                'code' => $company->code,
            ], __('Company found successfully'));
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
            // Resolve StoreCompanyRequest for validation
            $storeRequest = app(StoreCompanyRequest::class);
            $storeRequest->merge($request->all());
            $data = $storeRequest->validated();

            $company = Company::create([
                'name' => $data['name'],
                'domain' => $data['domain'] ?? null,
                'invitation_code' => $data['invitation_code'] ?? null,
                'plan_type' => $data['plan_type'] ?? 'basic',
            ]);

            // Create admin user
            $admin = User::create([
                'name' => $data['admin_name'],
                'email' => $data['admin_email'],
                'password' => Hash::make($data['admin_password']),
                'company_id' => $company->id,
                'role' => 'company_manager',
            ]);

            $company->load('users');

            return $this->success($company, __('Company created successfully'), 201);
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }

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
}
