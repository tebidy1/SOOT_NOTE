<?php

declare(strict_types=1);

namespace App\Http\Requests\Macro;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMacroRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'trigger' => ['sometimes', 'required', 'string', 'max:255'],
            'content' => ['sometimes', 'required', 'string'],
            'is_ai_macro' => ['nullable', 'boolean'],
            'ai_instruction' => ['nullable', 'string'],
            'is_favorite' => ['nullable', 'boolean'],
            'medical_department_ids' => ['nullable', 'array'],
            'medical_department_ids.*' => ['integer', 'exists:medical_departments,id'],
        ];
    }
}
