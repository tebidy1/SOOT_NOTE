<?php

declare(strict_types=1);

namespace App\Http\Requests\Macro;

use Illuminate\Foundation\Http\FormRequest;

class StoreMacroRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'trigger' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'is_ai_macro' => ['nullable', 'boolean'],
            'ai_instruction' => ['nullable', 'string'],
            'medical_department_ids' => ['nullable', 'array'],
            'medical_department_ids.*' => ['integer', 'exists:medical_departments,id'],
        ];
    }
}
