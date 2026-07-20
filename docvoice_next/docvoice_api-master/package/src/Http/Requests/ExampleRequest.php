<?php

declare(strict_types=1);

namespace LaraCore\Http\Requests;

class ExampleRequest extends BaseRequestTemplate
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $id = $this->route('example');

        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'in:active,inactive,pending'],
            'user_id' => ['required', 'exists:users,id'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'The name field is required.',
            'status.in' => 'The status must be active, inactive, or pending.',
        ];
    }

    /**
     * Get the table name for unique validation rules.
     *
     * @return string
     */
    protected function getTableName(): string
    {
        return 'examples';
    }

    /**
     * Get the model route parameter name.
     *
     * @return string
     */
    protected function getModelRouteParam(): string
    {
        return 'example';
    }
}
