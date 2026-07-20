<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NoteAnalysis extends Model
{
    use HasFactory;

    protected $table = 'note_analyses';

    protected $fillable = [
        'inbox_note_id',
        'form_name',
        'analysis_data',
        'method',
        'language',
    ];

    protected $casts = [
        'extracted_fields' => 'array',
        'field_mappings' => 'array',
        'analysis_data' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function inboxNote(): BelongsTo
    {
        return $this->belongsTo(InboxNote::class, 'inbox_note_id');
    }
}
