<?php

declare(strict_types=1);

namespace Tests\ApiTester;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;

class PayloadGenerator
{
    private string $basePath;

    private array $cache = [];

    private ?DatabaseIdResolver $idResolver = null;

    public function __construct(string $basePath)
    {
        $this->basePath = $basePath;
    }

    public function setIdResolver(DatabaseIdResolver $resolver): void
    {
        $this->idResolver = $resolver;
    }

    public function generatePayload(array $endpoint, ?string $requestClass = null): array
    {
        $payload = [];

        if ($requestClass && class_exists($requestClass)) {
            try {
                $request = new $requestClass;
                if ($request instanceof FormRequest) {
                    $rules = $request->rules();
                    $payload = $this->generateFromRules($rules, $endpoint);
                }
            } catch (\Exception $e) {
                // Fallback to basic generation
                error_log('Failed to generate from FormRequest: '.$e->getMessage());
            }
        }

        // If no payload generated, create minimal payload for POST/PUT/PATCH
        if (empty($payload) && in_array($endpoint['method'], ['POST', 'PUT', 'PATCH'])) {
            $payload = $this->generateBasicPayload($endpoint);
        }

        return $payload;
    }

    private function generateFromRules(array $rules, array $endpoint): array
    {
        $payload = [];
        $method = $endpoint['method'] ?? 'POST';

        foreach ($rules as $field => $ruleArray) {
            // Skip array validation rules like 'mentioned_user_ids.*'
            if (str_contains($field, '.*')) {
                continue;
            }

            $isRequired = $this->isRequired($ruleArray);
            $isNullable = $this->isNullable($ruleArray);
            $hasExists = $this->hasExistsRule($ruleArray);
            $hasUnique = $this->hasUniqueRule($ruleArray);
            $hasInRule = $this->hasInRule($ruleArray);
            $hasEnumRule = $this->hasEnumRule($ruleArray);
            $hasRequiredWithout = $this->hasRequiredWithout($ruleArray);

            // Always include required fields
            // For POST: include ALL required fields, required_without fields, and nullable fields with constraints
            // For PUT/PATCH: include all fields to ensure complete data, especially if 'sometimes' is used
            if ($method === 'POST') {
                // Include required fields always
                // Include required_without fields (at least one of them should be included)
                // Include nullable fields if they have exists/unique/in/enum constraints
                if ($isRequired || $hasRequiredWithout) {
                    // Always include required and required_without fields
                } elseif ($isNullable && ($hasExists || $hasUnique || $hasInRule || $hasEnumRule)) {
                    // Include nullable fields with constraints
                } else {
                    // Skip optional fields without constraints
                    continue;
                }
            } else {
                // For UPDATE (PUT/PATCH)
                // We should include fields even if they are 'sometimes' to ensure we test the update
                if ($isRequired || $hasRequiredWithout) {
                     // Include required fields
                } elseif ($isNullable && ($hasExists || $hasUnique || $hasInRule || $hasEnumRule)) {
                     // Include nullable fields with constraints
                } elseif (in_array('sometimes', $ruleArray)) {
                    // Include 'sometimes' fields to actually test the update
                } else {
                    // Skip completely optional fields
                    continue;
                }
            }

            $value = $this->generateValue($field, $ruleArray, $endpoint);

            if ($value !== null) {
                $payload[$field] = $value;
                
                // Handle 'confirmed' rule - add confirmation field
                if ($this->hasConfirmedRule($ruleArray)) {
                    $confirmationField = $field.'_confirmation';
                    $payload[$confirmationField] = $value;
                }
            }
        }

        return $payload;
    }

