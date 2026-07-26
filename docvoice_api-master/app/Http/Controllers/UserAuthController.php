<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Models\User;
use App\Models\Company;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class UserAuthController extends Controller
{
    /**
     * Register a new user
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();

            // Get or create company
            $companyId = $data['company_id'] ?? null;

            // إذا تم إدخال رمز الدعوة، ابحث عن الشركة
            if (isset($data['invitation_code']) && !empty($data['invitation_code'])) {
                $company = Company::where('code', $data['invitation_code'])->first();

                if (!$company) {
                    throw ValidationException::withMessages([
                        'invitation_code' => [__('Invalid invitation code.')],
                    ]);
                }

                $companyId = $company->id;
            }

            // إذا لم يتم تحديد company_id أو invitation_code، أنشئ شركة جديدة
            if (!$companyId) {
                $company = Company::create([
                    'name' => $data['name'] . ' Company',
                    'plan_type' => 'basic',
                ]);
                $companyId = $company->id;
            }

            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'company_id' => $companyId,
                'role' => $data['role'] ?? 'member',
            ]);

            $token = $user->createToken('user-token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => __('User registered successfully'),
                'user' => $user->load('company'),
                'token' => $token,
            ], 201);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Login user
     */
    public function login(LoginRequest $request): JsonResponse
    {
            Log::info('Login attempt:', $request->all());
        try {
            $data = $request->validated();
            Log::info('Login attempt:', $data);
            $user = User::where('email', $data['email'])->first();

            if (!$user || !Hash::check($data['password'], $user->password)) {
                throw ValidationException::withMessages([
                    'email' => [__('The provided credentials are incorrect.')],
                ]);
            }

            // Do NOT revoke all existing tokens to allow multi-platform login
            // $user->tokens()->delete();

            $deviceName = $request->input('device_name', 'web-platform');
            $token = $user->createToken($deviceName)->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => __('User logged in successfully'),
                'user' => $user->load('company'),
                'token' => $token,
            ], 200);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Login user by ID (for development/testing)
     */
    public function loginById(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'user_id' => ['required', 'integer', 'exists:users,id'],
            ]);

            $user = User::findOrFail($request->user_id);

            // Do NOT revoke all existing tokens
            // $user->tokens()->delete();

            $deviceName = $request->input('device_name', 'tester-device');
            $token = $user->createToken($deviceName)->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => __('User logged in successfully'),
                'user' => $user->load('company'),
                'token' => $token,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Logout user
     */
    public function logout(Request $request): JsonResponse
    {
        try {
            $request->user()->currentAccessToken()->delete();

            return response()->json([
                'success' => true,
                'message' => __('User logged out successfully'),
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Logout from all devices
     */
    public function logoutAll(Request $request): JsonResponse
    {
        try {
            $request->user()->tokens()->delete();

            return response()->json([
                'success' => true,
                'message' => __('User logged out from all devices successfully'),
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get current user profile
     */
    public function profile(Request $request): JsonResponse
    {
        try {
            $user = $request->user()->load('company');

            return response()->json([
                'success' => true,
                'user' => $user,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get current user (alias for profile)
     */
    public function user(Request $request): JsonResponse
    {
        return $this->profile($request);
    }

    /**
     * Update user profile
     */
    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        try {
            $user = $request->user();
            $data = $request->validated();

            $user->update($data);

            return response()->json([
                'success' => true,
                'message' => __('Profile updated successfully'),
                'user' => $user->load('company'),
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Change password
     */
    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();
            $user = $request->user();

            if (!Hash::check($data['current_password'], $user->password)) {
                throw ValidationException::withMessages([
                    'current_password' => [__('The current password is incorrect.')],
                ]);
            }

            $user->update([
                'password' => Hash::make($data['password']),
            ]);

            // Revoke all tokens except current
            $user->tokens()->where('id', '!=', $request->user()->currentAccessToken()->id)->delete();

            return response()->json([
                'success' => true,
                'message' => __('Password changed successfully'),
            ], 200);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
