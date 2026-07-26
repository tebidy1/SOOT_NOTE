<?php

namespace LaraCore\Helpers;

class FileHelper
{
    /**
     * Get file extension
     */
    public function getExtension(string $filename): string
    {
        return pathinfo($filename, PATHINFO_EXTENSION);
    }

    /**
     * Get file name without extension
     */
    public function getName(string $filename): string
    {
        return pathinfo($filename, PATHINFO_FILENAME);
    }

    /**
     * Format file size
     */
    public function formatSize(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, 2) . ' ' . $units[$i];
    }

    /**
     * Check if file is image
     */
    public function isImage(string $filename): bool
    {
        $imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
        $extension = strtolower($this->getExtension($filename));

        return in_array($extension, $imageExtensions);
    }

    /**
     * Generate unique filename
     */
    public function uniqueName(string $originalName): string
    {
        $extension = $this->getExtension($originalName);
        $name = $this->getName($originalName);

        return $name . '_' . uniqid() . '.' . $extension;
    }
}
