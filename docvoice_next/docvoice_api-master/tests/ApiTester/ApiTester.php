<?php

declare(strict_types=1);

namespace Tests\ApiTester;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;

class ApiTester
{
    private Client $httpClient;

    private string $baseUrl;

    private ?string $authToken = null;

    private ?int $testUserId = null;

    private string $basePath;

    private PayloadGenerator $payloadGenerator;

    private DatabaseIdResolver $idResolver;

    public function __construct(string $basePath, string $baseUrl = 'http://localhost:8001')
    {
        $this->basePath = $basePath;
        $this->baseUrl = rtrim($baseUrl, '/');
        $this->httpClient = new Client([
            'timeout' => 30,
            'verify' => false, // For local development
        ]);
        $this->payloadGenerator = new PayloadGenerator($basePath);
        $this->idResolver = new DatabaseIdResolver();
        
        // Link PayloadGenerator with DatabaseIdResolver
        $this->payloadGenerator->setIdResolver($this->idResolver);
    }

    public function setAuthToken(string $token): void
    {
        $this->authToken = $token;
    }

    public function setTestUserId(int $userId): void
    {
        $this->testUserId = $userId;
        $this->idResolver->setTestUserId($userId);
    }

    public function testEndpoint(array $endpoint): array
    {
        $startTime = microtime(true);
        $result = [
            'endpoint' => $endpoint['identifier'] ?? '',
            'method' => $endpoint['method'] ?? 'GET',
            'url' => $endpoint['full_uri'] ?? $endpoint['uri'] ?? '',
            'timestamp' => date('Y-m-d H:i:s'),
            'success' => false,
            'status_code' => null,
            'response_time_ms' => 0,
            'request' => [],
            'response' => [],
            'error' => null,
        ];

        try {
            // Ensure data exists before testing (for GET/UPDATE/DELETE)
            $this->ensureDataExists($endpoint);

            // Prepare URL (pass endpoint for ID resolution)
            $url = $this->prepareUrl($endpoint);

            // Prepare headers
            $headers = $this->prepareHeaders($endpoint);

            // Prepare payload
            $payload = $this->preparePayload($endpoint);

            $result['request'] = [
                'headers' => $headers,
                'payload' => $payload,
                'url' => $url,
            ];

            // Make request
            $response = $this->makeRequest(
                $endpoint['method'] ?? 'GET',
                $url,
                $headers,
                $payload
            );

            $endTime = microtime(true);
            $result['response_time_ms'] = round(($endTime - $startTime) * 1000, 2);
            $result['status_code'] = $response['status_code'];
            $result['response'] = $response;
            $result['success'] = $response['status_code'] >= 200 && $response['status_code'] < 300;

        } catch (\Exception $e) {
            $endTime = microtime(true);
            $result['response_time_ms'] = round(($endTime - $startTime) * 1000, 2);
            $result['error'] = $e->getMessage();
            $result['success'] = false;
        }

        return $result;
    }

    private function prepareUrl(array $endpoint): string
    {
        $uri = $endpoint['full_uri'] ?? $endpoint['uri'] ?? '';
        $originalUri = $uri;

        // If URI doesn't start with /api, add it
        if (! str_starts_with($uri, '/api') && ! str_starts_with($uri, 'api/')) {
            // Check if it's an auth route
            if (str_starts_with($uri, '/auth') || str_starts_with($uri, 'auth/')) {
                $uri = '/api'.(str_starts_with($uri, '/') ? '' : '/').$uri;
            } else {
                $uri = '/api'.(str_starts_with($uri, '/') ? '' : '/').$uri;
            }
        }

        // Replace route parameters with existing IDs from database
        $method = $endpoint['method'] ?? 'GET';
        
        // Get existing ID from database (use original URI for better matching)
        $existingId = $this->idResolver->getExistingId($originalUri, $method);
        
        // Replace all ID parameters with the existing ID
        $uri = preg_replace('/\{id\}/', (string) $existingId, $uri);
        $uri = preg_replace('/\{userId\}/', (string) ($this->testUserId ?? $existingId), $uri);
        $uri = preg_replace('/\{channelId\}/', (string) $existingId, $uri);
        $uri = preg_replace('/\{messageId\}/', (string) $existingId, $uri);
        $uri = preg_replace('/\{drawingId\}/', (string) $existingId, $uri);
        $uri = preg_replace('/\{ticketId\}/', (string) $existingId, $uri);
        $uri = preg_replace('/\{projectId\}/', (string) $existingId, $uri);
        $uri = preg_replace('/\{revisionId\}/', (string) $existingId, $uri);
        $uri = preg_replace('/\{floorId\}/', (string) $existingId, $uri);
        $uri = preg_replace('/\{layerId\}/', (string) $existingId, $uri);

        // Ensure URI starts with /
        if (! str_starts_with($uri, '/')) {
            $uri = '/'.$uri;
        }

        // Remove double slashes
        $uri = preg_replace('#/+#', '/', $uri);

        // Add test user ID if needed (for auth.by.iid middleware)
        if ($this->testUserId) {
            $separator = str_contains($uri, '?') ? '&' : '?';
            $uri .= $separator.'iid='.$this->testUserId;
        }

        return $this->baseUrl.$uri;
    }

