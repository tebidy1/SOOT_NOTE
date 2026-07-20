<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\CompanyStatus;
use App\Enums\PlanType;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;
use LaraCore\Models\BaseModel;

class Company extends BaseModel
{
    protected $table = 'companies';

    protected $fillable = [
        'name',
        'domain',
        'invitation_code',
        'code',
        'plan_type',
        'status',
        'settings',
    ];

    protected $casts = [
        'plan_type' => PlanType::class,
        'status' => CompanyStatus::class,
        'settings' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $attributes = [
        'status' => 'active',
    ];

    /**
     * Boot the model.
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($company) {
            if (empty($company->code)) {
                // سيتم إنشاء الكود بعد حفظ الشركة في Observer
            }
        });

        static::created(function ($company) {
            if (empty($company->code)) {
                $company->code = $company->generateCode();
                $company->saveQuietly(); // تجنب إعادة تشغيل Events
            }
        });

        static::updating(function ($company) {
            // إذا تم تغيير ID (غير محتمل) أو كان code فارغاً، قم بتحديثه
            if (empty($company->code)) {
                $company->code = $company->generateCode();
            }
        });
    }

    /**
     * إنشاء hash لرقم الشركة
     */
    public function generateCode(): string
    {
        return hash('sha256', $this->id . config('app.key'));
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'company_id');
    }

    public function workspaces(): HasMany
    {
        return $this->hasMany(Workspace::class, 'company_id');
    }

    public function channels(): HasMany
    {
        return $this->hasMany(Channel::class, 'company_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class, 'company_id');
    }

    public function drawings(): HasMany
    {
        return $this->hasMany(Drawing::class, 'company_id');
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class, 'company_id');
    }

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class, 'company_id');
    }

    public function disciplines(): HasMany
    {
        return $this->hasMany(Discipline::class, 'company_id');
    }

    public function floors(): HasMany
    {
        return $this->hasMany(Floor::class, 'company_id');
    }

    /**
     * Scope a query to only include active companies.
     */
    public function scopeActive($query)
    {
        return $query->where('status', CompanyStatus::Active->value);
    }

    /**
     * Scope a query to only include suspended companies.
     */
    public function scopeSuspended($query)
    {
        return $query->where('status', CompanyStatus::Suspended->value);
    }

    /**
     * Check if company is active.
     */
    public function isActive(): bool
    {
        return $this->status === CompanyStatus::Active;
    }

    /**
     * Check if company is suspended.
     */
    public function isSuspended(): bool
    {
        return $this->status === CompanyStatus::Suspended;
    }
}

