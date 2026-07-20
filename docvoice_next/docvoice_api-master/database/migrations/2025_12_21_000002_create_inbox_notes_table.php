<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('inbox_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->foreignId('company_id')->nullable()->constrained('companies')->onDelete('cascade');
            $table->text('raw_text');
            $table->string('patient_name')->nullable();
            $table->string('summary')->nullable();
            $table->string('status')->default('pending'); // pending, processed, archived
            $table->foreignId('suggested_macro_id')->nullable()->constrained('macros')->onDelete('set null');
            $table->timestamps();

            $table->index('user_id', 'idx_inbox_notes_user_id');
            $table->index('status', 'idx_inbox_notes_status');
            $table->index('created_at', 'idx_inbox_notes_created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inbox_notes');
    }
};
