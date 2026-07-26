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
        Schema::table('macros', function (Blueprint $table) {
            $table->dropIndex('idx_macros_is_favorite');
            $table->dropColumn('is_favorite');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('macros', function (Blueprint $table) {
            $table->boolean('is_favorite')->default(false)->after('content');
            $table->index('is_favorite', 'idx_macros_is_favorite');
        });
    }
};
