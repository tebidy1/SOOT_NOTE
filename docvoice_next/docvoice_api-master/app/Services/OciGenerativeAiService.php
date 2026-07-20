<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class OciGenerativeAiService extends OciBaseService
{
    private array $fallbackModels = [
        'cohere.command-a-03-2025',
        'cohere.command-r-plus-08-2024',
        'meta.llama-3.3-70b-instruct',
        'meta.llama-3.1-70b-instruct',
        'cohere.command-r-16k',
    ];

    public function generate(string $prompt, ?string $model = null, float $temperature = 0.7, int $maxTokens = 2000): array
    {
        $models = array_filter(array_merge(
            $model ? [$model] : [],
            $this->config['generative_ai_model'] ? [$this->config['generative_ai_model']] : [],
            array_filter([env('OCI_GENERATIVE_AI_MODEL')]),
            $this->fallbackModels
        ));

        $models = array_unique($models);

        foreach ($models as $modelId) {
            try {
                Log::debug("Trying OCI model: {$modelId}");
                $result = $this->generateWithModel($prompt, $modelId, $temperature, $maxTokens);
                Log::debug("OCI model {$modelId} succeeded");
                return $result;
            } catch (\Exception $e) {
                $isModelNotFound = str_contains($e->getMessage(), '404') || str_contains($e->getMessage(), 'not found');
                Log::warning("OCI model {$modelId} failed", [
                    'error' => $e->getMessage(),
                    'is_model_not_found' => $isModelNotFound,
                ]);

                if (!$isModelNotFound) {
                    throw $e;
                }
            }
        }

        throw new \Exception('All OCI Generative AI models unavailable in this region. Tried: ' . implode(', ', $models));
    }

    private function generateWithModel(string $prompt, string $modelId, float $temperature, int $maxTokens): array
    {
        $region = $this->config['region'] ?? 'me-riyadh-1';
        $compartmentId = $this->config['compartment_id'];

        $url = "https://inference.generativeai.{$region}.oci.oraclecloud.com/20231130/actions/chat";

        $apiFormat = 'COHERE';
        $modelIdLower = strtolower($modelId);
        if (str_contains($modelIdLower, 'llama') || str_contains($modelIdLower, 'meta') || str_contains($modelIdLower, 'gemini') || str_contains($modelIdLower, 'grok')) {
            $apiFormat = 'GENERIC';
        }

        $chatRequest = [
            'apiFormat' => $apiFormat,
            'maxTokens' => $maxTokens,
            'temperature' => $temperature,
            'isStream' => false,
        ];

        if ($apiFormat === 'COHERE') {
            $chatRequest['message'] = $prompt;
        } else {
            $chatRequest['messages'] = [
                [
                    'role' => 'USER',
                    'content' => [
                        [
                            'type' => 'TEXT',
                            'text' => $prompt
                        ]
                    ]
                ]
            ];
        }

        $body = json_encode([
            'compartmentId' => $compartmentId,
            'servingMode' => [
                'servingType' => 'ON_DEMAND',
                'modelId' => $modelId,
            ],
            'chatRequest' => $chatRequest,
        ]);

        $response = $this->makeRequest('POST', $url, $body, [
            'content-type' => 'application/json',
        ]);

        $data = $response['json'];

        $generatedText = '';
        if ($apiFormat === 'COHERE') {
            $generatedText = $data['chatResponse']['text'] ?? '';
        } else {
            $choices = $data['chatResponse']['choices'] ?? [];
            if (!empty($choices)) {
                $generatedText = $choices[0]['message']['content'][0]['text'] ?? '';
            }
        }

        return [
            'text' => trim($generatedText),
            'model' => $modelId,
            'source' => 'oci',
            'raw' => $data,
        ];
    }
}
