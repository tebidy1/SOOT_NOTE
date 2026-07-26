<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Services\OciObjectStorageService;
use App\Services\OciSpeechService;
use App\Models\TranscriptionJob;
use Illuminate\Support\Str;
use LaraCore\Http\Controllers\BaseController;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class AudioController extends BaseController
{
    /**
     * Unified Oracle OCI Transcription - Create Job
     */
    public function transcribeOracle(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'file' => 'required|file|max:25600', // 25MB max
                'language' => 'nullable|string',
                'model_type' => 'nullable|string',
            ]);

            $file = $request->file('file');
            $language = $request->input('language', 'en');
            $modelType = $request->input('model_type', 'WHISPER_LARGE_V3T');
            if ($modelType === 'WHISPER_LARGE_V3_TURBO') {
                $modelType = 'WHISPER_LARGE_V3T';
            }

            // 1. Store file locally temporarily
            $localPath = $file->store('temp_audio');
            $absolutePath = Storage::path($localPath);

            // 2. Upload to OCI Object Storage
            $originalName = $file->getClientOriginalName();
            $extension = pathinfo($originalName, PATHINFO_EXTENSION);
            $safeName = Str::uuid() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '_', pathinfo($originalName, PATHINFO_FILENAME)) . ($extension ? '.' . $extension : '');
            $objectName = $safeName;
            $storageService = app(OciObjectStorageService::class);
            $storageService->uploadFile($absolutePath, $objectName);

            // 3. Create OCI Batch Transcription Job
            $speechService = app(OciSpeechService::class);
            $displayName = 'Job_' . now()->format('Ymd_His');
            $ociJobResponse = $speechService->createTranscriptionJob($objectName, $displayName, $language, $modelType);

            // 4. Create local record
            $job = TranscriptionJob::create([
                'user_id' => auth()->id(),
                'oci_job_id' => $ociJobResponse['id'],
                'file_path' => $localPath,
                'oci_object_name' => $objectName,
                'status' => 'processing',
                'language' => $language,
                'model_type' => $modelType,
            ]);

            $responseData = [
                'success' => true,
                'job_id' => $job->oci_job_id,
                'message' => 'Transcription job created successfully',
            ];

            Log::info('Returning job info to frontend', $responseData);

            return response()->json($responseData);

        } catch (\Exception $e) {
            Log::error('Oracle Transcription Job Creation Failed', ['error' => $e->getMessage()]);
            return $this->error([], $e->getMessage(), 500);
        }
    }

    /**
     * Check Oracle OCI Transcription Status
     */
    public function transcriptionStatus(string $jobId): JsonResponse
    {
        Log::debug('Transcription Status Polling Request Received', ['job_id' => $jobId]);
        try {
            $job = TranscriptionJob::where('oci_job_id', $jobId)->firstOrFail();

            if ($job->status === 'processing') {
                $speechService = app(OciSpeechService::class);
                $ociJob = $speechService->getJobStatus($jobId);

                $ociStatus = $ociJob['lifecycleState'] ?? '';
                Log::debug("Checking OCI Job Status for $jobId: $ociStatus");

                if ($ociStatus === 'SUCCEEDED') {
                    Log::info("OCI Job $jobId SUCCEEDED. Fetching results...");
                    // Fetch result
                    $transcript = $speechService->getTranscriptionResult($jobId, $job->oci_object_name);

                    Log::info('Transcript Retrieved Successfully', [
                        'job_id' => $jobId,
                        'text' => $transcript
                    ]);

                    $job->update([
                        'status' => 'succeeded',
                        'transcript' => $transcript,
                    ]);
                } elseif ($ociStatus === 'FAILED') {
                    Log::error("OCI Job $jobId FAILED", ['oci_response' => $ociJob]);
                    $job->update(['status' => 'failed']);
                } else {
                    Log::debug("OCI Job $jobId is still in state: $ociStatus");
                }
            }

            Log::debug('Returning job status to frontend', [
                'job_id' => $jobId,
                'status' => $job->status,
                'transcript_length' => strlen($job->transcript ?? '')
            ]);

            return response()->json([
                'success' => true,
                'job_status' => $job->status,
                'transcript' => $job->transcript,
            ]);

        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }

    /**
     * Get Oracle OCI Realtime Session Token.
     */
    public function oracleToken(Request $request): JsonResponse
    {
        try {
            $config = config('services.oci');

            Log::info('Oracle Token Request Started', [
                'has_tenancy' => !empty($config['tenancy_id']),
                'has_user' => !empty($config['user_id']),
                'has_fingerprint' => !empty($config['fingerprint']),
                'has_compartment' => !empty($config['compartment_id']),
                'has_private_key' => !empty($config['private_key']),
                'region' => $config['region'] ?? 'not_set',
            ]);

            if (empty($config['tenancy_id']) || empty($config['user_id']) || empty($config['private_key'])) {
                Log::error('OCI Credentials Missing');
                return $this->error([], __('OCI credentials are not configured in backend .env'), 500);
            }

            $tenancyId = $config['tenancy_id'];
            $userId = $config['user_id'];
            $fingerprint = $config['fingerprint'];
            $compartmentId = $config['compartment_id'];
            $privateKey = str_replace("\\n", "\n", $config['private_key']);
            $region = $config['region'];

            // Debug: Check private key format
            Log::debug('OCI Private Key Info', [
                'key_starts_with' => substr($privateKey, 0, 30),
                'key_ends_with' => substr($privateKey, -30),
                'key_length' => strlen($privateKey),
                'has_begin_marker' => strpos($privateKey, '-----BEGIN PRIVATE KEY-----') !== false,
                'has_end_marker' => strpos($privateKey, '-----END PRIVATE KEY-----') !== false,
            ]);

            $host = "speech.aiservice.{$region}.oci.oraclecloud.com";
            $targetPath = "/20220101/actions/realtimeSessionToken";
            $url = "https://{$host}{$targetPath}";
            $method = "POST";
            $date = gmdate('D, d M Y H:i:s \G\M\T');

            $body = json_encode(['compartmentId' => $compartmentId]);
            $bodyHash = base64_encode(hash('sha256', $body, true));
            $contentLength = strlen($body);
            $contentType = 'application/json';

            // Build signing string - order and lowercase keys are important
            // Following order: date, (request-target), host, x-content-sha256, content-length, content-type
            $signingString = "date: " . $date . "\n" .
                "(request-target): " . strtolower($method) . " " . $targetPath . "\n" .
                "host: " . $host . "\n" .
                "x-content-sha256: " . $bodyHash . "\n" .
                "content-length: " . $contentLength . "\n" .
                "content-type: " . $contentType;

            // Sign with RSA-SHA256
            if (!openssl_sign($signingString, $signature, $privateKey, OPENSSL_ALGO_SHA256)) {
                $error = openssl_error_string();
                Log::error('OCI Signing Failed', ['error' => $error]);
                throw new \Exception("Failed to sign request: " . $error);
            }

            Log::debug('OCI Signing Successful', ['signature_length' => strlen($signature)]);

            $signatureEncoded = base64_encode($signature);
            $keyId = "{$tenancyId}/{$userId}/{$fingerprint}";

            Log::debug('OCI Signing Details', [
                'key_id' => $keyId,
                'signing_string_preview' => substr($signingString, 0, 100) . '...',
                'date' => $date,
            ]);

            $headersToSign = "date (request-target) host x-content-sha256 content-length content-type";

            $authHeader = "Signature version=\"1\",keyId=\"{$keyId}\",algorithm=\"rsa-sha256\",headers=\"{$headersToSign}\",signature=\"{$signatureEncoded}\"";

            // Send request to Oracle Speech service using cURL for full header control
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Authorization: ' . $authHeader,
                'date: ' . $date,
                'host: ' . $host,
                'x-content-sha256: ' . $bodyHash,
                'content-length: ' . $contentLength,
                'content-type: ' . $contentType,
            ]);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
            curl_setopt($ch, CURLOPT_HEADER, false);
            // This endpoint sits on the mic-start critical path — fail fast.
            curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
            curl_setopt($ch, CURLOPT_TIMEOUT, 15);

            $responseBody = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

            if (curl_errno($ch)) {
                $error = curl_error($ch);
                curl_close($ch);
                throw new \Exception('cURL Error: ' . $error);
            }
            curl_close($ch);

            // Create a mock response object for compatibility
            $response = new class ($httpCode, $responseBody) {
                private $status;
                private $body;

                public function __construct($status, $body)
                {
                    $this->status = $status;
                    $this->body = $body;
                }

                public function failed()
                {
                    return $this->status >= 400;
                }

                public function status()
                {
                    return $this->status;
                }

                public function body()
                {
                    return $this->body;
                }

                public function json()
                {
                    return json_decode($this->body, true);
                }
            };

            if ($response->failed()) {
                $responseBody = $response->body();
                $responseJson = $response->json();

                Log::error('Oracle Token Generation Failed', [
                    'status' => $response->status(),
                    'body' => $responseBody,
                    'url' => $url,
                    'signing_string' => $signingString,
                    'headers' => [
                        'date' => $date,
                        'x-content-sha256' => $bodyHash,
                        'auth_preview' => substr($authHeader, 0, 100) . '...'
                    ],
                    // Debug info for troubleshooting
                    'key_id' => $keyId,
                    'compartment_id' => $compartmentId,
                    'body_sent' => $body,
                    'region' => $region,
                ]);

                return $this->error(
                    is_array($responseJson) ? $responseJson : ['error' => $responseBody],
                    __('Failed to fetch Oracle token'),
                    $response->status()
                );
            }

            $responseData = $response->json();

            Log::info('Oracle Token Generated Successfully', [
                'token_preview' => isset($responseData['token']) ? substr($responseData['token'], 0, 50) . '...' : 'NO TOKEN',
                'token_length' => isset($responseData['token']) ? strlen($responseData['token']) : 0,
                'response_status' => $response->status(),
                'compartment_id' => $compartmentId,
                'region' => $region,
            ]);

            return response()->json([
                'status' => true,
                'token' => $responseData['token'] ?? null,
                'region' => $region,
                'compartmentId' => $compartmentId,
            ]);
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }
}
