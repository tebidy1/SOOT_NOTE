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
        Schema::table('note_analyses', function (Blueprint $table) {
            // إزالة القيد الفريد من inbox_note_id
            $table->dropUnique(['inbox_note_id']);

            // إضافة حقل form_name
            $table->string('form_name')->default('general')->after('inbox_note_id');

            // إضافة حقل analysis_data لتخزين التحليل كـ JSON
            $table->json('analysis_data')->nullable()->after('form_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // إعادة البيانات من analysis_data إلى extracted_fields و field_mappings
        DB::statement("
            UPDATE note_analyses
            SET extracted_fields = JSON_EXTRACT(analysis_data, '$.extracted_fields'),
                field_mappings = JSON_EXTRACT(analysis_data, '$.field_mappings')
            WHERE analysis_data IS NOT NULL
        ");

        Schema::table('note_analyses', function (Blueprint $table) {
            // إزالة الحقول الجديدة
            $table->dropColumn(['form_name', 'analysis_data']);

            // إعادة القيد الفريد
            $table->unique('inbox_note_id');
        });
    }
};
