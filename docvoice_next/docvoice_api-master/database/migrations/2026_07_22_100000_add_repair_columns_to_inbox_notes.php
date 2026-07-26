<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds Stage 1 (repair) cache columns to inbox_notes so the repair pass
 * runs ONCE per note. Every subsequent template application reads the
 * cached values, guaranteeing that ambiguous words are resolved the same
 * way across all templates on the same note, and cutting per-template
 * generation time roughly in half.
 *
 * Nullable everywhere: legacy notes (created before this column set)
 * simply trigger a one-time repair the first time a template is applied.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inbox_notes', function (Blueprint $table) {
            if (!Schema::hasColumn('inbox_notes', 'repaired_transcript')) {
                $table->text('repaired_transcript')->nullable()->after('formatted_text');
            }
            if (!Schema::hasColumn('inbox_notes', 'repair_flags')) {
                $table->json('repair_flags')->nullable()->after('repaired_transcript');
            }
            if (!Schema::hasColumn('inbox_notes', 'repair_patient_info')) {
                $table->json('repair_patient_info')->nullable()->after('repair_flags');
            }
        });
    }

    public function down(): void
    {
        Schema::table('inbox_notes', function (Blueprint $table) {
            if (Schema::hasColumn('inbox_notes', 'repair_patient_info')) {
                $table->dropColumn('repair_patient_info');
            }
            if (Schema::hasColumn('inbox_notes', 'repair_flags')) {
                $table->dropColumn('repair_flags');
            }
            if (Schema::hasColumn('inbox_notes', 'repaired_transcript')) {
                $table->dropColumn('repaired_transcript');
            }
        });
    }
};
