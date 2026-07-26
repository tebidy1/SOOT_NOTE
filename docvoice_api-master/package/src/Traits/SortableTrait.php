<?php

namespace LaraCore\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

trait SortableTrait
{
    /**
     * Apply sorting to the query.
     */
    protected function applySorting(Builder $query, Request $request): void
    {
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');

        // Validate sort order
        if (!in_array(strtolower($sortOrder), ['asc', 'desc'])) {
            $sortOrder = 'desc';
        }

        // Check if the field is allowed to be sorted
        if ($this->isSortableField($sortBy)) {
            $query->orderBy($sortBy, $sortOrder);
        } else {
            $query->orderBy('created_at', 'desc');
        }
    }

    /**
     * Check if a field is allowed to be sorted.
     */
    protected function isSortableField(string $field): bool
    {
        $sortableFields = $this->getSortableFields();
        
        return empty($sortableFields) || in_array($field, $sortableFields);
    }

    /**
     * Get sortable fields.
     */
    protected function getSortableFields(): array
    {
        return $this->sortableFields ?? [];
    }

    /**
     * Set sortable fields.
     */
    protected function setSortableFields(array $fields): void
    {
        $this->sortableFields = $fields;
    }
}
