<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Migration to make macro_id required in inbox_note_outputs table
 * 
 * This ensures every output must have a macro_id (template)
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement('ALTER TABLE inbox_note_outputs DROP FOREIGN KEY inbox_note_outputs_macro_id_foreign');
            
            DB::table('inbox_note_outputs')
                ->whereNull('macro_id')
                ->delete();
            
            DB::statement('ALTER TABLE inbox_note_outputs MODIFY macro_id BIGINT UNSIGNED NOT NULL');
            
            DB::statement('ALTER TABLE inbox_note_outputs ADD CONSTRAINT inbox_note_outputs_macro_id_foreign FOREIGN KEY (macro_id) REFERENCES macros(id) ON DELETE RESTRICT');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement('ALTER TABLE inbox_note_outputs DROP FOREIGN KEY inbox_note_outputs_macro_id_foreign');
            
            DB::statement('ALTER TABLE inbox_note_outputs MODIFY macro_id BIGINT UNSIGNED NULL');
            
            DB::statement('ALTER TABLE inbox_note_outputs ADD CONSTRAINT inbox_note_outputs_macro_id_foreign FOREIGN KEY (macro_id) REFERENCES macros(id) ON DELETE SET NULL');
        }
    }
};
