<?php
namespace LaraCore\Traits;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

trait UploadTrait
{
    /**
     * Upload a file to the specified disk and directory.
     *
     * @param UploadedFile $file
     * @param string $directory
     * @param string $disk
     * @param string|null $filename
     * @return string
     */
    protected function uploadFile(UploadedFile $file, string $directory = 'uploads', string $filename = null, string $disk = 'public')
    {
        try {
            // Generate a unique filename if not provided
            $filename = $filename ?? Str::random(40) . '.' . $file->getClientOriginalExtension();

            // Store the file on the specified disk
            $path = $file->storeAs($directory, $filename, $disk);

            // Return the path to the file
            return $path;
        } catch (\Exception $e) {
            \Log::error('File upload error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Delete a file from the specified disk.
     *
     * @param string $path
     * @param string $disk
     * @return bool
     */
    protected function deleteFile(string $path, string $disk = 'public'): bool
    {
        try {
            if (empty($path)) {
                return false;
            }

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
     * Replace an existing file with a new one.
     *
     * @param UploadedFile $file
     * @param string $oldPath
     * @param string $directory
     * @param string $disk
     * @param string|null $filename
     * @return string
     */
    public function replaceFile(UploadedFile $file, string $oldPath = null, string $directory = 'images', string $disk = 'uploads', string $filename = null): string
    {
        // Delete the old file if it exists
        if ($oldPath) {
            $this->deleteFile($oldPath, $disk);
        }

        // Upload the new file
        return $this->uploadFile($file, $directory, $disk, $filename);
    }

    /**
     * Get the full URL for a file.
     *
     * @param string $path
     * @param string $disk
     * @return string|null
     */
    public function getFileUrl(string $path = null, string $disk = 'uploads'): ?string
    {
        if (empty($path)) {
            return null;
        }

        return Storage::disk($disk)->url($path);
    }
}
