<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Company;
use Tests\ApiTester\ApiTestRunner;

class ApiAgentRunCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'api-agent:run
                            {--resume : Resume testing from last checkpoint}
                            {--url= : API base URL (default: http://localhost:8001)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Run Laravel Smart API Agent to test all API endpoints';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $basePath = base_path();
        $baseUrl = $this->option('url') ?? env('API_BASE_URL', 'http://localhost:8001');
        $resume = $this->option('resume') ?? false;

        $this->info('🚀 Starting Laravel Smart API Agent...');
        $this->info("📍 Base URL: {$baseUrl}");
        $this->info('');

        // Ensure test user exists
        $this->ensureTestUserExists();

        try {
            $runner = new ApiTestRunner($basePath, $baseUrl);

            if ($resume) {
                $this->info('📊 Resuming from last checkpoint...');
                $this->info('');
            }

            $results = $runner->testAll(resume: $resume);

            $successCount = count(array_filter($results, fn($r) => $r['success'] ?? false));
            $failCount = count($results) - $successCount;

            $this->info('');
            $this->info('═══════════════════════════════════════');
            $this->info('📊 Test Summary');
            $this->info('═══════════════════════════════════════');
            $this->info("✅ Successful: {$successCount}");
            $this->info("❌ Failed: {$failCount}");
            $this->info("📁 Results saved in: tests/ai-results/");
            $this->info('═══════════════════════════════════════');

            return $failCount > 0 ? 1 : 0;
        } catch (\Exception $e) {
            $this->error('❌ Error: '.$e->getMessage());
            $this->error($e->getTraceAsString());

            return 1;
        }
    }

    /**
     * Ensure test user exists (ID = 1)
     */
    private function ensureTestUserExists(): void
    {
        try {
            $this->info('🔐 Checking test user existence...');

            $user = User::find(1);

            if (!$user) {
                $this->warn('⚠️  Test user (ID=1) not found. Creating...');

                // Get or create a default company
                $company = Company::first();
                if (!$company) {
                    $company = Company::create([
                        'name' => 'Test Company',
                        'plan_type' => 'basic',
                    ]);
                    $this->info("   ✅ Created default company: {$company->name}");
                }

                // Delete any existing user with test email to avoid conflicts
                User::where('email', 'test@example.com')->delete();

                // Create test user with ID = 1 using DB::insert (since id is not fillable)
                DB::table('users')->insert([
                    'id' => 1,
                    'name' => 'Test User',
                    'email' => 'test@example.com',
                    'password' => Hash::make('password'),
                    'company_id' => $company->id,
                    'role' => 'admin',
                    'status' => 'active',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $this->info("   ✅ Created test user (ID=1): test@example.com");
            } else {
                $this->info("   ✅ Test user exists (ID=1): {$user->email}");
            }
        } catch (\Exception $e) {
            $this->warn("   ⚠️  Error ensuring test user: ".$e->getMessage());
            $this->warn("   ⚠️  Continuing anyway...");
        }
    }
}

