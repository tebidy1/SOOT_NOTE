<?php

namespace LaraCore\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

trait QueryFilterTrait
{
    /**
     * Apply filters to the query based on request parameters.
     *
     * @param Builder $query
     * @param Request $request
     * @param array $allowedFilters
     * @return Builder
     */
    protected function applyFilters(Builder $query, Request $request, array $allowedFilters = []): Builder
    {
        foreach ($request->all() as $key => $value) {
            if (in_array($key, $allowedFilters) && $value !== null && $value !== '') {
                $this->applyFilter($query, $key, $value);
            }
        }

        return $query;
    }

    /**
     * Apply a specific filter to the query.
     *
     * @param Builder $query
     * @param string $key
     * @param mixed $value
     * @return void
     */
    protected function applyFilter(Builder $query, string $key, $value): void
    {
        // Check if the filter is a relationship filter (e.g., user.name)
        if (Str::contains($key, '.')) {
            $this->applyRelationFilter($query, $key, $value);
            return;
        }

        // Check if the filter is a special filter
        $method = 'filter' . Str::studly($key);
        if (method_exists($this, $method)) {
            $this->$method($query, $value);
            return;
        }

        // Apply default filter
        $this->applyDefaultFilter($query, $key, $value);
    }

    /**
     * Apply a relation filter to the query.
     *
     * @param Builder $query
     * @param string $key
     * @param mixed $value
     * @return void
     */
    protected function applyRelationFilter(Builder $query, string $key, $value): void
    {
        [$relation, $field] = explode('.', $key, 2);

        $query->whereHas($relation, function ($q) use ($field, $value) {
            $this->applyDefaultFilter($q, $field, $value);
        });
    }

    /**
     * Apply a default filter to the query.
     *
     * @param Builder $query
     * @param string $key
     * @param mixed $value
     * @return void
     */
    protected function applyDefaultFilter(Builder $query, string $key, $value): void
    {
        if (is_array($value)) {
            $query->whereIn($key, $value);
        } elseif ($value === 'null') {
            $query->whereNull($key);
        } elseif ($value === 'not_null') {
            $query->whereNotNull($key);
        } elseif (Str::startsWith($value, 'like:')) {
            $query->where($key, 'like', '%' . substr($value, 5) . '%');
        } elseif (Str::startsWith($value, 'gt:')) {
            $query->where($key, '>', substr($value, 3));
        } elseif (Str::startsWith($value, 'lt:')) {
            $query->where($key, '<', substr($value, 3));
        } elseif (Str::startsWith($value, 'gte:')) {
            $query->where($key, '>=', substr($value, 4));
        } elseif (Str::startsWith($value, 'lte:')) {
            $query->where($key, '<=', substr($value, 4));
        } elseif (Str::startsWith($value, 'between:')) {
            $between = explode(',', substr($value, 8));
            if (count($between) === 2) {
                $query->whereBetween($key, $between);
            }
        } else {
            $query->where($key, $value);
        }
    }

    /**
     * Apply sorting to the query based on request parameters.
     *
     * @param Builder $query
     * @param Request $request
     * @param array $allowedSorts
     * @param string $defaultSort
     * @param string $defaultDirection
     * @return Builder
     */
    protected function applySorting(
        Builder $query,
        Request $request,
        array $allowedSorts = [],
        string $defaultSort = 'created_at',
        string $defaultDirection = 'desc'
    ): Builder {
        $sort = $request->input('sort', $defaultSort);
        $direction = $request->input('direction', $defaultDirection);

        // Validate sort field
        if (!in_array($sort, $allowedSorts) && $sort !== $defaultSort) {
            $sort = $defaultSort;
        }

        // Validate sort direction
        if (!in_array(strtolower($direction), ['asc', 'desc'])) {
            $direction = $defaultDirection;
        }

        // Check if the sort is a relationship sort (e.g., user.name)
        if (Str::contains($sort, '.')) {
            [$relation, $field] = explode('.', $sort, 2);

            // Join the related table and sort by the field
            $query->join(
                Str::plural($relation),
                Str::singular($relation) . '_id',
                '=',
                Str::plural($relation) . '.id'
            )->orderBy(Str::plural($relation) . '.' . $field, $direction);
        } else {
            $query->orderBy($sort, $direction);
        }

        return $query;
    }

    /**
     * Apply pagination to the query based on request parameters.
     *
     * @param Builder $query
     * @param Request $request
     * @param int $defaultPerPage
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
     */
    protected function applyPagination(Builder $query, Request $request, int $defaultPerPage = 15)
    {
        $perPage = (int) $request->input('per_page', $defaultPerPage);

        // Validate per_page
        if ($perPage < 1 || $perPage > 100) {
            $perPage = $defaultPerPage;
        }

        return $query->paginate($perPage);
    }

    /**
     * Apply search to the query based on request parameters.
     *
     * @param Builder $query
     * @param Request $request
     * @param array $searchableFields
     * @return Builder
     */
    protected function applySearch(Builder $query, Request $request, array $searchableFields = []): Builder
    {
        $search = $request->input('search');

        if ($search && !empty($searchableFields)) {
            $query->where(function ($q) use ($search, $searchableFields) {
                foreach ($searchableFields as $field) {
                    if (Str::contains($field, '.')) {
                        [$relation, $relationField] = explode('.', $field, 2);
                        $q->orWhereHas($relation, function ($subQuery) use ($relationField, $search) {
                            $subQuery->where($relationField, 'like', '%' . $search . '%');
                        });
                    } else {
                        $q->orWhere($field, 'like', '%' . $search . '%');
                    }
                }
            });
        }

        return $query;
    }
}
