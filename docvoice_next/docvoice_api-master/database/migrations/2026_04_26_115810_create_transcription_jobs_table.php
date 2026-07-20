<?php

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
        Schema::create('transcription_jobs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('oci_job_id')->nullable();       // OCI job OCID
            $table->string('file_path');                      // local temp path or storage path
            $table->string('oci_object_name')->nullable();    // Object Storage object name
            $table->enum('status', ['uploading', 'processing', 'succeeded', 'failed'])->default('uploading');
            $table->longText('transcript')->nullable();
            $table->float('confidence')->nullable();
            $table->string('language')->default('ar');
            $table->string('model_type')->default('WHISPER_LARGE_V3_TURBO');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transcription_jobs');
    }
};
