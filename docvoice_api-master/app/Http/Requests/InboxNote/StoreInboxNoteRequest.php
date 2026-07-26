<?php

declare(strict_types=1);

namespace App\Http\Requests\InboxNote;

use App\Enums\InboxStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInboxNoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'uuid' => ['nullable', 'string', 'max:255', 'unique:inbox_notes,uuid'],
            'raw_text' => ['required', 'string'],
            'original_text' => ['nullable', 'string'],
            'formatted_text' => ['nullable', 'string'],
            'audio_path' => ['nullable', 'string', 'max:255'],
            'patient_name' => ['nullable', 'string', 'max:255'],
            'summary' => ['nullable', 'string', 'max:500'],
            'doctor_specialty' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', Rule::enum(InboxStatus::class)],
            'suggested_macro_id' => ['nullable', 'integer', 'exists:macros,id'],
            'applied_macro_id' => ['nullable', 'integer', 'exists:macros,id'],
            'generated_outputs' => ['nullable', 'array'],
            'generated_outputs.*.id' => ['nullable', 'integer', 'exists:inbox_note_outputs,id'],
            'generated_outputs.*.title' => ['nullable', 'string', 'max:255'],
            'generated_outputs.*.content' => ['nullable', 'string'],
            'generated_outputs.*.macro_id' => ['nullable', 'integer', 'exists:macros,id'],
        ];
    }
}
