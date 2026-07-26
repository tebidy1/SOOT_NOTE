<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Company;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class OracleTokenTest extends TestCase
{
    use RefreshDatabase;

    public function test_oracle_token_route_requires_auth()
    {
        $response = $this->getJson('/api/audio/oracle-token');
        $response->assertStatus(401);
    }

    public function test_oracle_token_returns_error_if_credentials_missing()
    {
        $user = User::factory()->create();
        $company = Company::factory()->create();
        $user->update(['company_id' => $company->id]);

        // Ensure config is empty for the test
        config(['services.oci.tenancy_id' => null]);

        $response = $this->actingAs($user)->getJson('/api/audio/oracle-token');

        $response->assertStatus(500);
        $response->assertJson([
            'success' => false,
            'message' => 'OCI credentials are not configured in backend .env'
        ]);
    }

    public function test_oracle_token_fetches_token_successfully()
    {
        $user = User::factory()->create();
        $company = Company::factory()->create();
        $user->update(['company_id' => $company->id]);

        // Mock OCI credentials
        config([
            'services.oci.tenancy_id' => 'test-tenancy',
            'services.oci.user_id' => 'test-user',
            'services.oci.fingerprint' => 'test-fingerprint',
            'services.oci.compartment_id' => 'test-compartment',
            'services.oci.private_key' => "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCu...\n-----END PRIVATE KEY-----",
            'services.oci.region' => 'me-riyadh-1',
        ]);

        // Mock OCI Response
        Http::fake([
            'https://speech.aiservice.me-riyadh-1.oci.oraclecloud.com/*' => Http::response([
                'token' => 'mock-oracle-token'
            ], 200)
        ]);

        $response = $this->actingAs($user)->getJson('/api/audio/oracle-token');

        $response->assertStatus(200);
        $response->assertJson([
            'status' => true,
            'token' => 'mock-oracle-token'
        ]);
    }
}
