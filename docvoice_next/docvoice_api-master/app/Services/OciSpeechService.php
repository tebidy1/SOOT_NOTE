<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class OciSpeechService extends OciBaseService
{
    /**
     * Create a batch transcription job.
     */
    public function createTranscriptionJob(string $objectName, string $displayName, string $language = 'en', string $modelType = 'WHISPER_LARGE_V3T'): array
    {
        $region = $this->config['region'];
        $compartmentId = $this->config['compartment_id'];
        $namespace = $this->config['namespace'];
        $inputBucket = $this->config['speech_bucket'];
        $outputBucket = $this->config['speech_output_bucket'];

        $url = "https://speech.aiservice.{$region}.oci.oraclecloud.com/20220101/transcriptionJobs";

        $body = json_encode([
            'compartmentId' => $compartmentId,
            'displayName' => $displayName,
            'description' => Str::slug('Transcription_job_for_' . $objectName, '_'),
            'modelDetails' => [
                'modelType' => $modelType,
                'domain' => 'GENERIC',
                'languageCode' => $language,
            ],
            'inputLocation' => [
                'locationType' => 'OBJECT_LIST_INLINE_INPUT_LOCATION',
                'objectLocations' => [
                    [
                        'namespaceName' => $namespace,
                        'bucketName' => $inputBucket,
                        'objectNames' => [$objectName],
                    ]
                ]
            ],
            'outputLocation' => [
                'namespaceName' => $namespace,
                'bucketName' => $outputBucket,
                'prefix' => 'results/',
            ]
        ]);

        $response = $this->makeRequest('POST', $url, $body, [
            'content-type' => 'application/json'
        ]);

        return $response['json'];
    }

    /**
     * Get the status of a transcription job.
     */
    public function getJobStatus(string $jobId): array
    {
        $region = $this->config['region'];
        $url = "https://speech.aiservice.{$region}.oci.oraclecloud.com/20220101/transcriptionJobs/{$jobId}";

        $response = $this->makeRequest('GET', $url);
        return $response['json'];
    }

    /**
     * Retrieve transcription results from Object Storage.
     * OCI Speech saves results as JSON files in the output bucket.
     */
    public function getTranscriptionResult(string $jobId, string $objectName): string
    {
        // OCI Speech usually names the output file like results/job-{uniqueId}/{namespace}_{bucket}_{objectName}.json
        // The uniqueId is the last part of the OCID.
        $jobParts = explode('.', $jobId);
        $uniqueId = end($jobParts);

        $namespace = $this->config['namespace'];
        $inputBucket = $this->config['speech_bucket'];

        $resultObjectName = "results/job-{$uniqueId}/{$namespace}_{$inputBucket}_{$objectName}.json";

        $storageService = app(OciObjectStorageService::class);

        Log::debug('Fetching OCI Transcription Result', ['path' => $resultObjectName]);
        $jsonContent = $storageService->downloadFile($resultObjectName);

        $data = json_decode($jsonContent, true);
        Log::debug('OCI JSON Result Parsed', [
            'has_audio_results' => isset($data['audio_results']),
            'results_count' => isset($data['audio_results']) ? count($data['audio_results']) : 0
        ]);

        // Combine all chunks if multiple
        $transcript = "";
        // Structure 1: Root level transcriptions (seen in some versions)
        if (isset($data['transcriptions'])) {
            foreach ($data['transcriptions'] as $transcription) {
                $transcript .= ($transcription['transcription'] ?? '') . " ";
            }
        }
        // Structure 2: audio_results wrapper
        elseif (isset($data['audio_results'])) {
            foreach ($data['audio_results'] as $audioResult) {
                if (isset($audioResult['transcriptions'])) {
                    foreach ($audioResult['transcriptions'] as $transcription) {
                        $transcript .= ($transcription['transcription'] ?? '') . " ";
                    }
                }
            }
        }

        return trim($transcript);
    }
}
