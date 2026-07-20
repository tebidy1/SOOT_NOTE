<?php

declare(strict_types=1);

namespace LaraCore\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use LaraCore\Rules\PhoneNumber;

class BaseRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $_id = $this->route('admin')?->id;

        $rule = [
            'name' => ['required', 'string', 'max:255', 'min:3'],
            'phone' => [new PhoneNumber, 'required', 'unique:admins'],
            'email' => ['required', 'email', 'unique:admins'],
            'password' => ['required', 'string', 'min:8', 'max:255', 'confirmed'],
        ];

        $up = [
            'phone' => [new PhoneNumber, 'required', Rule::unique('admins')->ignore($_id)],
            'email' => ['required', 'email', Rule::unique('admins')->ignore($_id)],
            'password' => ['nullable', 'string', 'min:8', 'max:255', 'confirmed'],
        ];

        if ($_id) {
            $rule = array_merge($rule, $up);
        }

        return $rule;
    }
}
