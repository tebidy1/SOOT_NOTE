<?php

declare(strict_types=1);

namespace LaraCore\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MediaUploadRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'files' => ['required', 'array'],
            'files.*' => [
                'required',
                'file',
                'max:51200', // 50MB max
                'mimes:jpeg,png,jpg,gif,pdf,doc,docx,xls,xlsx,mp4,avi,mov'
            ],
            'folder_path' => ['nullable', 'string', 'max:255'],
            'model_type' => ['required_with:model_id', 'string', 'max:255'],
            'model_id' => ['required_with:model_type', 'integer'],
        ];
    }

    public function authorize(): bool
    {
        return true; // Add your authorization logic here
    }
}