    private function prepareHeaders(array $endpoint): array
    {
        $headers = [
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
        ];

        // Add authentication
        if ($this->authToken) {
            $headers['Authorization'] = 'Bearer '.$this->authToken;
        }

        // Add test user ID header if needed
        if ($this->testUserId) {
            $headers['X-User-IID'] = (string) $this->testUserId;
        }

        return $headers;
    }

    private function preparePayload(array $endpoint): array
    {
        return $this->discoverFormRequestAndGeneratePayload($endpoint);
    }

    /**
     * Discover FormRequest and generate payload professionally
     * This function combines FormRequest discovery, payload generation, and fallback logic
     */
    private function discoverFormRequestAndGeneratePayload(array $endpoint): array
    {
        $method = $endpoint['method'] ?? 'GET';
        
        // No payload needed for GET, DELETE, HEAD
        if (in_array($method, ['GET', 'DELETE', 'HEAD'])) {
            return [];
        }
        
        $controller = $endpoint['controller'] ?? null;
        $controllerMethod = $endpoint['controller_method'] ?? null;
        
        // Step 1: Discover FormRequest using Reflection directly on controller method
        $requestClass = $this->discoverFormRequestByReflection($controller, $controllerMethod);
        
        // Step 2: If not found, use existing findRequestClass method
        if (!$requestClass) {
            $requestClass = $this->payloadGenerator->findRequestClass($endpoint);
        }
        
        // Step 3: Generate payload from FormRequest
        $payload = $this->payloadGenerator->generatePayload($endpoint, $requestClass);
        
        // Step 4: If payload is empty, use fallback
        if (empty($payload) && in_array($method, ['POST', 'PUT', 'PATCH'])) {
            $payload = $this->generateFallbackPayload($endpoint);
        }
        
        return $payload;
    }

    /**
     * Discover FormRequest class using Reflection on controller method
     */
    private function discoverFormRequestByReflection(?string $controller, ?string $method): ?string
    {
        if (!$controller || !$method || !class_exists($controller)) {
            return null;
        }
        
        try {
            $reflection = new \ReflectionClass($controller);
            
            if (!$reflection->hasMethod($method)) {
                return null;
            }
            
            $methodReflection = $reflection->getMethod($method);
            $parameters = $methodReflection->getParameters();
            
            foreach ($parameters as $parameter) {
                $type = $parameter->getType();
                
                if ($type && !$type->isBuiltin()) {
                    $typeName = $type->getName();
                    
                    if (is_subclass_of($typeName, \Illuminate\Foundation\Http\FormRequest::class)) {
                        return $typeName;
                    }
                }
            }
        } catch (\Exception $e) {
            error_log('Reflection failed for '.$controller.'::'.$method.': '.$e->getMessage());
        }
        
        return null;
    }

