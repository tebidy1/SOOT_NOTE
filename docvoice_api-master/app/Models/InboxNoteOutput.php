<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * نموذج مخرجات الملاحظة (Generated Output)
 * 
 * يخزن المحتوى المتولد من تطبيق التمبلتات (الماكروس) على الملاحظة
 * كل ملاحظة يمكن أن تحتوي على عدة مخرجات
 * 
 * @property int $id
 * @property int $inbox_note_id
 * @property int|null $macro_id
 * @property string|null $title
 * @property string|null $content
 * @property int $order_index
 * @property \Carbon\Carbon|null $created_at
 * @property \Carbon\Carbon|null $updated_at
 */
class InboxNoteOutput extends Model
{
    use HasFactory;

    protected $table = 'inbox_note_outputs';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'inbox_note_id',
        'macro_id',
        'title',
        'content',
        'order_index',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'inbox_note_id' => 'integer',
        'macro_id' => 'integer',
        'order_index' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the inbox note that owns this output.
     */
    public function inboxNote(): BelongsTo
    {
        return $this->belongsTo(InboxNote::class, 'inbox_note_id');
    }

    /**
     * Get the macro used to generate this output.
     */
    public function macro(): BelongsTo
    {
        return $this->belongsTo(Macro::class, 'macro_id');
    }
}
