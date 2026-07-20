<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use LaraCore\Http\Controllers\BaseController;
use LaraCore\Traits\ControllerOperationsTrait;

class AdminUserController extends BaseController
{
    use ControllerOperationsTrait;

    public const CONFIG = [
        'search_fields' => ['name', 'email', 'phone'],
        'default_relations' => ['company', 'medicalDepartment'],
        'model_class' => User::class,
        'request_class' => StoreUserRequest::class,
        'update_request_class' => UpdateUserRequest::class,
    ];

    /**
     * Display a listing of all users (Admin only - across all companies)
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $modelClass = static::CONFIG['model_class'];

            $query = $modelClass::query()
                ->with(static::CONFIG['default_relations']);

            // Filter by company if provided
            if ($request->has('company_id')) {
                $query->where('company_id', $request->company_id);
            }

            // Filter by role if provided
            // if (auth()->user()->role === 'admin') {
            //     $query->where('role', 'company_manager');
            // } else if ($request->has('role')) {

            //     $query->where('role', $request->role);
            // }
            $query->where('role', 'company_manager');
            // Filter by status if provided
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            // Apply search and filters
            $query = $this->applySearchAndFilters($query, $request, static::CONFIG['search_fields']);

            // Paginate
            $perPage = $request->get('per_page', 15);
            $users = $query->paginate($perPage);

            return $this->paginatedResponse($users, __('Users retrieved successfully'));
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }

    /**
     * Store a newly created user in a specific company
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // Validate using StoreUserRequest
            $storeRequest = app(StoreUserRequest::class);
            $storeRequest->merge($request->all());
            $storeRequest->setContainer(app());
            $storeRequest->setRedirector(app('redirect'));
            $storeRequest->validateResolved();
            $data = $storeRequest->validated();

            $user = $this->attach($data, null, $request);

            return $this->success($user, __('User created successfully'), 201);
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }

    /**
     * Display the specified user
     */
    public function show($id): JsonResponse
    {
        try {
            $user = User::with(static::CONFIG['default_relations'])->findOrFail($id);

            return $this->success($user, __('User retrieved successfully'));
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 404);
        }
    }

    /**
     * Update the specified user
     */
    public function update(Request $request, $model): JsonResponse
    {
        try {
            // Validate using UpdateUserRequest
            $updateRequest = app(UpdateUserRequest::class);
            $updateRequest->merge($request->all());
            $updateRequest->setContainer(app());
            $updateRequest->setRedirector(app('redirect'));
            $updateRequest->validateResolved();
            $data = $updateRequest->validated();

            // Ensure $model is an instance of User
            if (!$model instanceof User) {
                $model = User::findOrFail($model);
            }

            $user = $this->attach($data, $model, $request);

            return $this->success($user, __('User updated successfully'));
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }

    /**
     * Remove the specified user
     */
    public function destroy($id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);

            // Prevent deleting the last admin user
            if ($user->role === 'admin' || $user->role === UserRole::Admin) {
                $adminCount = User::where('role', 'admin')->count();
                if ($adminCount <= 1) {
                    return $this->error(
                        [],
                        __('Cannot delete the last admin user'),
                        422
                    );
                }
            }

            $user->delete();

            return $this->success([], __('User deleted successfully'));
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }

    /**
     * Update user role
     */
    public function updateRole(Request $request, User $user): JsonResponse
    {
        try {
            $request->validate([
                'role' => ['required', 'string', Rule::enum(UserRole::class)],
            ]);

            $user->update(['role' => $request->role]);
            $user->load(static::CONFIG['default_relations']);

            return $this->success($user, __('User role updated successfully'));
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }

    /**
     * Reset user password
     */
    public function resetPassword(Request $request, User $user): JsonResponse
    {
        try {
            $request->validate([
                'password' => ['required', 'string', 'min:8', 'max:255'],
            ]);

            $user->update([
                'password' => Hash::make($request->password),
            ]);

            $user->load(static::CONFIG['default_relations']);

            return $this->success($user, __('Password reset successfully'));
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }

    /**
     * Toggle user status between active and inactive
     */
    public function toggleUserStatus(User $user): JsonResponse
    {
        try {
            $user->status = $user->status === UserStatus::Active
                ? UserStatus::Inactive
                : UserStatus::Active;
            $user->save();

            $user->load(static::CONFIG['default_relations']);

            return $this->success($user, __('User status updated successfully'));
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }

    /**
     * Process data and files for the entity
     */
    protected function attach(array $data, ?User $entity = null, ?Request $request = null): User
    {
        if (is_null($entity)) {
            $entity = new User;
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
