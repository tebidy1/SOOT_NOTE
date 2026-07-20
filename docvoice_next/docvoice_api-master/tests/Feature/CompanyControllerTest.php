<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CompanyControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        // إنشاء مستخدم مدير للاختبار
        $this->adminUser = User::factory()->create([
            'role' => 'admin',
            'status' => 'active',
        ]);
    }

    /**
     * اختبار جلب قائمة الشركات
     */
    public function test_can_get_companies_list(): void
    {
        // إنشاء شركات للاختبار
        Company::factory()->count(3)->create();

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson('/api/admin/companies');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'data' => [
                        '*' => [
                            'id',
                            'name',
                            'status',
                            'created_at',
                        ],
                    ],
                ],
                'message',
            ]);
    }

    /**
     * اختبار إنشاء شركة جديدة
     */
    public function test_can_create_company(): void
    {
        $companyData = [
            'name' => 'شركة اختبار',
            'description' => 'وصف شركة الاختبار',
            'status' => 'active',
            'email' => 'test@company.com',
        ];

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson('/api/admin/companies', $companyData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'name',
                    'description',
                    'status',
                    'email',
                ],
                'message',
            ]);

        $this->assertDatabaseHas('companies', [
            'name' => 'شركة اختبار',
            'email' => 'test@company.com',
        ]);
    }

    /**
     * اختبار عدم القدرة على إنشاء شركة بدون صلاحيات
     */
    public function test_cannot_create_company_without_admin_role(): void
    {
        $regularUser = User::factory()->create([
            'role' => 'user',
            'status' => 'active',
        ]);

        $companyData = [
            'name' => 'شركة اختبار',
            'status' => 'active',
        ];

        $response = $this->actingAs($regularUser, 'sanctum')
            ->postJson('/api/admin/companies', $companyData);

        $response->assertStatus(403); // Forbidden
    }

    /**
     * اختبار تحديث شركة موجودة
     */
    public function test_can_update_company(): void
    {
        $company = Company::factory()->create([
            'name' => 'شركة قديمة',
        ]);

        $updateData = [
            'name' => 'شركة محدثة',
            'description' => 'وصف محدث',
            'status' => 'active',
        ];

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->putJson("/api/admin/companies/{$company->id}", $updateData);

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'شركة محدثة');

        $this->assertDatabaseHas('companies', [
            'id' => $company->id,
            'name' => 'شركة محدثة',
        ]);
    }

    /**
     * اختبار تبديل حالة الشركة
     */
    public function test_can_toggle_company_status(): void
    {
        $company = Company::factory()->create([
            'status' => 'active',
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson("/api/admin/companies/{$company->id}/toggle-status");

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'inactive');

        $this->assertDatabaseHas('companies', [
            'id' => $company->id,
            'status' => 'inactive',
        ]);
    }

    /**
     * اختبار التحقق من صحة البيانات
     */
    public function test_validates_required_fields(): void
    {
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson('/api/admin/companies', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'status']);
    }
}
