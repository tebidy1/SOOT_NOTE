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
        Schema::table('inbox_notes', function (Blueprint $table) {
            $table->string('uuid')->nullable()->unique()->after('id')->index();
            $table->text('original_text')->nullable()->after('raw_text');
            $table->text('formatted_text')->nullable()->after('original_text');
            $table->string('audio_path')->nullable()->after('formatted_text');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inbox_notes', function (Blueprint $table) {
            $table->dropColumn(['uuid', 'original_text', 'formatted_text', 'audio_path']);
        });
    }
};
