<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OciObjectStorageService extends OciBaseService
{
    /**
     * Upload a file to OCI Object Storage.
     */
    public function uploadFile(string $localPath, string $objectName, string $bucket = null): string
    {
        $bucket = $bucket ?? $this->config['speech_bucket'];
        $namespace = $this->config['namespace'];
        $region = $this->config['region'];
        
        $url = "https://objectstorage.{$region}.oraclecloud.com/n/{$namespace}/b/{$bucket}/o/" . rawurlencode($objectName);
        
        $body = file_get_contents($localPath);
        $response = $this->makeRequest('PUT', $url, $body, [
            'content-type' => mime_content_type($localPath) ?: 'application/octet-stream'
        ]);

        return $url;
    }

    /**
     * Download a file from OCI Object Storage.
     */
    public function downloadFile(string $objectName, string $bucket = null): string
    {
        $bucket = $bucket ?? $this->config['speech_output_bucket'];
        $namespace = $this->config['namespace'];
        $region = $this->config['region'];
        
        $url = "https://objectstorage.{$region}.oraclecloud.com/n/{$namespace}/b/{$bucket}/o/" . rawurlencode($objectName);
        
        $response = $this->makeRequest('GET', $url);
        return $response['body'];
    }

    /**
     * Get a pre-signed URL for an object (optional, for direct client access).
     */
    public function getPresignedUrl(string $objectName, int $expiryMinutes = 60, string $bucket = null): string
    {
        $bucket = $bucket ?? $this->config['speech_bucket'];
        $namespace = $this->config['namespace'];
        $region = $this->config['region'];
        
        $url = "https://objectstorage.{$region}.oraclecloud.com/n/{$namespace}/b/{$bucket}/p/";
        
        $expires = now()->addMinutes($expiryMinutes)->toIso8601String();
        $body = json_encode([
            'name' => 'PresignedRequest_' . time(),
            'accessType' => 'ObjectReadWrite',
            'objectName' => $objectName,
            'timeExpires' => $expires
        ]);

        $headers = $this->signRequest('POST', $url, $body, [
            'content-type' => 'application/json'
        ]);

        $response = Http::withHeaders($headers)->post($url, json_decode($body, true));

        if ($response->failed()) {
            throw new \Exception("OCI Pre-signed URL generation failed: " . $response->body());
        }

        $data = $response->json();
        return "https://objectstorage.{$region}.oraclecloud.com" . $data['accessUri'];
    }
}
