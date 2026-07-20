<?php

namespace LaraCore\Traits;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

trait FileHandlerTrait
{
    /**
     * Upload a file to storage.
     *
     * @param UploadedFile $file
     * @param string $directory
     * @param string|null $filename
     * @param string $disk
     * @return string|false
     */
    protected function uploadFile(UploadedFile $file, string $directory = 'uploads', string $filename = null, string $disk = 'public')
    {
        try {
            $filename = $filename ?? $this->generateUniqueFilename($file);
            $path = $file->storeAs($directory, $filename, $disk);

            return $path;
        } catch (\Exception $e) {
            \Log::error('File upload error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Upload multiple files to storage.
     *
     * @param array $files
     * @param string $directory
     * @param string $disk
     * @return array
     */
    protected function uploadMultipleFiles(array $files, string $directory = 'uploads', string $disk = 'public'): array
    {
        $uploadedFiles = [];

        foreach ($files as $file) {
            if ($file instanceof UploadedFile) {
                $path = $this->uploadFile($file, $directory, null, $disk);
                if ($path) {
                    $uploadedFiles[] = [
                        'original_name' => $file->getClientOriginalName(),
                        'path' => $path,
                        'mime_type' => $file->getMimeType(),
                        'size' => $file->getSize(),
                        'extension' => $file->getClientOriginalExtension(),
                    ];
                }
            }
        }

        return $uploadedFiles;
    }

    /**
     * Delete a file from storage.
     *
     * @param string $path
     * @param string $disk
     * @return bool
     */
    protected function deleteFile(string $path, string $disk = 'public'): bool
    {
        try {
            if (Storage::disk($disk)->exists($path)) {
                return Storage::disk($disk)->delete($path);
            }

            return false;
        } catch (\Exception $e) {
            \Log::error('File deletion error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Delete multiple files from storage.
     *
     * @param array $paths
     * @param string $disk
     * @return bool
     */
    protected function deleteMultipleFiles(array $paths, string $disk = 'public'): bool
    {
        try {
            foreach ($paths as $path) {
                $this->deleteFile($path, $disk);
            }

            return true;
        } catch (\Exception $e) {
            \Log::error('Multiple files deletion error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Generate a unique filename for a file.
     *
     * @param UploadedFile $file
     * @return string
     */
    protected function generateUniqueFilename(UploadedFile $file): string
    {
        $extension = $file->getClientOriginalExtension();
        $filename = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME));

        return $filename . '_' . time() . '_' . Str::random(10) . '.' . $extension;
    }

    /**
     * Get the full URL for a file.
     *
     * @param string $path
     * @param string $disk
     * @return string|null
     */
    protected function getFileUrl(string $path, string $disk = 'public'): ?string
    {
        try {
            if (Storage::disk($disk)->exists($path)) {
                return Storage::disk($disk)->url($path);
            }

            return null;
        } catch (\Exception $e) {
            \Log::error('Get file URL error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Check if a file exists.
     *
     * @param string $path
     * @param string $disk
     * @return bool
     */
    protected function fileExists(string $path, string $disk = 'public'): bool
    {
        return Storage::disk($disk)->exists($path);
    }

    /**
     * Get the file size in bytes.
     *
     * @param string $path
     * @param string $disk
     * @return int|null
     */
    protected function getFileSize(string $path, string $disk = 'public'): ?int
    {
        try {
            if (Storage::disk($disk)->exists($path)) {
                return Storage::disk($disk)->size($path);
            }

            return null;
        } catch (\Exception $e) {
            \Log::error('Get file size error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Get the file mime type.
     *
     * @param string $path
     * @param string $disk
     * @return string|null
     */
    protected function getFileMimeType(string $path, string $disk = 'public'): ?string
    {
        try {
            if (Storage::disk($disk)->exists($path)) {
                return Storage::disk($disk)->mimeType($path);
            }

            return null;
        } catch (\Exception $e) {
            \Log::error('Get file mime type error: ' . $e->getMessage());
            return null;
        }
    }
}
