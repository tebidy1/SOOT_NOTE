<?php

namespace LaraCore\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        $_id = $this->route('user');

        $rule = [
            'name' => ['required', 'string', 'max:255', 'min:3'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'role' => ['sometimes', 'string', 'max:100'],
            'avatar' => ['sometimes', 'nullable', 'image', 'max:2048'], // 2MB max
            'password' => ['required', 'string', 'min:8'],
        ];

        $up = [
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($_id)],
            'password' => ['sometimes', 'nullable', 'string', 'min:8'],
        ];

        if ($_id) {
            $rule = array_merge($rule, $up);
        }

        return $rule;
    }
}
