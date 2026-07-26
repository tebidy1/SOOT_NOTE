<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class CheckUserRoleMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that the role middleware allows access for users with the correct role.
     */
    public function test_role_middleware_allows_access_for_correct_role(): void
    {
        $user = User::factory()->create([
            'role' => 'admin'
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/test-role');

        $response->assertStatus(200);
        $response->assertJson([
            'status' => true,
            'message' => 'Role middleware is working correctly'
        ]);
    }

    /**
     * Test that the role middleware blocks access for users with incorrect role.
     */
    public function test_role_middleware_blocks_access_for_incorrect_role(): void
    {
        $user = User::factory()->create([
            'role' => 'user'
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/test-role');

        $response->assertStatus(403);
        $response->assertJson([
            'status' => false,
            'message' => 'ليس لديك صلاحية للوصول لهذا المورد'
        ]);
    }

    /**
     * Test that the role middleware blocks access for unauthenticated users.
     */
    public function test_role_middleware_blocks_access_for_unauthenticated_users(): void
    {
        $response = $this->getJson('/api/test-role');

        $response->assertStatus(401);
        $response->assertJson([
            'status' => false,
            'message' => 'غير مصرح لك بالوصول'
        ]);
    }
}