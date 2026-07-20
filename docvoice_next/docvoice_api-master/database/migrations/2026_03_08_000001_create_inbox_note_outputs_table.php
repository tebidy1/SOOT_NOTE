<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * هذا الجدول يخزن المخرجات المتولدة من التمبلتات (الماكروس)
     * كل ملاحظة يمكن أن تحتوي على عدة مخرجات
     */
    public function up(): void
    {
        Schema::create('inbox_note_outputs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inbox_note_id')->constrained('inbox_notes')->onDelete('cascade');
            $table->foreignId('macro_id')->nullable()->constrained('macros')->onDelete('set null');
            $table->string('title')->nullable(); // اسم التمبلت أو العنوان
            $table->longText('content')->nullable(); // المحتوى المولد
            $table->integer('order_index')->default(0); // ترتيب المخرجات
            $table->timestamps();

            $table->index('inbox_note_id', 'idx_inbox_note_outputs_note_id');
            $table->index('macro_id', 'idx_inbox_note_outputs_macro_id');
        });

        // إضافة applied_macro_id لجدول inbox_notes
        Schema::table('inbox_notes', function (Blueprint $table) {
            $table->foreignId('applied_macro_id')->nullable()->constrained('macros')->onDelete('set null')->after('suggested_macro_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inbox_notes', function (Blueprint $table) {
            $table->dropForeign(['applied_macro_id']);
            $table->dropColumn('applied_macro_id');
        });

        Schema::dropIfExists('inbox_note_outputs');
    }
};
