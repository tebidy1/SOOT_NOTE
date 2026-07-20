<?php

declare(strict_types=1);

namespace LaraCore\Traits;

use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Models\MediaManager;

trait HasMediaManager
{
    /**
     * Get all media for this model.
     */
    public function media(): MorphMany
    {
        return $this->morphMany(MediaManager::class, 'model');
    }

    /**
     * Add a single file to the model.
     */
    public function addMedia(UploadedFile $file, ?string $folder = null): MediaManager
    {
        $folder = $folder ?? $this->getDefaultMediaFolder();
        $fileName = $this->generateUniqueFileName($file);

        // Store the file
        $path = $file->storeAs($folder, $fileName, 'uploads');

        // Create media record
        return $this->media()->create([
            'file_name' => $fileName,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'folder_path' => $folder,
        ]);
    }

    /**
     * Add multiple files to the model.
     */
    public function addMultipleMedia(array $files, ?string $folder = null): Collection
    {
        return collect($files)->map(function (UploadedFile $file) use ($folder) {
            return $this->addMedia($file, $folder);
        });
    }

    /**
     * Get media of a specific type.
     */
    public function getMediaOfType(string $type): Collection
    {
        return $this->media()->ofType($type)->get();
    }

    /**
     * Get media in a specific folder.
     */
    public function getMediaInFolder(string $folder): Collection
    {
        return $this->media()->inFolder($folder)->get();
    }

    /**
     * Delete all media for this model.
     */
    public function deleteAllMedia(): void
    {
        $this->media->each->delete();
    }

    /**
     * Generate a unique filename for the uploaded file.
     */
    protected function generateUniqueFileName(UploadedFile $file): string
    {
        $extension = $file->getClientOriginalExtension();
        $baseFileName = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME));
        $uniqueId = Str::random(10);

        return "{$baseFileName}-{$uniqueId}.{$extension}";
    }

    /**
     * Get the default folder path for media files.
     */
    protected function getDefaultMediaFolder(): string
    {
        $modelName = Str::plural(Str::snake(class_basename($this)));
        return "media/{$modelName}/" . date('Y/m');
    }
}
// كل الملفات
// $product->media;

// // الصور فقط
// $product->getMedia('image');

// // المستندات فقط
// $product->getMedia('document');
// $product->addMultipleMedia($request->file('files'));
// $product->addMedia($request->file('file'));
