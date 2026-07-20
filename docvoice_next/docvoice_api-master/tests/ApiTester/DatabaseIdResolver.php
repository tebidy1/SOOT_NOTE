<?php

declare(strict_types=1);

namespace Tests\ApiTester;

use Illuminate\Support\Facades\DB;

class DatabaseIdResolver
{
    private array $cache = [];

    private ?int $testUserId = null;

    public function setTestUserId(?int $userId): void
    {
        $this->testUserId = $userId;
    }

    /**
     * Get existing ID from database based on resource type
     */
    public function getExistingId(string $uri, string $method): ?int
    {
        // Check cache first
        $cacheKey = $uri.'|'.$method;
        if (isset($this->cache[$cacheKey])) {
            $cachedId = $this->cache[$cacheKey];
            
            // Verify it still exists (important for DELETE tests)
            $tableName = $this->extractTableName($uri);
            if ($tableName && $this->checkRecordExists($tableName, $cachedId)) {
                return $cachedId;
            }
            
            // If not exists, remove from cache and continue
            unset($this->cache[$cacheKey]);
        }

        // Determine table name from URI
        $tableName = $this->extractTableName($uri);
        
        if (!$tableName) {
            // Default to 1 if can't determine table
            $this->cache[$cacheKey] = 1;
            return 1;
        }

        try {
            // Get existing ID from database
            $id = $this->getRandomIdFromTable($tableName);
            
            if ($id) {
                $this->cache[$cacheKey] = $id;
                return $id;
            }

            // If no existing record, create one for testing
            $id = $this->createTestRecord($tableName, $uri);
            
            if ($id) {
                $this->cache[$cacheKey] = $id;
                return $id;
            }

            // Fallback to 1
            $this->cache[$cacheKey] = 1;
            return 1;
        } catch (\Exception $e) {
            // Fallback to 1 on error
            error_log("Error resolving ID for {$uri}: ".$e->getMessage());
            $this->cache[$cacheKey] = 1;
            return 1;
        }
    }

