<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\InboxStatus;
use App\Models\NoteAnalysis;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Concerns\HasEvents;

class InboxNote extends Model
{
    use HasFactory, HasEvents;

    protected $table = 'inbox_notes';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'company_id',
        'uuid',
        'raw_text',
        'original_text',
        'formatted_text',
        'audio_path',
        'patient_name',
        'summary',
        'status',
        'suggested_macro_id',
        'applied_macro_id',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'status' => InboxStatus::class,
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user that owns the inbox note.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the company that owns the inbox note.
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Get the suggested macro for this inbox note.
     */
    public function suggestedMacro(): BelongsTo
    {
        return $this->belongsTo(Macro::class, 'suggested_macro_id');
    }

    /**
     * Get the applied macro for this inbox note.
     */
    public function appliedMacro(): BelongsTo
    {
        return $this->belongsTo(Macro::class, 'applied_macro_id');
    }

    /**
     * Get the generated outputs for this inbox note.
     */
    public function outputs()
    {
        return $this->hasMany(InboxNoteOutput::class, 'inbox_note_id')->orderBy('order_index');
    }

    public function textAnalyses(): HasMany
    {
        return $this->hasMany(NoteAnalysis::class, 'inbox_note_id');
    }

    // للتوافق مع الكود القديم
    public function textAnalysis(): HasOne
    {
        return $this->hasOne(NoteAnalysis::class, 'inbox_note_id');
    }
}
