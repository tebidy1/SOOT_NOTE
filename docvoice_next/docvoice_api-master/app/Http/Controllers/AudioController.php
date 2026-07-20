<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
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
     * Get company settings for the authenticated user.
     */
    private function getCompanySettings(): array
    {
        $user = auth()->user();
        if (!$user || !$user->company) {
            return [];
        }
        return $user->company->settings ?? [];
    }

    /**
     * Transcribe audio file using Groq Whisper.
     */
    public function transcribe(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'file' => 'required|file|max:25600', // 25MB max
                'model' => 'nullable|string',
                'language' => 'nullable|string',
            ]);

            $companySettings = $this->getCompanySettings();
            $file = $request->file('file');
            $model = $request->input('model', $companySettings['groq_model_pref'] ?? 'whisper-large-v3');
            $language = $request->input('language', 'en');

            $apiKey = trim((string) ($companySettings['groq_api_key'] ?? ''));
            if ($apiKey === '') {
                return $this->error([], __('Groq API key is not configured in company settings'), 422);
            }

            $response = Http::withToken($apiKey)
                ->attach('file', file_get_contents($file->getRealPath()), $file->getClientOriginalName())
                ->post('https://api.groq.com/openai/v1/audio/transcriptions', [
                    'model' => $model,
                    'language' => $language,
                    'prompt' => \App\Constants\AIPromptConstants::GOLDEN_TRANSCRIPTION_PROMPT,
                    'response_format' => 'json',
                ]);

            if ($response->failed()) {
                return $this->error($response->json(), __('Transcription failed'), $response->status());
            }

            return $this->success($response->json(), __('Audio transcribed successfully'));
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }

    /**
     * Process transcript using Gemini.
     */
    public function process(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'transcript' => 'required|string',
                'macro_context' => 'nullable|string',
                'specialty' => 'nullable|string',
                'global_prompt' => 'nullable|string',
                'mode' => 'nullable|string|in:fast,smart',
            ]);

            $companySettings = $this->getCompanySettings();

            $transcript = $request->input('transcript');
            $macroContext = $request->input('macro_context');
            $specialty = $request->input('specialty') ?? ($companySettings['specialty'] ?? null);
            $globalPrompt = $request->input('global_prompt') ?? ($companySettings['global_ai_prompt'] ?? null);
            $mode = $request->input('mode', 'fast');

            // Construct prompt for Gemini (Simplified version of what was in scribe_brain)
            $prompt = $this->constructGeminiPrompt($transcript, $macroContext, $specialty, $globalPrompt, $mode);

            $apiKey = trim((string) ($companySettings['gemini_api_key'] ?? ''));
            if ($apiKey === '') {
                return $this->error([], __('Gemini API key is not configured in company settings'), 422);
            }
            $model = env('GEMINI_MODEL', 'gemini-2.5-flash');
            $response = Http::post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}", [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ],
                'generationConfig' => [
                    'responseMimeType' => $mode === 'smart' ? 'application/json' : 'text/plain',
                ]
            ]);

            if ($response->failed()) {
                return $this->error($response->json(), __('Processing failed'), $response->status());
            }

            $result = $response->json();
            $text = $result['candidates'][0]['content']['parts'][0]['text'] ?? '';

            if ($mode === 'smart') {
                return $this->success(json_decode($text, true), __('Transcript processed successfully'));
            }

            return $this->success(['text' => $text], __('Transcript processed successfully'));
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }

    private function constructGeminiPrompt($transcript, $macroContext, $specialty, $globalPrompt, $mode): string
    {
        $basePrompt = \App\Constants\AIPromptConstants::GLOBAL_MASTER_PROMPT;

        $template = $macroContext ?: "No specific template provided. Use standard medical note format.";
        if ($specialty) {
            $template .= "\n\nSpecialty context: {$specialty}";
        }
        if ($globalPrompt) {
            $template .= "\n\nGlobal preferences: {$globalPrompt}";
        }

        if ($mode === 'smart') {
            $template .= "\n\nCRITICAL OUTPUT REQUIREMENT: You must output ONLY a valid JSON object with 'final_note' (the generated note text) and 'missing_suggestions' (a list of objects with 'label' and 'text_to_insert' for any [Not Reported] fields). Do not return plain text.";
        }

        $basePrompt = str_replace('{{SELECTED_TEMPLATE_NAME}}', $template, $basePrompt);
        $basePrompt = str_replace('{{RAW_TEXT_FROM_WHISPER}}', $transcript, $basePrompt);

        return $basePrompt;
    }

    /**
     * Analyze transcript to extract patient name and summary.
     */
    public function analyze(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'transcript' => 'required|string',
            ]);

            $transcript = $request->input('transcript');

            $prompt = "Analyze the following medical transcript. Extract: 
            1. Patient Name (or 'Unknown Patient')
            2. Brief 1-line summary (max 60 chars)
            3. Suggested macro type (one of: 'follow-up', 'soap', 'referral', 'prescription', 'vital-signs', 'general')

            Output ONLY a JSON object:
            {
                \"patientName\": \"...\",
                \"summary\": \"...\",
                \"suggestedMacroType\": \"...\"
            }

            Transcript:
            {$transcript}";

            $companySettings = $this->getCompanySettings();
            $apiKey = trim((string) ($companySettings['gemini_api_key'] ?? ''));
            if ($apiKey === '') {
                return $this->error([], __('Gemini API key is not configured in company settings'), 422);
            }
            $model = env('GEMINI_MODEL', 'gemini-2.5-flash');
            $response = Http::post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}", [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ],
                'generationConfig' => [
                    'responseMimeType' => 'application/json',
                ]
            ]);

            if ($response->failed()) {
                return $this->error($response->json(), __('Analysis failed'), $response->status());
            }

            $result = $response->json();
            $text = $result['candidates'][0]['content']['parts'][0]['text'] ?? '{}';

            return $this->success(json_decode($text, true), __('Transcript analyzed successfully'));
        } catch (\Exception $e) {
            return $this->error([], $e->getMessage(), 500);
        }
    }

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
