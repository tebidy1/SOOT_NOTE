<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Persist the Stage-1 (repair) artifacts on the note itself so every
 * subsequent format-only call for the same note reuses the SAME repaired
 * transcript instead of re-running the probabilistic repair step. Also
 * gives us a durable audit trail of what the AI changed vs the raw ASR.
 *
 *   repaired_transcript — Stage-1 output; input to Stage-2 formatting.
 *   repair_flags        — per-token uncertainty markers from Stage-1.
 *   repair_source       — which model produced the repair (audit + failover diagnostics).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inbox_notes', function (Blueprint $table) {
            $table->text('repaired_transcript')->nullable()->after('formatted_text');
            $table->json('repair_flags')->nullable()->after('repaired_transcript');
            $table->string('repair_source', 64)->nullable()->after('repair_flags');
        });
    }

    public function down(): void
    {
        Schema::table('inbox_notes', function (Blueprint $table) {
            $table->dropColumn(['repaired_transcript', 'repair_flags', 'repair_source']);
        });
    }
};
