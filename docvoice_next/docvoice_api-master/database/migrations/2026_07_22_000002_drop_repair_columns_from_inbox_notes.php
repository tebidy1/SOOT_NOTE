<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Rolls back the split-repair columns added earlier the same day. The
 * split architecture caused unpredictable failures on the second applied
 * template — the doctor's second template request would hang and its
 * output never rendered. We reverted the code to the single combined
 * repair+format path; these DB columns are no longer written or read.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inbox_notes', function (Blueprint $table) {
            if (Schema::hasColumn('inbox_notes', 'repair_source')) {
                $table->dropColumn('repair_source');
            }
            if (Schema::hasColumn('inbox_notes', 'repair_flags')) {
                $table->dropColumn('repair_flags');
            }
            if (Schema::hasColumn('inbox_notes', 'repaired_transcript')) {
                $table->dropColumn('repaired_transcript');
            }
        });
    }

    public function down(): void
    {
        Schema::table('inbox_notes', function (Blueprint $table) {
            $table->text('repaired_transcript')->nullable()->after('formatted_text');
            $table->json('repair_flags')->nullable()->after('repaired_transcript');
            $table->string('repair_source', 64)->nullable()->after('repair_flags');
        });
    }
};