    /**
     * Check if rules contain confirmed rule
     */
    private function hasConfirmedRule(array $rules): bool
    {
        foreach ($rules as $rule) {
            if (is_string($rule) && $rule === 'confirmed') {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if rules contain exists rule
     */
    private function hasExistsRule(array $rules): bool
    {
        foreach ($rules as $rule) {
            if (is_string($rule) && str_starts_with($rule, 'exists:')) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if rules contain unique rule
     */
    private function hasUniqueRule(array $rules): bool
    {
        foreach ($rules as $rule) {
            if (is_string($rule) && str_starts_with($rule, 'unique:')) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if rules contain in rule (Rule::in or in:)
     */
    private function hasInRule(array $rules): bool
    {
        foreach ($rules as $rule) {
            if (is_object($rule) && $rule instanceof \Illuminate\Validation\Rules\In) {
                return true;
            }
            if (is_string($rule) && str_starts_with($rule, 'in:')) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if rules contain enum rule
     */
    private function hasEnumRule(array $rules): bool
    {
        foreach ($rules as $rule) {
            if (is_object($rule) && $rule instanceof \Illuminate\Validation\Rules\Enum) {
                return true;
            }
        }
        return false;
    }

    private function generateValue(string $field, array $rules, array $endpoint): mixed
    {
        // First, check for Enum rules and handle them
        foreach ($rules as $rule) {
            if (is_object($rule) && $rule instanceof \Illuminate\Validation\Rules\Enum) {
                $enumValue = $this->getEnumValueFromRule($rule);
                if ($enumValue !== null) {
                    return $enumValue;
                }
            }
            
            // Check for Rule::in() and handle it
            if (is_object($rule) && $rule instanceof \Illuminate\Validation\Rules\In) {
                $inValues = $this->extractEnumValues([$rule]);
                if (!empty($inValues)) {
                    return $inValues[0]; // Return first valid value
                }
            }
        }

        // Convert rules to string, handling objects
        $ruleStrings = [];
        foreach ($rules as $rule) {
            if (is_string($rule)) {
                $ruleStrings[] = $rule;
            } elseif (is_object($rule)) {
                // Skip Enum rules as we already handled them
                if ($rule instanceof \Illuminate\Validation\Rules\Enum) {
                    $ruleStrings[] = 'enum';
                } else {
                    // For other rule objects, try to convert to string
                    $ruleStrings[] = get_class($rule);
                }
            } else {
                $ruleStrings[] = (string) $rule;
            }
        }
        $ruleString = implode('|', $ruleStrings);

        // Email (including admin_email, user_email, etc.)
        if (str_contains($ruleString, 'email') || str_contains($field, 'email')) {
            // Check if unique
            foreach ($rules as $rule) {
                if (is_string($rule) && str_starts_with($rule, 'unique:')) {
                    return $this->generateUniqueValue($field, $rule, $rules);
                }
            }
            // Generate unique email by default for admin_email, user_email, etc.
            if (str_contains($field, 'admin') || str_contains($field, 'user')) {
                return $this->generateEmail($field, true);
            }
            return $this->generateEmail($field);
        }

        // Password (including admin_password, user_password, etc.)
        if (str_contains($field, 'password')) {
            $min = $this->extractMin($rules);
            $minLength = $min ?: 8;

            return 'TestPassword'.$minLength;
        }

        // Name (including admin_name, user_name, etc.)
        if (str_contains($field, 'name')) {
            $max = $this->extractMax($rules);
            // For admin_name, use more specific name
            if (str_contains($field, 'admin')) {
                return 'Admin User '.rand(1000, 9999);
            }

            return $this->generateName($max);
        }

        // Phone
        if (str_contains($field, 'phone')) {
            return $this->generatePhone();
        }

        // Check for exists:table,column rule (Foreign Keys)
        foreach ($rules as $rule) {
            if (is_string($rule) && str_starts_with($rule, 'exists:')) {
                return $this->resolveForeignKey($rule, $field);
            }
        }

        // Check for unique:table,column rule
        foreach ($rules as $rule) {
            if (is_string($rule) && str_starts_with($rule, 'unique:')) {
                return $this->generateUniqueValue($field, $rule, $rules);
            }
        }

        // Integer
        if (str_contains($ruleString, 'integer') || str_contains($ruleString, 'numeric')) {
            if (str_contains($field, 'id') || str_contains($field, '_id')) {
                return $this->getExistingId($field, $rules);
            }
            $min = $this->extractMin($rules);
            $max = $this->extractMax($rules);

            return $this->generateInteger($min, $max);
        }

        // Boolean
        if (str_contains($ruleString, 'boolean')) {
            return true;
        }

        // Date
        if (str_contains($ruleString, 'date')) {
            return date('Y-m-d');
        }

        // DateTime
        if (str_contains($ruleString, 'date_format')) {
            $format = $this->extractDateFormat($rules);

            return date($format ?: 'Y-m-d H:i:s');
        }

        // Array
        if (str_contains($ruleString, 'array')) {
            return [];
        }

        // Enum/In
        if (str_contains($ruleString, 'in:') || str_contains($ruleString, 'Rule::in')) {
            $values = $this->extractEnumValues($rules);
            if (! empty($values)) {
                return $values[0];
            }
        }

        // String with max length
        $max = $this->extractMax($rules);
        $min = $this->extractMin($rules);

        return $this->generateString($field, $min, $max);
    }

    private function isRequired(array $rules): bool
    {
        return in_array('required', $rules, true);
    }

    /**
     * Check if rules contain required_without rule
     */
    private function hasRequiredWithout(array $rules): bool
    {
        foreach ($rules as $rule) {
            if (is_string($rule) && str_starts_with($rule, 'required_without:')) {
                return true;
            }
        }
        return false;
    }

    private function isNullable(array $rules): bool
    {
        return in_array('nullable', $rules, true);
    }

    private function extractMin(array $rules): ?int
    {
        foreach ($rules as $rule) {
            if (is_string($rule) && str_starts_with($rule, 'min:')) {
                return (int) substr($rule, 4);
            }
        }

        return null;
    }

    private function extractMax(array $rules): ?int
    {
        foreach ($rules as $rule) {
            if (is_string($rule) && str_starts_with($rule, 'max:')) {
                return (int) substr($rule, 4);
            }
        }

        return null;
    }

    private function extractDateFormat(array $rules): ?string
    {
        foreach ($rules as $rule) {
            if (is_string($rule) && str_starts_with($rule, 'date_format:')) {
                return substr($rule, 12);
            }
        }

        return null;
    }

    private function extractEnumValues(array $rules): array
    {
        foreach ($rules as $rule) {
            // Handle Rule::in() object
            if (is_object($rule) && $rule instanceof \Illuminate\Validation\Rules\In) {
                try {
                    // Use reflection to get the values array
                    $reflection = new \ReflectionClass($rule);
                    $valuesProperty = $reflection->getProperty('values');
                    $valuesProperty->setAccessible(true);
                    $values = $valuesProperty->getValue($rule);
                    
                    if (is_array($values)) {
                        return array_values($values);
                    }
                } catch (\Exception $e) {
                    // If reflection fails, try to get values from toString
                    error_log('Failed to extract Rule::in values: '.$e->getMessage());
                }
            }
            
            // Handle string 'in:value1,value2' format
            if (is_string($rule) && str_starts_with($rule, 'in:')) {
                $values = substr($rule, 3);
                return explode(',', $values);
            }
        }

        return [];
    }

    private function getExistingId(string $field, array $rules): ?int
    {
        // Check for exists:table,id rule
        foreach ($rules as $rule) {
            if (is_string($rule) && str_starts_with($rule, 'exists:')) {
                return $this->resolveForeignKey($rule, $field);
            }
        }

        // Default to 1 if no exists rule found
        return 1;
    }

    /**
     * Resolve foreign key by getting or creating related record
     */
    private function resolveForeignKey(string $existsRule, string $field): ?int
    {
        if ($this->idResolver === null) {
            // Fallback to old method
            $parts = explode(',', substr($existsRule, 7));
            $table = $parts[0];
            $column = $parts[1] ?? 'id';

            try {
                $id = DB::table($table)->min($column);
                if ($id) {
                    return (int) $id;
                }
            } catch (\Exception $e) {
                // Table might not exist
            }
            return 1;
        }

        // Use DatabaseIdResolver to get or create foreign key
        $parts = explode(',', substr($existsRule, 7));
        $table = $parts[0];
        $column = $parts[1] ?? 'id';

        return $this->idResolver->getOrCreateForeignKey($table, $column);
    }

    /**
     * Generate unique value for unique:table,column rule
     */
    private function generateUniqueValue(string $field, string $uniqueRule, array $allRules): mixed
    {
        // Extract table and column from unique rule
        $parts = explode(',', substr($uniqueRule, 7));
        $table = $parts[0] ?? null;
        $column = $parts[1] ?? $field;

        if (!$table) {
            // If no table specified, just generate unique value
            return $this->generateUniqueValueForField($field, $allRules);
        }

        // Check field type and generate accordingly
        $ruleString = implode('|', array_filter($allRules, fn($r) => is_string($r)));

        // Email field
        if (str_contains($ruleString, 'email') || str_contains($field, 'email')) {
            return $this->generateUniqueEmail($table, $column);
        }

        // String field
        if (str_contains($ruleString, 'string')) {
            return $this->generateUniqueString($field, $table, $column, $allRules);
        }

        // Integer field
        if (str_contains($ruleString, 'integer') || str_contains($ruleString, 'numeric')) {
            return $this->generateUniqueInteger($table, $column);
        }

        // Default: generate unique string
        return $this->generateUniqueString($field, $table, $column, $allRules);
    }

    /**
     * Generate unique value for field without table constraint
     */
    private function generateUniqueValueForField(string $field, array $rules): mixed
    {
        $ruleString = implode('|', array_filter($rules, fn($r) => is_string($r)));

        if (str_contains($ruleString, 'email') || str_contains($field, 'email')) {
            return 'test'.time().rand(1000, 9999).'@example.com';
        }

        if (str_contains($ruleString, 'string')) {
            $max = $this->extractMax($rules);
            return 'unique_'.time().'_'.rand(1000, 9999).($max ? substr('', 0, $max - 20) : '');
        }

        return 'unique_'.time().'_'.rand(1000, 9999);
    }

    /**
     * Generate unique email
     */
    private function generateUniqueEmail(string $table, string $column): string
    {
        $maxAttempts = 10;
        for ($i = 0; $i < $maxAttempts; $i++) {
            $email = 'test'.time().rand(10000, 99999).'@example.com';
            
            try {
                $exists = DB::table($table)->where($column, $email)->exists();
                if (!$exists) {
                    return $email;
                }
            } catch (\Exception $e) {
                // If table doesn't exist or error, return the email anyway
                return $email;
            }
            
            usleep(1000); // Small delay to ensure different timestamp
        }

        // Fallback
        return 'test'.time().microtime(true).'@example.com';
    }

    /**
     * Generate unique string
     */
    private function generateUniqueString(string $field, string $table, string $column, array $rules): string
    {
        $max = $this->extractMax($rules) ?? 255;
        $min = $this->extractMin($rules) ?? 3;
        
        $maxAttempts = 10;
        for ($i = 0; $i < $maxAttempts; $i++) {
            $value = 'test_'.time().'_'.rand(1000, 9999);
            
            // Ensure it meets min/max requirements
            if (strlen($value) < $min) {
                $value = str_pad($value, $min, 'x');
            }
            if (strlen($value) > $max) {
                $value = substr($value, 0, $max);
            }
            
            try {
                $exists = DB::table($table)->where($column, $value)->exists();
                if (!$exists) {
                    return $value;
                }
            } catch (\Exception $e) {
                // If table doesn't exist or error, return the value anyway
                return $value;
            }
            
            usleep(1000); // Small delay
        }

        // Fallback
        return 'unique_'.time().microtime(true);
    }

    /**
     * Generate unique integer
     */
    private function generateUniqueInteger(string $table, string $column): int
    {
        $maxAttempts = 10;
        for ($i = 0; $i < $maxAttempts; $i++) {
            $value = (int) (time() % 1000000) + rand(1000, 9999);
            
            try {
                $exists = DB::table($table)->where($column, $value)->exists();
                if (!$exists) {
                    return $value;
                }
            } catch (\Exception $e) {
                // If table doesn't exist or error, return the value anyway
                return $value;
            }
        }

        // Fallback
        return (int) (time() % 1000000) + rand(10000, 99999);
    }

    private function generateEmail(string $field, bool $forceUnique = false): string
    {
        if ($forceUnique) {
            // Use generateUniqueEmail for admin_email, user_email, etc.
            return $this->generateUniqueEmail('users', 'email');
        }
        
        // Generate unique email with timestamp
        return 'test'.time().rand(1000, 9999).'@example.com';
    }

    private function generateName(?int $max = null): string
    {
        $name = 'Test User '.rand(1000, 9999);
        if ($max && strlen($name) > $max) {
            $name = substr($name, 0, $max);
        }

        return $name;
    }

    private function generatePhone(): string
    {
        return '+1234567890';
    }

    private function generateInteger(?int $min = null, ?int $max = null): int
    {
        $min = $min ?? 1;
        $max = $max ?? 100;

        return rand($min, $max);
    }

    private function generateString(string $field, ?int $min = null, ?int $max = null): string
    {
        $min = $min ?? 3;
        $max = $max ?? 50;
        $length = rand($min, $max);

        $words = ['test', 'sample', 'example', 'data', 'value'];
        $text = implode(' ', array_slice($words, 0, (int) ceil($length / 10)));

        if (strlen($text) < $min) {
            $text = str_pad($text, $min, 'x');
        }
        if (strlen($text) > $max) {
            $text = substr($text, 0, $max);
        }

        return $text;
    }

    public function generateBasicPayload(array $endpoint): array
    {
        $payload = [];
        $uri = $endpoint['uri'] ?? $endpoint['full_uri'] ?? '';
        $method = $endpoint['method'] ?? 'POST';

        // Extract common fields from URI
        if (str_contains($uri, 'channel')) {
            $payload['channel_id'] = 1;
            $payload['name'] = 'Test Channel ' . rand(1000, 9999);
        }
        if (str_contains($uri, 'message')) {
            $payload['content'] = 'Test message';
        }
        if (str_contains($uri, 'user')) {
            $payload['name'] = 'Test User';
            $payload['email'] = 'test'.time().'@example.com';
        }
        if (str_contains($uri, 'company')) {
            $payload['name'] = 'Test Company ' . rand(1000, 9999);
            if ($method === 'POST') {
                $payload['admin_email'] = 'admin'.time().'@example.com';
                $payload['admin_password'] = 'password123';
                $payload['admin_name'] = 'Admin User';
            }
        }

        return $payload;
    }

    public function findRequestClass(array $endpoint): ?string
    {
        $controller = $endpoint['controller'] ?? null;
        $method = $endpoint['controller_method'] ?? null;
        $httpMethod = $endpoint['method'] ?? 'GET';

        if (! $controller || ! $method) {
            return null;
        }

        // First, try to find FormRequest by reflection on controller method
        $requestClass = $this->findRequestClassByReflection($controller, $method);
        if ($requestClass) {
            return $requestClass;
        }

        // Try to find FormRequest class by naming conventions
        $possiblePaths = [
            $this->basePath.'/app/Http/Requests',
            $this->basePath.'/app/Http/Requests/'.$this->extractNamespace($controller),
            $this->basePath.'/app/Http/Requests/Auth', // For auth routes
        ];

        $modelName = $this->extractModelName($controller);
        $requestNames = [];

        // Prioritize based on HTTP method
        if (in_array($httpMethod, ['PUT', 'PATCH'])) {
            $requestNames[] = 'Update'.$modelName.'Request';
            $requestNames[] = 'Edit'.$modelName.'Request';
        } elseif ($httpMethod === 'POST') {
            $requestNames[] = 'Store'.$modelName.'Request';
            $requestNames[] = 'Create'.$modelName.'Request';
        }

        // Add generic names
        $requestNames[] = ucfirst($method).'Request'; // RegisterRequest, LoginRequest, etc.
        $requestNames[] = ucfirst($method).$modelName.'Request';

        foreach ($possiblePaths as $path) {
            foreach ($requestNames as $name) {
                $fullPath = $path.'/'.$name.'.php';
                if (file_exists($fullPath)) {
                    $namespace = $this->extractNamespaceFromFile($fullPath);

                    return $namespace.'\\'.$name;
                }
            }
        }

        return null;
    }

    /**
     * Find FormRequest class by reflection on controller method
     */
    private function findRequestClassByReflection(string $controller, string $method): ?string
    {
        try {
            if (!class_exists($controller)) {
                return null;
            }

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
            // If reflection fails, return null and try other methods
            error_log('Reflection failed for '.$controller.'::'.$method.': '.$e->getMessage());
        }

        return null;
    }

    private function extractNamespace(string $controller): string
    {
        $parts = explode('\\', $controller);
        $className = end($parts);

        return str_replace('Controller', '', $className);
    }

    private function extractModelName(string $controller): string
    {
        $parts = explode('\\', $controller);
        $className = end($parts);

        return str_replace('Controller', '', $className);
    }

    private function extractNamespaceFromFile(string $file): string
    {
        $content = file_get_contents($file);
        if (preg_match('/namespace\s+([^;]+);/', $content, $matches)) {
            return $matches[1];
        }

        return '';
    }

    /**
     * Get enum value from Enum rule object
     */
    private function getEnumValueFromRule($rule): mixed
    {
        try {
            // Use reflection to get the enum class
            $reflection = new \ReflectionClass($rule);
            
            // Try different property names
            $propertyNames = ['type', 'enumClass', 'enum'];
            $enumClass = null;
            
            foreach ($propertyNames as $propName) {
                try {
                    $property = $reflection->getProperty($propName);
                    $property->setAccessible(true);
                    $value = $property->getValue($rule);
                    if (is_string($value) && class_exists($value)) {
                        $enumClass = $value;
                        break;
                    }
                } catch (\ReflectionException $e) {
                    continue;
                }
            }
            
            if (!$enumClass) {
                return null;
            }
            
            // Get first enum case value
            if (enum_exists($enumClass)) {
                $reflectionEnum = new \ReflectionEnum($enumClass);
                $cases = $reflectionEnum->getCases();
                
                if (!empty($cases)) {
                    $firstCase = $cases[0]->getValue();
                    
                    // If it's a backed enum, return the value
                    if ($firstCase instanceof \BackedEnum) {
                        return $firstCase->value;
                    }
                    
                    // Otherwise return the name
                    return $firstCase->name;
                }
            }
        } catch (\Exception $e) {
            // Fall through to return null
        }
        
        return null;
    }
}
