<?php

namespace LaraCore\Models;

use Illuminate\Database\Eloquent\Model;
use LaraCore\Traits\FilterableTrait;
use LaraCore\Traits\SearchableTrait;
use LaraCore\Traits\SortableTrait;

abstract class MainModel extends Model
{
    use FilterableTrait, SearchableTrait, SortableTrait;

    protected $guarded = ['id'];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * The attributes that should be hidden for serialization.
     */

    /**
     * Get the table associated with the model.
     */
    public function getTable(): string
    {
        return $this->table ?? strtolower(class_basename($this)).'s';
    }

    /**
     * Scope to get active records.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope to get inactive records.
     */
    public function scopeInactive($query)
    {
        return $query->where('status', 'inactive');
    }

    /**
     * Scope to get records by status.
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to get records created today.
     */
    public function scopeToday($query)
    {
        return $query->whereDate('created_at', today());
    }

    /**
     * Scope to get records created this week.
     */
    public function scopeThisWeek($query)
    {
        return $query->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()]);
    }

    /**
     * Scope to get records created this month.
     */
    public function scopeThisMonth($query)
    {
        return $query->whereMonth('created_at', now()->month);
    }

    /**
     * Scope to get records created this year.
     */
    public function scopeThisYear($query)
    {
        return $query->whereYear('created_at', now()->year);
    }

    /**
     * Get the model's display name.
     */
    public function getDisplayNameAttribute(): string
    {
        return $this->name ?? $this->title ?? $this->id;
    }

    /**
     * Check if the model is active.
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Check if the model is inactive.
     */
    public function isInactive(): bool
    {
        return $this->status === 'inactive';
    }

    /**
     * Activate the model.
     */
    public function activate(): bool
    {
        return $this->update(['status' => 'active']);
    }

    /**
     * Deactivate the model.
     */
    public function deactivate(): bool
    {
        return $this->update(['status' => 'inactive']);
    }

    /**
     * Get the model's status badge.
     */
    public function getStatusBadgeAttribute(): string
    {
        return match ($this->status) {
            'active' => '<span class="badge badge-success">نشط</span>',
            'inactive' => '<span class="badge badge-danger">غير نشط</span>',
            'pending' => '<span class="badge badge-warning">في الانتظار</span>',
            default => '<span class="badge badge-secondary">غير محدد</span>'
        };
    }

    /**
     * Get the model's status text.
     */
    public function getStatusTextAttribute(): string
    {
        return match ($this->status) {
            'active' => 'نشط',
            'inactive' => 'غير نشط',
            'pending' => 'في الانتظار',
            default => 'غير محدد'
        };
    }

    /**
     * Perform the actual delete query on this model instance.
     * This method forces hard delete for all models extending BaseModel.
     */
}
