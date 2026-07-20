<?php

declare(strict_types=1);

namespace App\Http\Requests\User;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('user')?->id ?? $this->route('id');
        $companyId = $this->input('company_id') ?? $this->user()?->company_id;

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255', 'min:3'],
            'email' => ['sometimes', 'required', 'string', 'email', 'max:255', Rule::unique('users')->where('company_id', $companyId)->ignore($userId)],
            'password' => ['sometimes', 'string', 'min:8', 'max:255'],
            'role' => ['nullable', 'string', Rule::enum(UserRole::class)],
            'status' => ['nullable', 'string'],
            'profile_image_url' => ['nullable', 'string', 'max:500'],
        ];
    }
}