    /**
     * Check if a record exists in the database
     */
    private function checkRecordExists(string $tableName, int $id): bool
    {
        try {
            if (!DB::getSchemaBuilder()->hasTable($tableName)) {
                return false;
            }

            return DB::table($tableName)->where('id', $id)->exists();
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Extract table name from URI
     */
    public function extractTableName(string $uri): ?string
    {
        // Common patterns
        $patterns = [
            '/users?\/\{id\}/i' => 'users',
            '/channels?\/\{id\}/i' => 'channels',
            '/messages?\/\{id\}/i' => 'messages',
            '/drawings?\/\{id\}/i' => 'drawings',
            '/tickets?\/\{id\}/i' => 'tickets',
            '/projects?\/\{id\}/i' => 'projects',
            '/companies?\/\{id\}/i' => 'companies',
            '/floors?\/\{id\}/i' => 'floors',
            '/layers?\/\{id\}/i' => 'layers',
            '/disciplines?\/\{id\}/i' => 'disciplines',
            '/revisions?\/\{id\}/i' => 'drawing_revisions',
            '/direct-messages?\/\{id\}/i' => 'direct_messages',
        ];

        foreach ($patterns as $pattern => $table) {
            if (preg_match($pattern, $uri)) {
                return $table;
            }
        }

        // Try to extract from URI path
        if (preg_match('/\/([a-z-]+)\/\{id\}/i', $uri, $matches)) {
            $resource = str_replace('-', '_', $matches[1]);
            // Convert to plural if needed
            if (!str_ends_with($resource, 's')) {
                $resource .= 's';
            }
            return $resource;
        }

        return null;
    }

    /**
     * Get random ID from table
     */
    private function getRandomIdFromTable(string $tableName): ?int
    {
        try {
            // Check if table exists
            if (!DB::getSchemaBuilder()->hasTable($tableName)) {
                return null;
            }

            // Get random ID
            $id = DB::table($tableName)
                ->select('id')
                ->orderByRaw('RAND()')
                ->limit(1)
                ->value('id');

            return $id ? (int) $id : null;
        } catch (\Exception $e) {
            error_log("Error getting ID from {$tableName}: ".$e->getMessage());
            return null;
        }
    }

    /**
     * Create test record if none exists
     */
    private function createTestRecord(string $tableName, string $uri): ?int
    {
        try {
            // Check if table exists
            if (!DB::getSchemaBuilder()->hasTable($tableName)) {
                return null;
            }

            // Get table structure
            $columns = DB::getSchemaBuilder()->getColumnListing($tableName);
            
            // Prepare minimal data
            $data = [];
            $now = now();

            // Common fields
            if (in_array('created_at', $columns)) {
                $data['created_at'] = $now;
            }
            if (in_array('updated_at', $columns)) {
                $data['updated_at'] = $now;
            }

            // Table-specific data
            switch ($tableName) {
                case 'users':
                    $data['name'] = 'Test User '.rand(1000, 9999);
                    $data['email'] = 'test'.time().rand(1000, 9999).'@example.com'; // Unique email
                    $data['password'] = bcrypt('password');
                    $data['role'] = 'member';
                    $data['status'] = 'active';
                    if (in_array('company_id', $columns)) {
                        $companyId = $this->getOrCreateForeignKey('companies');
                        if ($companyId) {
                            $data['company_id'] = $companyId;
                        }
                    }
                    break;

                case 'channels':
                    $data['name'] = 'Test Channel '.rand(1000, 9999);
                    $data['description'] = 'Test channel description';
                    $data['is_private'] = false;
                    if (in_array('company_id', $columns)) {
                        $companyId = $this->getOrCreateForeignKey('companies');
                        if ($companyId) {
                            $data['company_id'] = $companyId;
                        }
                    }
                    if (in_array('created_by', $columns)) {
                        if ($this->testUserId) {
                            $data['created_by'] = $this->testUserId;
                        } else {
                            $userId = $this->getOrCreateForeignKey('users');
                            if ($userId) {
                                $data['created_by'] = $userId;
                            }
                        }
                    }
                    break;

                case 'messages':
                    $data['content'] = 'Test message';
                    if (in_array('company_id', $columns)) {
                        $companyId = $this->getOrCreateForeignKey('companies');
                        if ($companyId) {
                            $data['company_id'] = $companyId;
                        }
                    }
                    if (in_array('channel_id', $columns)) {
                        $channelId = $this->getOrCreateForeignKey('channels');
                        if ($channelId) {
                            $data['channel_id'] = $channelId;
                        }
                    }
                    if (in_array('user_id', $columns)) {
                        if ($this->testUserId) {
                            $data['user_id'] = $this->testUserId;
                        } else {
                            $userId = $this->getOrCreateForeignKey('users');
                            if ($userId) {
                                $data['user_id'] = $userId;
                            }
                        }
                    }
                    break;

                case 'companies':
                    $data['name'] = 'Test Company '.rand(1000, 9999);
                    $data['plan_type'] = 'basic';
                    break;

                case 'projects':
                    $data['name'] = 'Test Project '.rand(1000, 9999);
                    if (in_array('company_id', $columns)) {
                        $companyId = $this->getOrCreateForeignKey('companies');
                        if ($companyId) {
                            $data['company_id'] = $companyId;
                        }
                    }
                    if (in_array('created_by', $columns)) {
                        if ($this->testUserId) {
                            $data['created_by'] = $this->testUserId;
                        } else {
                            $userId = $this->getOrCreateForeignKey('users');
                            if ($userId) {
                                $data['created_by'] = $userId;
                            }
                        }
                    }
                    break;

                case 'tickets':
                    $data['title'] = 'Test Ticket '.rand(1000, 9999);
                    $data['description'] = 'Test description';
                    $data['status'] = 'open';
                    $data['priority'] = 'medium';
                    $data['type'] = 'bug';
                    if (in_array('company_id', $columns)) {
                        $companyId = $this->getOrCreateForeignKey('companies');
                        if ($companyId) {
                            $data['company_id'] = $companyId;
                        }
                    }
                    if (in_array('created_by', $columns)) {
                        if ($this->testUserId) {
                            $data['created_by'] = $this->testUserId;
                        } else {
                            $userId = $this->getOrCreateForeignKey('users');
                            if ($userId) {
                                $data['created_by'] = $userId;
                            }
                        }
                    }
                    if (in_array('assigned_to', $columns)) {
                        $userId = $this->getOrCreateForeignKey('users');
                        if ($userId) {
                            $data['assigned_to'] = $userId;
                        }
                    }
                    if (in_array('channel_id', $columns)) {
                        $channelId = $this->getOrCreateForeignKey('channels');
                        if ($channelId) {
                            $data['channel_id'] = $channelId;
                        }
                    }
                    break;

                case 'drawings':
                    $data['name'] = 'Test Drawing '.rand(1000, 9999);
                    $data['description'] = 'Test drawing description';
                    $data['data'] = json_encode(['test' => 'data']);
                    if (in_array('company_id', $columns)) {
                        $companyId = $this->getOrCreateForeignKey('companies');
                        if ($companyId) {
                            $data['company_id'] = $companyId;
                        }
                    }
                    if (in_array('created_by', $columns)) {
                        if ($this->testUserId) {
                            $data['created_by'] = $this->testUserId;
                        } else {
                            $userId = $this->getOrCreateForeignKey('users');
                            if ($userId) {
                                $data['created_by'] = $userId;
                            }
                        }
                    }
                    break;

                case 'floors':
                    $data['name'] = 'Test Floor '.rand(1000, 9999);
                    $data['level'] = 'L'.rand(1, 10);
                    $data['description'] = 'Test floor description';
                    if (in_array('company_id', $columns)) {
                        $companyId = $this->getOrCreateForeignKey('companies');
                        if ($companyId) {
                            $data['company_id'] = $companyId;
                        }
                    }
                    break;

                case 'disciplines':
                    $data['name'] = 'Test Discipline '.rand(1000, 9999);
                    $data['description'] = 'Test discipline description';
                    $data['code'] = 'DISC'.rand(100, 999);
                    if (in_array('company_id', $columns)) {
                        $companyId = $this->getOrCreateForeignKey('companies');
                        if ($companyId) {
                            $data['company_id'] = $companyId;
                        }
                    }
                    break;

                default:
                    // Generic minimal data
                    if (in_array('name', $columns)) {
                        $data['name'] = 'Test '.ucfirst(str_replace('_', ' ', $tableName)).' '.rand(1000, 9999);
                    }
                    if (in_array('title', $columns)) {
                        $data['title'] = 'Test Title '.rand(1000, 9999);
                    }
                    break;
            }

            // Insert and get ID
            $id = DB::table($tableName)->insertGetId($data);
            
            return $id ? (int) $id : null;
        } catch (\Exception $e) {
            error_log("Error creating test record in {$tableName}: ".$e->getMessage());
            return null;
        }
    }

    /**
     * Ensure record exists, create if not
     */
    public function ensureRecordExists(string $tableName, int $id): bool
    {
        try {
            if (!DB::getSchemaBuilder()->hasTable($tableName)) {
                return false;
            }

            $exists = DB::table($tableName)->where('id', $id)->exists();
            
            if (!$exists) {
                // Try to create the record
                $createdId = $this->createTestRecord($tableName, "/{$tableName}/{$id}");
                return $createdId !== null;
            }

            return true;
        } catch (\Exception $e) {
            error_log("Error ensuring record exists in {$tableName}: ".$e->getMessage());
            return false;
        }
    }

    /**
     * Get or create foreign key record
     */
    public function getOrCreateForeignKey(string $tableName, ?string $column = null): ?int
    {
        try {
            if (!DB::getSchemaBuilder()->hasTable($tableName)) {
                return null;
            }

            // Try to get existing ID
            $id = $this->getRandomIdFromTable($tableName);
            
            if ($id) {
                return $id;
            }

            // Create new record
            $id = $this->createTestRecord($tableName, "/{$tableName}");
            
            return $id;
        } catch (\Exception $e) {
            error_log("Error getting or creating foreign key from {$tableName}: ".$e->getMessage());
            return null;
        }
    }

    /**
     * Create related record for foreign key
     */
    public function createRelatedRecord(string $tableName, array $data = []): ?int
    {
        try {
            if (!DB::getSchemaBuilder()->hasTable($tableName)) {
                return null;
            }

            $columns = DB::getSchemaBuilder()->getColumnListing($tableName);
            $now = now();

            // Add timestamps
            if (in_array('created_at', $columns) && !isset($data['created_at'])) {
                $data['created_at'] = $now;
            }
            if (in_array('updated_at', $columns) && !isset($data['updated_at'])) {
                $data['updated_at'] = $now;
            }

            // Handle common foreign keys
            if (in_array('company_id', $columns) && !isset($data['company_id']) && $this->testUserId) {
                $userCompany = DB::table('users')
                    ->where('id', $this->testUserId)
                    ->value('company_id');
                if ($userCompany) {
                    $data['company_id'] = $userCompany;
                } else {
                    // Create company if needed
                    $companyId = $this->getOrCreateForeignKey('companies');
                    if ($companyId) {
                        $data['company_id'] = $companyId;
                    }
                }
            }

            if (in_array('user_id', $columns) && !isset($data['user_id']) && $this->testUserId) {
                $data['user_id'] = $this->testUserId;
            }

            // Insert and get ID
            $id = DB::table($tableName)->insertGetId($data);
            
            return $id ? (int) $id : null;
        } catch (\Exception $e) {
            error_log("Error creating related record in {$tableName}: ".$e->getMessage());
            return null;
        }
    }

    /**
     * Clear cache
     */
    public function clearCache(): void
    {
        $this->cache = [];
    }
}

