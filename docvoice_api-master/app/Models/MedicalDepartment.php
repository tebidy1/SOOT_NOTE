<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class MedicalDepartment extends Model
{
    use HasFactory;

    protected $table = 'medical_departments';

    /**
     * البيانات القابلة للحفظ
     */
    protected $fillable = [
        'name_en',
        'name_ar',
        'icon',
        'color',
        'relevant_categories',
        'is_active',
        'sort_order',
    ];

    /**
     * تحويل الأنواع
     */
    protected $casts = [
        'relevant_categories' => 'array',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the users with this department
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'medical_department_id');
    }

    /**
     * Get the macros assigned to this department.
     */
    public function macros(): BelongsToMany
    {
        return $this->belongsToMany(Macro::class, 'macro_medical_departments')
            ->withTimestamps();
    }

    /**
     * Scope for active departments
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope ordered by sort_order
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name_en');
    }

    /**
     * Get relevant categories as a formatted array
     */
    public function getRelevantCategoriesListAttribute(): array
    {
        return $this->relevant_categories ?? ['General'];
    }
}
