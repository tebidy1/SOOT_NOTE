<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);
            $table->string('domain', 255)->nullable();
            $table->string('invitation_code', 50)->nullable()->unique();
            $table->string('code', 64)->nullable()->unique();
            $table->string('plan_type', 50)->default('basic');
            $table->timestamps();
            $table->softDeletes();

            $table->index('domain', 'idx_companies_domain');
            $table->index('invitation_code', 'idx_companies_invitation_code');
            $table->index('code', 'idx_companies_code');
        });

        // Add foreign key constraint for users table
        Schema::table('users', function (Blueprint $table) {
            $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};

