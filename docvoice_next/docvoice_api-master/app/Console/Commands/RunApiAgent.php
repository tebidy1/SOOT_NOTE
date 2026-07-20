<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Company;
use ReflectionClass;
use ReflectionMethod;
use Illuminate\Foundation\Http\FormRequest;

class RunApiAgent extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'api-agent:run-new 
                            {--resume : Resume testing from last checkpoint}
                            {--url= : API base URL}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Run the Smart Laravel API Agent (Enhanced Version)';

    /**
     * Authentication token
     */
    protected ?string $token = null;

    /**
     * Results directory path
     */
    protected string $resultsPath;

    /**
     * List of successfully tested endpoints
     */
    protected array $doneList = [];

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->resultsPath = config('laravel_api_agent.save_path', storage_path('api-agent-results'));
        File::ensureDirectoryExists($this->resultsPath);

        $doneFile = $this->resultsPath.'/done.json';
        $this->doneList = File::exists($doneFile) 
            ? json_decode(File::get($doneFile), true) ?? [] 
            : [];

        $this->info('🚀 Starting Laravel Smart API Agent (Enhanced)...');
        $this->info("📁 Results path: {$this->resultsPath}");
        $this->info('');

        // Authenticate
        $this->authenticate();

        // Get all routes
        $routes = Route::getRoutes();
        $totalRoutes = 0;
        $testedCount = 0;
        $successCount = 0;
        $failCount = 0;

        $this->info("🔍 Found ".count($routes)." total routes");
        $this->info('');

        foreach ($routes as $route) {
            $uri = $route->uri();

            // Only process API routes
            if (!str_starts_with($uri, 'api') && !str_starts_with($uri, 'auth')) {
                continue;
            }

            $methods = $route->methods();
            $method = $methods[0] ?? 'GET';

            // Skip HEAD method
            if ($method === 'HEAD') {
                continue;
            }

            // Check if should exclude
            if ($this->shouldExclude($method, $uri)) {
                continue;
            }

            $fullUri = '/'.ltrim($uri, '/');
            $identifier = "{$method}|{$fullUri}";

            // Resume check
            if ($this->option('resume') && in_array($identifier, $this->doneList)) {
                $this->line("⏭️  Skipping (resume): {$identifier}");
                continue;
            }

            $totalRoutes++;
            $this->info("[{$totalRoutes}] Testing {$identifier}");

            // Prepare payload
            $data = $this->preparePayload($route);

            // Test route
            $result = $this->testRoute($method, $fullUri, $data, $identifier);

            if ($result['success']) {
                $successCount++;
                $this->info("   ✅ Success ({$result['status']})");
            } else {
                $failCount++;
                $this->error("   ❌ Failed ({$result['status']}): {$result['error']}");
            }

            $testedCount++;

            // Save to done list
            if ($result['success']) {
                $this->doneList[] = $identifier;
                File::put($doneFile, json_encode($this->doneList, JSON_PRETTY_PRINT));
            }

            // Save result
            $this->saveResult($identifier, $result);
        }

        $this->info('');
        $this->info('═══════════════════════════════════════');
        $this->info('📊 Test Summary');
        $this->info('═══════════════════════════════════════');
        $this->info("📝 Total Routes: {$totalRoutes}");
        $this->info("✅ Successful: {$successCount}");
        $this->info("❌ Failed: {$failCount}");
        $this->info("📁 Results saved in: {$this->resultsPath}");
        $this->info('═══════════════════════════════════════');

        return $failCount > 0 ? 1 : 0;
    }

    /**
     * Authenticate and get token
     */
    private function authenticate(): void
    {
        $cfg = config('laravel_api_agent.login');

        if (!$cfg['enabled']) {
            $this->warn('⚠️  Login disabled in config');
            return;
        }

        $this->info('🔐 Checking user existence...');

        // Check if user exists, create if not
        $this->ensureUserExists($cfg['email'], $cfg['password']);

        $this->info('🔐 Authenticating...');

        try {
            $baseUrl = $this->option('url') ?? config('laravel_api_agent.base_url', url('/'));
            $loginUrl = rtrim($baseUrl, '/').'/'.ltrim($cfg['url'], '/');

            $response = Http::timeout(config('laravel_api_agent.timeout', 30))
                ->post($loginUrl, [
                    'email' => $cfg['email'],
                    'password' => $cfg['password'],
                ]);

            if ($response->successful()) {
                $responseData = $response->json();
                $this->token = $responseData[$cfg['token_key']] ?? null;

                if ($this->token) {
                    $this->info("✅ Logged in successfully");
                } else {
                    $this->error("❌ Token not found in response");
                }
            } else {
                $this->error("❌ Login failed: {$response->status()}");
                $this->error("Response: ".$response->body());
            }
        } catch (\Exception $e) {
            $this->error("❌ Authentication error: ".$e->getMessage());
        }
    }

    /**
     * Ensure user exists, create if not
     */
    private function ensureUserExists(string $email, string $password): void
    {
        try {
            $user = User::where('email', $email)->first();

            if (!$user) {
                $this->warn("⚠️  User not found. Creating user: {$email}");

                // Get or create a default company
                $company = Company::first();
                if (!$company) {
                    $company = Company::create([
                        'name' => 'Test Company',
                        'plan_type' => 'basic',
                    ]);
                    $this->info("   ✅ Created default company: {$company->name}");
                }

                // Create user
                $user = User::create([
                    'name' => 'API Agent User',
                    'email' => $email,
                    'password' => Hash::make($password),
                    'company_id' => $company->id,
                    'role' => 'admin',
                ]);

                $this->info("   ✅ Created user: {$email}");
            } else {
                // Update password if it doesn't match
                if (!Hash::check($password, $user->password)) {
                    $this->warn("   ⚠️  Password mismatch. Updating password...");
                    $user->password = Hash::make($password);
                    $user->save();
                    $this->info("   ✅ Updated password for user: {$email}");
                } else {
                    $this->info("   ✅ User exists: {$email}");
                }
            }
        } catch (\Exception $e) {
            $this->error("   ❌ Error ensuring user exists: ".$e->getMessage());
            $this->warn("   ⚠️  Continuing without user creation...");
        }
    }

    /**
     * Check if route should be excluded
     */
    private function shouldExclude(string $method, string $uri): bool
    {
        $exclude = config('laravel_api_agent.exclude', []);

        if (isset($exclude[$method])) {
            foreach ($exclude[$method] as $excludedUri) {
                if (str_contains($uri, $excludedUri)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Prepare payload from FormRequest
     */
    private function preparePayload($route): array
    {
        $action = $route->getAction('controller');

        if (!$action || !str_contains($action, '@') && !str_contains($action, '::')) {
            return [];
        }

        // Handle both @ and :: syntax
        $separator = str_contains($action, '::') ? '::' : '@';
        [$class, $method] = explode($separator, $action);

        if (!class_exists($class)) {
            return [];
        }

        try {
            $rc = new ReflectionClass($class);
            $rm = $rc->getMethod($method);

            $params = $rm->getParameters();

            foreach ($params as $param) {
                $type = $param->getType();

                if (!$type || $type->isBuiltin()) {
                    continue;
                }

                $className = $type->getName();

                if (is_subclass_of($className, FormRequest::class)) {
                    $req = new $className;
                    $rules = $req->rules();
                    return $this->fakeData($rules);
                }
            }
        } catch (\Exception $e) {
            // Silent fail, return empty array
        }

        return [];
    }

    /**
     * Generate fake data from validation rules
     */
    private function fakeData(array $rules): array
    {
        $data = [];

        foreach ($rules as $field => $rule) {
            $ruleString = is_array($rule) ? implode('|', $rule) : $rule;

            // Skip if field is nullable and not required
            if (str_contains($ruleString, 'nullable') && !str_contains($ruleString, 'required')) {
                continue;
            }

            // String fields
            if (str_contains($ruleString, 'string')) {
                if (str_contains($ruleString, 'email')) {
                    $data[$field] = 'test'.rand(1000, 9999).'@example.com';
                } elseif (str_contains($ruleString, 'password')) {
                    $data[$field] = 'password123';
                } else {
                    $data[$field] = 'test '.ucfirst($field);
                }
            }
            // Integer fields
            elseif (str_contains($ruleString, 'integer') || str_contains($ruleString, 'numeric')) {
                $data[$field] = rand(1, 1000);
            }
            // Boolean fields
            elseif (str_contains($ruleString, 'boolean')) {
                $data[$field] = true;
            }
            // Array fields
            elseif (str_contains($ruleString, 'array')) {
                $data[$field] = [1, 2, 3];
            }
            // File fields
            elseif (str_contains($ruleString, 'file') || str_contains($ruleString, 'image')) {
                $data[$field] = \Illuminate\Http\UploadedFile::fake()->image('test.jpg');
            }
            // Date fields
            elseif (str_contains($ruleString, 'date')) {
                $data[$field] = now()->format('Y-m-d');
            }
            // Default: string
            else {
                $data[$field] = 'test value';
            }
        }

        return $data;
    }

    /**
     * Test a route
     */
    private function testRoute(string $method, string $uri, array $data, string $identifier): array
    {
        try {
            $baseUrl = $this->option('url') ?? config('laravel_api_agent.base_url', url('/'));
            $fullUrl = rtrim($baseUrl, '/').'/'.ltrim($uri, '/');

            $request = Http::timeout(config('laravel_api_agent.timeout', 30))
                ->withHeaders([
                    'Accept' => 'application/json',
                ]);

            // Add authentication
            if ($this->token) {
                $tokenType = config('laravel_api_agent.login.token_type', 'Bearer');
                $request->withToken($this->token, $tokenType);
            }

            // Send request
            $startTime = microtime(true);
            $response = match (strtoupper($method)) {
                'GET' => $request->get($fullUrl),
                'POST' => $request->post($fullUrl, $data),
                'PUT' => $request->put($fullUrl, $data),
                'PATCH' => $request->patch($fullUrl, $data),
                'DELETE' => $request->delete($fullUrl, $data),
                default => $request->get($fullUrl),
            };
            $responseTime = (microtime(true) - $startTime) * 1000;

            $status = $response->status();
            $success = $status >= 200 && $status < 300;

            return [
                'success' => $success,
                'status' => $status,
                'method' => $method,
                'url' => $fullUrl,
                'uri' => $uri,
                'data' => $data,
                'response' => $response->json(),
                'response_body' => $response->body(),
                'response_time_ms' => round($responseTime, 2),
                'error' => $success ? null : ($response->json()['message'] ?? $response->body()),
                'timestamp' => now()->toDateTimeString(),
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'status' => 0,
                'method' => $method,
                'url' => $fullUrl ?? $uri,
                'uri' => $uri,
                'data' => $data,
                'response' => null,
                'response_body' => null,
                'response_time_ms' => 0,
                'error' => $e->getMessage(),
                'timestamp' => now()->toDateTimeString(),
            ];
        }
    }

    /**
     * Save test result to file
     */
    private function saveResult(string $identifier, array $result): void
    {
        $filename = md5($identifier).'.json';
        $filepath = $this->resultsPath.'/'.$filename;

        File::put($filepath, json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    }
}

