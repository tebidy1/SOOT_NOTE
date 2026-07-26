<?php

namespace LaraCore\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

trait FilterableTrait
{
    /**
     * Apply filters to the query.
     */
    protected function applyFilters(Builder $query, Request $request): void
    {
        if (empty($this->filterableFields)) {
            return;
        }

        foreach ($this->filterableFields as $field) {
            if ($request->has($field) && $request->get($field) !== null) {
                $value = $request->get($field);
                
                if (is_array($value)) {
                    $query->whereIn($field, $value);
                } else {
                    $query->where($field, $value);
                }
            }
        }
    }

    /**
     * Set filterable fields.
     */
    protected function setFilterableFields(array $fields): void
    {
        $this->filterableFields = $fields;
    }

    /**
     * Get filterable fields.
     */
    protected function getFilterableFields(): array
    {
        return $this->filterableFields;
    }
}
