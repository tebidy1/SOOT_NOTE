<?php

declare(strict_types=1);

namespace LaraCore\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FileUploadRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'max:10240'], // 10MB max size
            'directory' => ['sometimes', 'string'],
            'disk' => ['sometimes', 'string'],
            'old_path' => ['sometimes', 'string'], // For replace endpoint
        ];
    }

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // You might want to add proper authorization here
    }
}
