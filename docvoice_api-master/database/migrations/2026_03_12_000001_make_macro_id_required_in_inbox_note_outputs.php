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
        // First, drop the existing foreign key constraint
        // The constraint name follows Laravel's convention: {table}_{columns}_foreign
        DB::statement('ALTER TABLE inbox_note_outputs DROP FOREIGN KEY inbox_note_outputs_macro_id_foreign');
        
        // Update any NULL macro_id values to a valid default or delete them
        // Here we delete rows with NULL macro_id (can't have required field without valid macro)
        DB::table('inbox_note_outputs')
            ->whereNull('macro_id')
            ->delete();
        
        // Now change the column to NOT NULL
        DB::statement('ALTER TABLE inbox_note_outputs MODIFY macro_id BIGINT UNSIGNED NOT NULL');
        
        // Re-add the foreign key constraint with RESTRICT (prevent deletion of macros with outputs)
        DB::statement('ALTER TABLE inbox_note_outputs ADD CONSTRAINT inbox_note_outputs_macro_id_foreign FOREIGN KEY (macro_id) REFERENCES macros(id) ON DELETE RESTRICT');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop the foreign key constraint
        DB::statement('ALTER TABLE inbox_note_outputs DROP FOREIGN KEY inbox_note_outputs_macro_id_foreign');
        
        // Change back to nullable
        DB::statement('ALTER TABLE inbox_note_outputs MODIFY macro_id BIGINT UNSIGNED NULL');
        
        // Re-add the foreign key constraint with SET NULL
        DB::statement('ALTER TABLE inbox_note_outputs ADD CONSTRAINT inbox_note_outputs_macro_id_foreign FOREIGN KEY (macro_id) REFERENCES macros(id) ON DELETE SET NULL');
    }
};
