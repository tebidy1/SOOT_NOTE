<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // حذف الجدول القديم إذا كان موجوداً
        Schema::dropIfExists('note_analyses');

        // إنشاء جدول جديد للتحاليل
        Schema::create('note_analyses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inbox_note_id')->constrained('inbox_notes')->onDelete('cascade');
            $table->string('form_name')->default('general'); // اسم الفورم كنص
            $table->json('analysis_data')->nullable(); // قيمة التحليل كـ JSON
            $table->string('method')->default('gemini');
            $table->string('language')->default('ar');
            $table->timestamps();

            // فهرس للبحث السريع
            $table->index(['inbox_note_id', 'form_name'], 'idx_note_analyses_note_form');
            $table->index('form_name', 'idx_note_analyses_form_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('note_analyses');
    }
};
