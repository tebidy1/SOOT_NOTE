<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\MedicalDepartment;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'users';

    /**
     * البيانات القابلة للحفظ
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'company_id',
        'role',
        'status',
        'phone',
        'avatar',
        'profile_image_url',
        'last_login_at',
        'last_seen',
        'is_online',
        'settings',
        'medical_department_id',
    ];

    /**
     * تحويل الأنواع
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'last_login_at' => 'datetime',
        'last_seen' => 'datetime',
        'is_online' => 'boolean',
        'role' => UserRole::class,
        'status' => UserStatus::class,
        'settings' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * القيم الافتراضية
     */
    protected $attributes = [
        'role' => 'member',
        'status' => 'active',
    ];

    /**
     * الحقول المخفية
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * علاقة الشركة التي ينتمي إليها المستخدم
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    /**
     * علاقة القسم الطبي للمستخدم
     */
    public function medicalDepartment(): BelongsTo
    {
        return $this->belongsTo(MedicalDepartment::class, 'medical_department_id');
    }

    /**
     * علاقة مساحات العمل التي أنشأها المستخدم
     */
    public function createdWorkspaces(): HasMany
    {
        return $this->hasMany(Workspace::class, 'created_by');
    }

    /**
     * علاقة مساحات العمل التي يشارك فيها المستخدم
     */
    public function workspaces(): BelongsToMany
    {
        return $this->belongsToMany(Workspace::class, 'workspace_members', 'user_id', 'workspace_id')
            ->withPivot(['role', 'joined_at'])
            ->withTimestamps();
    }

    /**
     * العلاقة مع WorkspaceMember Model
     */
    public function workspaceMembers(): HasMany
    {
        return $this->hasMany(WorkspaceMember::class);
    }

    /**
     * علاقة القنوات التي أنشأها المستخدم
     */
    public function createdChannels(): HasMany
    {
        return $this->hasMany(Channel::class, 'created_by');
    }

    /**
     * علاقة القنوات التي يشارك فيها المستخدم
     */
    public function channels(): BelongsToMany
    {
        return $this->belongsToMany(Channel::class, 'channel_members', 'user_id', 'channel_id')
            ->withPivot(['added_by', 'joined_at'])
            ->withTimestamps();
    }

    /**
     * علاقة أعضاء القنوات
     */
    public function channelMembers(): HasMany
    {
        return $this->hasMany(ChannelMember::class, 'user_id');
    }

    /**
     * علاقة الرسائل التي أرسلها المستخدم
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class, 'user_id');
    }

    /**
     * علاقة المهام التي أنشأها المستخدم
     */
    public function createdTasks(): HasMany
    {
        return $this->hasMany(Task::class, 'created_by');
    }

    /**
     * علاقة المهام المعينة للمستخدم
     */
    public function assignedTasks(): BelongsToMany
    {
        return $this->belongsToMany(Task::class, 'task_assignees', 'user_id', 'task_id')
            ->withPivot(['assigned_at', 'assigned_by'])
            ->withTimestamps();
    }

    /**
     * علاقة الخطط التي أنشأها المستخدم
     */
    public function createdPlans(): HasMany
    {
        return $this->hasMany(Plan::class, 'created_by');
    }

    /**
     * علاقة الرسائل المفضلة
     */
    public function favoriteMessages(): BelongsToMany
    {
        return $this->belongsToMany(Message::class, 'message_favorites', 'user_id', 'message_id')
            ->withTimestamps();
    }



    /**
     * علاقة الرسائل المباشرة المرسلة
     */
    public function sentDirectMessages(): HasMany
    {
        return $this->hasMany(DirectMessage::class, 'from_user_id');
    }

    /**
     * علاقة الرسائل المباشرة المستقبلة
     */
    public function receivedDirectMessages(): HasMany
    {
        return $this->hasMany(DirectMessage::class, 'to_user_id');
    }

    /**
     * علاقة الرسائل المفضلة
     */
    public function messageFavorites(): HasMany
    {
        return $this->hasMany(MessageFavorite::class, 'user_id');
    }

    /**
     * علاقة التفاعلات
     */
    public function messageReactions(): HasMany
    {
        return $this->hasMany(MessageReaction::class, 'user_id')
            ->withoutGlobalScopes();
    }

    /**
     * علاقة الإشارات
     */
    public function messageMentions(): HasMany
    {
        return $this->hasMany(MessageMention::class, 'user_id');
    }

    // Laravel's Notifiable trait provides notifications() and unreadNotifications() automatically

    /**
     * علاقة المخططات التي أنشأها
     */
    public function createdDrawings(): HasMany
    {
        return $this->hasMany(Drawing::class, 'created_by');
    }

    /**
     * علاقة التذاكر التي أنشأها
     */
    public function createdTickets(): HasMany
    {
        return $this->hasMany(Ticket::class, 'created_by');
    }

    /**
     * علاقة التذاكر المعينة له
     */
    public function assignedTickets(): HasMany
    {
        return $this->hasMany(Ticket::class, 'assigned_to');
    }

    /**
     * علاقة المشاريع التي أنشأها
     */
    public function createdProjects(): HasMany
    {
        return $this->hasMany(Project::class, 'created_by');
    }

    /**
     * علاقة Push Subscriptions
     */
    public function pushSubscriptions(): HasMany
    {
        return $this->hasMany(PushSubscription::class, 'user_id');
    }

    /**
     * احصل على عدد مساحات العمل
     */
    public function getWorkspacesCountAttribute(): int
    {
        return $this->workspaces()->count();
    }

    /**
     * احصل على عدد المهام المعينة
     */
    public function getAssignedTasksCountAttribute(): int
    {
        return $this->assignedTasks()->count();
    }

    /**
     * احصل على عدد المهام المكتملة
     */
    public function getCompletedTasksCountAttribute(): int
    {
        return $this->assignedTasks()->where('completed', true)->count();
    }

    /**
     * تحقق من كون المستخدم متصل
     */
    public function getOnlineAttribute(): bool
    {
        if (!$this->last_login_at) {
            return false;
        }

        // يعتبر المستخدم متصل إذا سجل دخول خلال آخر 15 دقيقة
        return $this->last_login_at->diffInMinutes(now()) <= 15;
    }

    /**
     * احصل على تاريخ الانضمام المنسق
     */
    public function getJoinDateAttribute(): ?string
    {
        return $this->created_at ? $this->created_at->format('Y-m-d') : null;
    }

    /**
     * نطاق للمستخدمين النشطين
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * نطاق للمستخدمين غير النشطين
     */
    public function scopeInactive($query)
    {
        return $query->where('status', 'inactive');
    }

    /**
     * نطاق للمديرين
     */
    public function scopeAdmins($query)
    {
        return $query->where('role', 'admin');
    }

    /**
     * نطاق للمستخدمين العاديين
     */
    public function scopeUsers($query)
    {
        return $query->where('role', 'member');
    }

    /**
     * نطاق للمستخدمين المتصلين
     */
    public function scopeOnline($query)
    {
        return $query->where('last_login_at', '>=', now()->subMinutes(15));
    }

    /**
     * Scope for users in a specific company
     */
    public function scopeForCompany($query, int $companyId)
    {
        return $query->where('company_id', $companyId);
    }

    /**
     * Get the macros favorited by this user.
     */
    public function favoriteMacros(): BelongsToMany
    {
        return $this->belongsToMany(Macro::class, 'user_macro_favorites')
            ->withTimestamps();
    }
}
