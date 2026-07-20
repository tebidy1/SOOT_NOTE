<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $companyId = $this->input('company_id');

        return [
            'name' => ['required', 'string', 'max:255', 'min:3'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->where('company_id', $companyId)],
            'password' => ['required', 'string', 'min:8', 'max:255'],
            'company_id' => ['required', 'integer', 'exists:companies,id'],
            'role' => ['nullable', 'string', Rule::enum(UserRole::class)],
            'status' => ['nullable', 'string', Rule::enum(UserStatus::class)],
            'phone' => ['nullable', 'string', 'max:20'],
            'profile_image_url' => ['nullable', 'string', 'max:500'],
            'medical_department_id' => ['nullable', 'integer', 'exists:medical_departments,id'],
        ];
    }
}

