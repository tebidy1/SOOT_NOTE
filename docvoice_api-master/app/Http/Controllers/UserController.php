<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\UserStatus;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Requests\User\UpdateUserRoleRequest;
use App\Models\User;
use Exception;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use LaraCore\Http\Controllers\BaseController;

class UserController extends BaseController
{
    public const CONFIG = [
        'search_fields' => ['name', 'email', 'phone'],
        'default_relations' => ['company'],
        'model_class' => User::class,
        'request_class' => StoreUserRequest::class,
    ];

    /**
     * Display a listing of users scoped to authenticated user's company.
     */
    public function index(Request $request): JsonResponse
    {
        $companyId = $request->user()->company_id;

        $perPage = $request->get('per_page', 15);
        $query = User::where('company_id', $companyId)
            ->with(static::CONFIG['default_relations']);

        // Filter by status
        if ($request->has('status') && !empty($request->status) && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by role
        if ($request->has('role') && !empty($request->role) && $request->role !== 'all') {
            $query->where('role', $request->role);
        }

        // Search
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                foreach (static::CONFIG['search_fields'] as $field) {
                    $q->orWhere($field, 'like', "%{$search}%");
                }
            });
        }

        // Sort
        $sortColumn = $request->get('sort_column', 'created_at');
        $sortDirection = $request->get('sort_direction', 'desc');
        $query->orderBy($sortColumn, $sortDirection);

        $users = $query->paginate($perPage);

        return $this->paginatedResponse($users, __('Company users retrieved successfully'));
    }

    /**
     * Store a new user scoped to authenticated user's company.
     */
    public function store(Request $request): JsonResponse
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
                $validatedData = $request->all();
            }

            $validatedData['company_id'] = $request->user()->company_id;

            $entity = $this->attach($validatedData, null, $request);

            return $this->createdResponse($entity, __('User created successfully'));
        } catch (ValidationException $e) {
            return $this->validationErrorResponse($e->errors());
        } catch (Exception $e) {
            return $this->serverErrorResponse(__('Failed to create user: ') . $e->getMessage());
        }
    }

    /**
     * Update user role
     */
    public function updateRole(UpdateUserRoleRequest $request, User $user): JsonResponse
    {
        try {
            $data = $request->validated();
            
            $user->update(['role' => $data['role']]);
            $user->load(static::CONFIG['default_relations']);
            
            return $this->success($user, __('User role updated successfully'));
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }

    /**
     * Update user - make password optional
     */
    public function update(Request $request, $model): JsonResponse
    {
        try {
            $formRequest = app(UpdateUserRequest::class);
            $formRequest->merge($request->all());
            $formRequest->setContainer(app());
            $formRequest->setRedirector(app('redirect'));
            $formRequest->validateResolved();
            $validatedData = $formRequest->validated();

            if (empty($validatedData['password'])) {
                unset($validatedData['password']);
            }

            if (! $model instanceof Model) {
                $modelClass = static::CONFIG['model_class'];
                $model = $modelClass::findOrFail($model);
            }

            $entity = $this->attach($validatedData, $model, $request);

            return $this->updatedResponse($entity, __('User updated successfully'));
        } catch (ValidationException $e) {
            return $this->validationErrorResponse($e->errors());
        } catch (Exception $e) {
            return $this->serverErrorResponse(__('Failed to update user: ') . $e->getMessage());
        }
    }

    /**
     * Toggle user active/inactive status
     */
    public function toggleUserStatus(Request $request, $id): JsonResponse
    {
        try {
            $companyId = $request->user()->company_id;
            $user = User::where('company_id', $companyId)->findOrFail($id);
            $user->status = $user->status === UserStatus::Active ? UserStatus::Inactive : UserStatus::Active;
            $user->save();
            $user->load(static::CONFIG['default_relations']);

            return $this->success($user, __('User status updated successfully'));
        } catch (Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }

    /**
     * Get online users
     */
    public function online(Request $request): JsonResponse
    {
        try {
            $companyId = $request->user()->company_id;
            
            $users = User::where('company_id', $companyId)
                ->where('is_online', true)
                ->with(static::CONFIG['default_relations'])
                ->get();
            
            return $this->success($users, __('Online users retrieved successfully'));
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }

    protected function attach(array $data, ?User $entity = null, ?Request $request = null): User
    {
        if (is_null($entity)) {
            $entity = new User();
        }

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $entity->fill($data);
        $entity->save();

        $entity->load(static::CONFIG['default_relations']);

        return $entity;
    }
}

