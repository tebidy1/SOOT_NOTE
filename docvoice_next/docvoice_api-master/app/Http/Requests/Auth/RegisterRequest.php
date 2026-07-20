<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'min:3'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8', 'max:255', 'confirmed'],
            'company_id' => ['nullable', 'integer', 'exists:companies,id'],
            'invitation_code' => ['nullable', 'string', 'exists:companies,code'],
            'role' => ['nullable', 'string', Rule::in(['member', 'company_manager'])],
        ];
    }
}

