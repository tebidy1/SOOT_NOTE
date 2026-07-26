<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\CompanyStatus;
use App\Enums\PlanType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCompanyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'domain' => ['nullable', 'string', 'max:255', 'unique:companies,domain'],
            'invitation_code' => ['nullable', 'string', 'max:50', 'unique:companies,invitation_code'],
            'plan_type' => ['nullable', 'string', Rule::enum(PlanType::class)],
            'status' => ['nullable', 'string', Rule::enum(CompanyStatus::class)],
            'admin_email' => ['required', 'string', 'email', 'max:255'],
            'admin_password' => ['required', 'string', 'min:8'],
            'admin_name' => ['required', 'string', 'max:255'],
        ];
    }
}

