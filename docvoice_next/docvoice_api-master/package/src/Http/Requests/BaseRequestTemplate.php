<?php

declare(strict_types=1);

namespace LaraCore\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BaseRequestTemplate extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [];

        // Get the model ID if updating
        $id = $this->route($this->getModelRouteParam());

        // Define common rules here
        // Example:
        // $rules['name'] = ['required', 'string', 'max:255'];
        // $rules['email'] = ['required', 'email', 'max:255', Rule::unique($this->getTableName())->ignore($id)];

        return $rules;
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            // Define custom messages here
            // 'name.required' => 'The name field is required.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            // Define custom attributes here
            // 'name' => 'name',
        ];
    }

    /**
     * Get the table name for unique validation rules.
     *
     * @return string
     */
    protected function getTableName(): string
    {
        // Override this method in child classes to return the correct table name
        return 'models';
    }

    /**
     * Get the model route parameter name.
     *
     * @return string
     */
    protected function getModelRouteParam(): string
    {
        // Override this method in child classes to return the correct route parameter
        return 'model';
    }
}
