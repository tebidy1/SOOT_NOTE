<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TranscriptionJob extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'oci_job_id',
        'file_path',
        'oci_object_name',
        'status',
        'transcript',
        'confidence',
        'language',
        'model_type',
    ];

    /**
     * Get the user that owns the transcription job.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
