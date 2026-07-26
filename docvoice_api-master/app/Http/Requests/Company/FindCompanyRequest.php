<?php

declare(strict_types=1);

namespace App\Http\Requests\Company;

use Illuminate\Foundation\Http\FormRequest;

class FindCompanyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'invitation_code' => ['required_without:company_name', 'string', 'max:50'],
            'company_name' => ['required_without:invitation_code', 'string', 'max:255'],
        ];
    }
}

