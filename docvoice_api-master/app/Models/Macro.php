<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Macro extends Model
{
    use HasFactory;

    protected $table = 'macros';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'company_id',
        'trigger',
        'content',
        'usage_count',
        'last_used',
        'is_ai_macro',
        'ai_instruction',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'is_ai_macro' => 'boolean',
        'usage_count' => 'integer',
        'last_used' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * The attributes that should have default values.
     */
    protected $attributes = [
        'usage_count' => 0,
        'is_ai_macro' => false,
    ];

    /**
     * Get the user that owns the macro.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the company that owns the macro.
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Get the medical departments assigned to this macro.
     */
    public function medicalDepartments(): BelongsToMany
    {
        return $this->belongsToMany(MedicalDepartment::class, 'macro_medical_departments')
            ->withTimestamps();
    }

    /**
     * Get the users who favorited this macro.
     */
    public function favoritedBy(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_macro_favorites')
            ->withTimestamps();
    }

    /**
     * Check if this macro is favorited by a specific user.
     */
    public function isFavoriteByUser(?int $userId): bool
    {
        if (!$userId) {
            return false;
        }
        return $this->favoritedBy()->where('user_id', $userId)->exists();
    }
}
