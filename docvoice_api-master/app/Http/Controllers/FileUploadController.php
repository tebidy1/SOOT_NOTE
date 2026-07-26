<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Attachment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use LaraCore\Http\Controllers\BaseController;

class FileUploadController extends BaseController
{
    public function upload(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'file' => 'required|file|max:51200',
                'message_id' => 'nullable|exists:messages,id',
            ]);

            $file = $request->file('file');
            $path = $file->store('attachments', 'public');
            $url = Storage::url($path);

            $attachment = Attachment::create([
                'company_id' => $request->user()->company_id,
                'filename' => $file->hashName(),
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'size' => (string) $file->getSize(),
                'url' => $url,
                'message_id' => $request->message_id,
                'created_by' => $request->user()->id,
            ]);

            return $this->success($attachment, __('File uploaded successfully'), 201);
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }
}

