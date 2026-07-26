<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('note_analyses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inbox_note_id')->unique()->constrained('inbox_notes')->onDelete('cascade');
            $table->json('extracted_fields')->nullable();
            $table->json('field_mappings')->nullable();
            $table->string('method')->default('gemini');
            $table->string('language')->default('ar');
            $table->timestamps();

            $table->index('inbox_note_id', 'idx_note_analyses_inbox_note_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('note_analyses');
    }
};