    /**
     * Generate fallback payload when FormRequest discovery fails
     */
    private function generateFallbackPayload(array $endpoint): array
    {
        $payload = [];
        $uri = $endpoint['uri'] ?? $endpoint['full_uri'] ?? '';
        $method = $endpoint['method'] ?? 'POST';
        $controller = $endpoint['controller'] ?? '';
        
        // Generate payload based on URI patterns
        if (str_contains($uri, 'auth/login') || str_contains($uri, 'login')) {
            $payload = [
                'email' => 'test@example.com',
                'password' => 'password123',
            ];
        } elseif (str_contains($uri, 'auth/register') || str_contains($uri, 'register')) {
            $payload = [
                'name' => 'Test User',
                'email' => 'test'.time().'@example.com',
                'password' => 'password123',
                'password_confirmation' => 'password123',
            ];
        } elseif (str_contains($uri, 'change-password')) {
            $payload = [
                'current_password' => 'password123',
                'password' => 'newpassword123',
                'password_confirmation' => 'newpassword123',
            ];
        } elseif (str_contains($uri, 'channel')) {
            $payload = [
                'name' => 'Test Channel',
                'company_id' => $this->idResolver->getOrCreateForeignKey('companies', 'id'),
            ];
        } elseif (str_contains($uri, 'message')) {
            $payload = [
                'content' => 'Test message',
                'channel_id' => $this->idResolver->getOrCreateForeignKey('channels', 'id'),
            ];
        } elseif (str_contains($uri, 'user')) {
            $payload = [
                'name' => 'Test User',
                'email' => 'test'.time().'@example.com',
                'password' => 'password123',
            ];
        } elseif (str_contains($uri, 'company')) {
            $payload = [
                'name' => 'Test Company',
                'admin_email' => 'admin'.time().'@example.com',
                'admin_password' => 'password123',
                'admin_name' => 'Admin User',
            ];
        }
        
        // Use generateBasicPayload from PayloadGenerator as final fallback
        if (empty($payload)) {
            $payload = $this->payloadGenerator->generateBasicPayload($endpoint);
        }
        
        return $payload;
    }

    private function makeRequest(string $method, string $url, array $headers, array $payload): array
    {
        $options = [
            'headers' => $headers,
        ];

        if (! empty($payload) && in_array($method, ['POST', 'PUT', 'PATCH'])) {
            $options['json'] = $payload;
        }

        try {
            $response = $this->httpClient->request($method, $url, $options);

            $body = $response->getBody()->getContents();
            $decodedBody = json_decode($body, true);

            return [
                'status_code' => $response->getStatusCode(),
                'headers' => $response->getHeaders(),
                'body' => $decodedBody ?: $body,
                'raw_body' => $body,
            ];
        } catch (GuzzleException $e) {
            $statusCode = 0;
            $body = $e->getMessage();

            if (method_exists($e, 'hasResponse') && $e->hasResponse()) {
                $response = $e->getResponse();
                $statusCode = $response->getStatusCode();
                $body = $response->getBody()->getContents();
            }

            return [
                'status_code' => $statusCode,
                'headers' => [],
                'body' => ['error' => $body],
                'raw_body' => $body,
            ];
        }
    }

    public function authenticate(string $email = 'test@example.com', string $password = 'password'): bool
    {
        // Try login-by-id first (for testing)
        try {
            $response = $this->httpClient->post($this->baseUrl.'/api/auth/login-by-id', [
                'json' => [
                    'user_id' => 1,
                ],
                'headers' => [
                    'Accept' => 'application/json',
                ],
            ]);

            $body = json_decode($response->getBody()->getContents(), true);

            // Handle different response structures
            if (isset($body['token'])) {
                $this->authToken = $body['token'];

                return true;
            } elseif (isset($body['data']['token'])) {
                $this->authToken = $body['data']['token'];

                return true;
            }
        } catch (\Exception $e) {
            // Try regular login
            try {
                $response = $this->httpClient->post($this->baseUrl.'/api/auth/login', [
                    'json' => [
                        'email' => $email,
                        'password' => $password,
                    ],
                    'headers' => [
                        'Accept' => 'application/json',
                    ],
                ]);

                $body = json_decode($response->getBody()->getContents(), true);

                // Handle different response structures
                if (isset($body['token'])) {
                    $this->authToken = $body['token'];

                    return true;
                } elseif (isset($body['data']['token'])) {
                    $this->authToken = $body['data']['token'];

                    return true;
                }
            } catch (\Exception $e2) {
                error_log('Authentication failed: '.$e2->getMessage());
            }
        }

        return false;
    }

    /**
     * Ensure data exists before testing GET/UPDATE/DELETE endpoints
     */
    private function ensureDataExists(array $endpoint): void
    {
        $method = $endpoint['method'] ?? 'GET';
        
        // Only check for GET, PUT, PATCH, DELETE
        if (!in_array($method, ['GET', 'PUT', 'PATCH', 'DELETE'])) {
            return;
        }

        $uri = $endpoint['full_uri'] ?? $endpoint['uri'] ?? '';
        
        // Check if URI contains {id} parameter
        if (!preg_match('/\{id\}|\{userId\}|\{channelId\}|\{messageId\}|\{ticketId\}|\{projectId\}/', $uri)) {
            return;
        }

        // Get ID that will be used (this will create record if needed)
        // getExistingId already handles creation if record doesn't exist
        $this->idResolver->getExistingId($uri, $method);
    }
}
