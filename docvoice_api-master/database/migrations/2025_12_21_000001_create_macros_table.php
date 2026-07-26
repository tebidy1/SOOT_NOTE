<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('macros', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->foreignId('company_id')->nullable()->constrained('companies')->onDelete('cascade');
            $table->string('trigger')->index();
            $table->text('content');
            $table->boolean('is_favorite')->default(false);
            $table->integer('usage_count')->default(0);
            $table->timestamp('last_used')->nullable();
            $table->boolean('is_ai_macro')->default(false);
            $table->text('ai_instruction')->nullable();
            $table->string('category')->default('General');
            $table->timestamps();

            $table->index('user_id', 'idx_macros_user_id');
            $table->index('trigger', 'idx_macros_trigger');
            $table->index('category', 'idx_macros_category');
            $table->index('is_favorite', 'idx_macros_is_favorite');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('macros');
    }
};
