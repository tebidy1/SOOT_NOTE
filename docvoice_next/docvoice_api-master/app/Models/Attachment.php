<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LaraCore\Models\BaseModel;

class Attachment extends BaseModel
{
    protected $table = 'attachments';

    protected $casts = [
        'created_at' => 'datetime',
    ];

    /**
     * Boot the model.
     * Explicitly disable soft deletes for this model.
     */
    protected static function boot()
    {
        parent::boot();
        
        // Remove any soft delete scope that might be added
        static::addGlobalScope('force_no_soft_delete', function ($builder) {
            $builder->withoutGlobalScope(\Illuminate\Database\Eloquent\SoftDeletingScope::class);
        });
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class, 'message_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

