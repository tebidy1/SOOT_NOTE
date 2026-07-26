<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('sessions')) {
            Schema::create('sessions', function (Blueprint $table) {
                $table->string('sid', 191)->primary();
                $table->json('sess');
                $table->timestamp('expire');

                $table->index('expire', 'IDX_session_expire');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions');
    }
};

