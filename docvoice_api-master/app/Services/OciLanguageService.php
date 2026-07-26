<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class OciLanguageService extends OciBaseService
{
    public function detectEntities(string $text, string $language = 'en'): array
    {
        $region = $this->config['region'];
        $compartmentId = $this->config['compartment_id'];

        $url = "https://language.aiservice.{$region}.oci.oraclecloud.com/20221001/actions/batchDetectLanguageEntities";

        $body = json_encode([
            'compartmentId' => $compartmentId,
            'documents' => [
                [
                    'key' => '1',
                    'text' => $text,
                    'languageCode' => $language,
                ]
            ],
        ]);

        $response = $this->makeRequest('POST', $url, $body, [
            'content-type' => 'application/json',
        ]);

        $data = $response['json'];
        Log::debug('OCI Language Entities Detected', ['response' => $data]);

        return $this->mapEntitiesToFields($data);
    }

    public function detectKeyPhrases(string $text, string $language = 'en'): array
    {
        $region = $this->config['region'];
        $compartmentId = $this->config['compartment_id'];

        $url = "https://language.aiservice.{$region}.oci.oraclecloud.com/20221001/actions/batchDetectLanguageKeyPhrases";

        $body = json_encode([
            'compartmentId' => $compartmentId,
            'documents' => [
                [
                    'key' => '1',
                    'text' => $text,
                    'languageCode' => $language,
                ]
            ],
        ]);

        $response = $this->makeRequest('POST', $url, $body, [
            'content-type' => 'application/json',
        ]);

        return $response['json'];
    }

    public function detectLanguageProperties(string $text): array
    {
        $region = $this->config['region'];
        $compartmentId = $this->config['compartment_id'];

        $url = "https://language.aiservice.{$region}.oci.oraclecloud.com/20221001/actions/batchDetectLanguageTextClassification";

        $body = json_encode([
            'compartmentId' => $compartmentId,
            'documents' => [
                [
                    'key' => '1',
                    'text' => $text,
                ]
            ],
        ]);

        $response = $this->makeRequest('POST', $url, $body, [
            'content-type' => 'application/json',
        ]);

        return $response['json'];
    }

    public function analyzeText(string $text, string $language = 'en'): array
    {
        try {
            $entities = $this->detectEntities($text, $language);
            return $entities;
        } catch (\Exception $e) {
            Log::warning('OCI Language Entity Detection failed, falling back to pattern extraction', [
                'error' => $e->getMessage(),
            ]);
            return [];
        }
    }

    private function mapEntitiesToFields(array $data): array
    {
        $result = [
            'name' => null,
            'age' => null,
            'height' => null,
            'gender' => null,
        ];

        $documents = $data['documents'] ?? [];
        if (empty($documents)) {
            return $result;
        }

        $entities = $documents[0]['entities'] ?? [];

        foreach ($entities as $entity) {
            $type = $entity['type'] ?? '';
            $text = $entity['text'] ?? '';

            switch (strtolower($type)) {
                case 'person':
                    if ($result['name'] === null) {
                        $result['name'] = $text;
                    }
                    break;
                case 'age':
                case 'quantity':
                    if (preg_match('/\d+/', $text, $matches)) {
                        $num = (int) $matches[0];
                        if ($num > 0 && $num < 150 && $result['age'] === null) {
                            $result['age'] = $num;
                        } elseif ($num >= 100 && $result['height'] === null) {
                            $result['height'] = $text;
                        }
                    }
                    break;
                default:
                    $lowerText = strtolower($text);
                    if ($result['gender'] === null && $this->detectGenderFromText($lowerText)) {
                        $result['gender'] = $this->detectGenderFromText($lowerText);
                    }
                    break;
            }
        }

        $result['raw_entities'] = $entities;

        return $result;
    }

    private function detectGenderFromText(string $text): ?string
    {
        $maleKeywords = ['male', 'mr.', 'mister', 'ذكر', 'سيد', 'م.', 'رجل'];
        $femaleKeywords = ['female', 'ms.', 'mrs.', 'miss', 'أنثى', 'سيدة', 'آنسة', 'امرأة'];

        foreach ($maleKeywords as $keyword) {
            if (str_contains($text, $keyword)) {
                return 'male';
            }
        }

        foreach ($femaleKeywords as $keyword) {
            if (str_contains($text, $keyword)) {
                return 'female';
            }
        }

        return null;
    }
}
