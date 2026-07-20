<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Create pivot table
        Schema::create('macro_medical_departments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('macro_id')->constrained('macros')->onDelete('cascade');
            $table->foreignId('medical_department_id')->constrained('medical_departments')->onDelete('cascade');
            $table->timestamps();

            $table->unique(['macro_id', 'medical_department_id']);
            $table->index('medical_department_id');
        });

        // Migrate existing category data to pivot table
        $macros = DB::table('macros')->whereNotNull('category')->where('category', '!=', '')->get();
        $departments = DB::table('medical_departments')->pluck('id', 'department_id')->toArray();

        foreach ($macros as $macro) {
            $cats = array_map('trim', explode(',', $macro->category));
            foreach ($cats as $cat) {
                if (!empty($cat) && isset($departments[$cat])) {
                    DB::table('macro_medical_departments')->insert([
                        'macro_id' => $macro->id,
                        'medical_department_id' => $departments[$cat],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }

        // Drop category column
        Schema::table('macros', function (Blueprint $table) {
            $table->dropIndex('idx_macros_category');
            $table->dropColumn('category');
        });
    }

    public function down(): void
    {
        Schema::table('macros', function (Blueprint $table) {
            $table->string('category')->default('General')->after('ai_instruction');
            $table->index('category', 'idx_macros_category');
        });

        // Migrate data back (optional)
        $assignments = DB::table('macro_medical_departments')
            ->join('medical_departments', 'macro_medical_departments.medical_department_id', '=', 'medical_departments.id')
            ->select('macro_medical_departments.macro_id', 'medical_departments.department_id')
            ->get()
            ->groupBy('macro_id');

        foreach ($assignments as $macroId => $rows) {
            $cats = $rows->pluck('department_id')->implode(',');
            DB::table('macros')->where('id', $macroId)->update(['category' => $cats]);
        }

        Schema::dropIfExists('macro_medical_departments');
    }
};
