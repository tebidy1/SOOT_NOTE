<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\CompanyStatus;
use App\Enums\PlanType;
use App\Models\Company;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCompanyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $companyId = $this->route('company');
        if ($companyId instanceof Company) {
            $companyId = $companyId->id;
        }
        $companyId = $companyId ?? $this->route('id');

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'domain' => ['nullable', 'string', 'max:255', Rule::unique('companies', 'domain')->ignore($companyId)],
            'invitation_code' => ['nullable', 'string', 'max:50', Rule::unique('companies', 'invitation_code')->ignore($companyId)],
            'plan_type' => ['nullable', 'string', Rule::enum(PlanType::class)],
            'status' => ['nullable', 'string', Rule::enum(CompanyStatus::class)],
        ];
    }
}

