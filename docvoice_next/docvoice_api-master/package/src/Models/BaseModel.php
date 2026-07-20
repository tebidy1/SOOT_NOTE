<?php

namespace LaraCore\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use LaraCore\Traits\FilterableTrait;
use LaraCore\Traits\SearchableTrait;
use LaraCore\Traits\SortableTrait;

abstract class BaseModel extends Model
{
    use FilterableTrait, SearchableTrait, SortableTrait;

    protected $guarded = ['id'];

    /**
     * Boot the model.
     * Prevents Laravel from automatically adding SoftDeletes trait.
     */
    protected static function boot()
    {
        parent::boot();

        // Force remove soft delete scope if it exists
        // This prevents Laravel from trying to use soft delete even if deleted_at column exists
        static::addGlobalScope('prevent_soft_delete', function ($query) {
            $query->withoutGlobalScope(\Illuminate\Database\Eloquent\SoftDeletingScope::class);
        });
    }

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
     * Get a new query builder for the model's table.
     * This ensures that soft delete scopes are never applied to BaseModel instances.
     * We create the query builder directly from DB facade to completely bypass all scopes.
     */
    public function newQuery()
    {
        // Create query builder directly from DB facade to completely bypass all scopes
        // This ensures no soft delete scope is ever applied, even if Laravel tries to add it
        $baseQuery = DB::table($this->getTable());
        $builder = $this->newEloquentBuilder($baseQuery);
        $builder->setModel($this);

        return $builder;
    }

    /**
     * Get a new query builder without any global scopes.
     * This is used for hard deletes and other operations that need to bypass scopes.
     */
    public function newQueryWithoutScopes()
    {
        // Create query builder directly from DB facade to completely bypass all scopes
        $baseQuery = DB::table($this->getTable());
        $builder = $this->newEloquentBuilder($baseQuery);
        $builder->setModel($this);

        return $builder;
    }

    /**
     * Get a new Eloquent query builder for the model.
     */
    public function newEloquentBuilder($query)
    {
        return new \Illuminate\Database\Eloquent\Builder($query);
    }

    /**
     * Override delete to always perform hard delete.
     * Bypasses all Eloquent soft delete logic by using DB facade directly.
     * This method completely bypasses Laravel's soft delete mechanism.
     */
    public function delete()
    {
        // Use DB facade directly to completely bypass Laravel's soft delete logic
        // This ensures hard delete even if Laravel tries to add soft delete logic
        return DB::table($this->getTable())
            ->where($this->getKeyName(), $this->getKey())
            ->delete();
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
     * Uses DB facade directly to bypass any Eloquent soft delete logic.
     */
    protected function performDeleteOnModel()
    {
        DB::table($this->getTable())
            ->where($this->getKeyName(), $this->getKey())
            ->delete();
    }
}
