<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class OciBaseService
{
    protected array $config;

    public function __construct()
    {
        $this->config = config('services.oci');
    }

    protected function signRequest(string $method, string $url, string $body = '', array $extraHeaders = []): array
    {
        $parsedUrl = parse_url($url);
        $host = $parsedUrl['host'];
        $path = $parsedUrl['path'] . (isset($parsedUrl['query']) ? '?' . $parsedUrl['query'] : '');
        $method = strtoupper($method);
        
        $date = gmdate('D, d M Y H:i:s \G\M\T');
        $privateKey = str_replace("\\n", "\n", $this->config['private_key']);
        
        // Base headers required for all requests
        $headers = [
            'date' => $date,
            '(request-target)' => strtolower($method) . " " . $path,
            'host' => $host,
        ];

        // Content headers for PUT/POST
        if ($body !== '' || in_array($method, ['PUT', 'POST'])) {
            $bodyHash = base64_encode(hash('sha256', $body, true));
            $headers['x-content-sha256'] = $bodyHash;
            $headers['content-length'] = (string)strlen($body);
            if (isset($extraHeaders['content-type'])) {
                $headers['content-type'] = $extraHeaders['content-type'];
            } elseif (isset($extraHeaders['Content-Type'])) {
                $headers['content-type'] = $extraHeaders['Content-Type'];
            }
        }

        // Add any other extra headers (must be lowercase in signature)
        foreach ($extraHeaders as $key => $value) {
            $lowKey = strtolower($key);
            if (!isset($headers[$lowKey])) {
                $headers[$lowKey] = $value;
            }
        }

        // Define the order of headers to sign (standard OCI order)
        $headersToSign = array_keys($headers);
        
        $signingString = "";
        foreach ($headersToSign as $key) {
            $signingString .= $key . ": " . $headers[$key] . "\n";
        }
        $signingString = rtrim($signingString, "\n");

        if (!openssl_sign($signingString, $signature, $privateKey, OPENSSL_ALGO_SHA256)) {
            $error = openssl_error_string();
            Log::error('OCI Signing Failed', ['error' => $error]);
            throw new \Exception("Failed to sign OCI request: " . $error);
        }

        $signatureEncoded = base64_encode($signature);
        $keyId = "{$this->config['tenancy_id']}/{$this->config['user_id']}/{$this->config['fingerprint']}";
        $headersString = implode(' ', $headersToSign);

        $authHeader = "Signature version=\"1\",keyId=\"{$keyId}\",algorithm=\"rsa-sha256\",headers=\"{$headersString}\",signature=\"{$signatureEncoded}\"";

        // Prepare final headers for the HTTP request (excluding pseudo-header (request-target))
        $finalHeaders = $headers;
        unset($finalHeaders['(request-target)']);
        $finalHeaders['Authorization'] = $authHeader;

        Log::debug('OCI Request Signed', [
            'method' => $method,
            'url' => $url,
            'headers_signed' => $headersString,
            'key_id' => $keyId
        ]);

        return $finalHeaders;
    }

    /**
     * Make a signed request to OCI using cURL for precise header control.
     */
    protected function makeRequest(string $method, string $url, string $body = '', array $extraHeaders = []): array
    {
        $signedHeaders = $this->signRequest($method, $url, $body, $extraHeaders);
        $method = strtoupper($method);

        $ch = \curl_init($url);
        \curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        \curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        
        if ($body !== '') {
            \curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
        }

        $curlHeaders = [];
        foreach ($signedHeaders as $key => $value) {
            $curlHeaders[] = "{$key}: {$value}";
        }

        \curl_setopt($ch, CURLOPT_HTTPHEADER, $curlHeaders);
        \curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        // Without timeouts, one slow OCI model hangs the whole request forever.
        \curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
        \curl_setopt($ch, CURLOPT_TIMEOUT, 60);

        // Capture response headers
        $responseHeaders = [];
        \curl_setopt($ch, CURLOPT_HEADERFUNCTION, function($curl, $header) use (&$responseHeaders) {
            $len = strlen($header);
            $header = explode(':', $header, 2);
            if (count($header) < 2) return $len;
            $responseHeaders[strtolower(trim($header[0]))] = trim($header[1]);
            return $len;
        });

        $responseBody = \curl_exec($ch);
        $httpCode = \curl_getinfo($ch, CURLINFO_HTTP_CODE);
        
        if (\curl_errno($ch)) {
            $error = \curl_error($ch);
            \curl_close($ch);
            throw new \Exception("cURL Error: " . $error);
        }
        \curl_close($ch);

        $json = json_decode($responseBody, true);
        
        if ($httpCode >= 400) {
            Log::error("OCI Request Failed", [
                'method' => $method,
                'url' => $url,
                'status' => $httpCode,
                'body' => $responseBody,
                'request_headers' => $curlHeaders
            ]);
            throw new \Exception("OCI Request Failed ({$httpCode}): " . $responseBody);
        }

        return [
            'status' => $httpCode,
            'body' => $responseBody,
            'json' => $json,
            'headers' => $responseHeaders
        ];
    }
}
