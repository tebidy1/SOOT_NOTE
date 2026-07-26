<?php

namespace LaraCore\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

trait CompanyScopedTrait
{
    /**
     * Boot the trait and apply global scope.
     */
    protected static function bootCompanyScopedTrait(): void
    {
        static::addGlobalScope('company', function (Builder $builder) {
            $companyId = static::getCurrentCompanyId();

            if ($companyId !== null) {
                $builder->where('company_id', $companyId);
            }
        });

        // Automatically set company_id when creating new models
        static::creating(function (Model $model) {
            if (empty($model->company_id)) {
                $companyId = static::getCurrentCompanyId();
                if ($companyId !== null) {
                    $model->company_id = $companyId;
                }
            }
        });
    }

    /**
     * Get the current company ID from authenticated user or session.
     */
    protected static function getCurrentCompanyId(): ?int
    {
        // Try to get from authenticated user first
        if (Auth::check() && Auth::user()->company_id) {
            return Auth::user()->company_id;
        }




        return null;
    }

    /**
     * Scope a query to only include records for a specific company.
     */
    public function scopeForCompany(Builder $query, int $companyId): Builder
    {
        return $query->where('company_id', $companyId);
    }

    /**
     * Scope a query to only include records for the current company.
     */
    public function scopeForCurrentCompany(Builder $query): Builder
    {
        $companyId = static::getCurrentCompanyId();

        if ($companyId === null) {
            return $query->whereRaw('1 = 0'); // Return empty result if no company
        }

        return $query->where('company_id', $companyId);
    }

    /**
     * Scope a query to include records from all companies (bypass global scope).
     */
    public function scopeAllCompanies(Builder $query): Builder
    {
        return $query->withoutGlobalScope('company');
    }

    /**
     * Check if the model belongs to the current company.
     */
    public function belongsToCurrentCompany(): bool
    {
        $currentCompanyId = static::getCurrentCompanyId();

        return $currentCompanyId !== null && $this->company_id === $currentCompanyId;
    }

    /**
     * Check if the model belongs to a specific company.
     */
    public function belongsToCompany(int $companyId): bool
    {
        return $this->company_id === $companyId;
    }

    /**
     * Get the company relationship.
     */
    public function company()
    {
        return $this->belongsTo(\App\Models\Company::class);
    }

    /**
     * Set the current company for the session.
     */
    public static function setCurrentCompany(int $companyId): void
    {
        session(['current_company_id' => $companyId]);
    }

    /**
     * Clear the current company from the session.
     */
    public static function clearCurrentCompany(): void
    {
        session()->forget('current_company_id');
    }

    /**
     * Get the current company ID.
     */
    public static function getCurrentCompany(): ?int
    {
        return static::getCurrentCompanyId();
    }
}
