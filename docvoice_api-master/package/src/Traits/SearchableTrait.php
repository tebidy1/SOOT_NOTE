<?php

namespace LaraCore\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

trait SearchableTrait
{
    /**
     * Apply search to the query.
     */
    protected function applySearch(Builder $query, Request $request): void
    {
        if (empty($this->searchableFields) || !$request->has('search')) {
            return;
        }

        $searchTerm = $request->get('search');
        
        if (empty($searchTerm)) {
            return;
        }

        $query->where(function (Builder $query) use ($searchTerm) {
            foreach ($this->searchableFields as $field) {
                $query->orWhere($field, 'LIKE', "%{$searchTerm}%");
            }
        });
    }

    /**
     * Set searchable fields.
     */
    protected function setSearchableFields(array $fields): void
    {
        $this->searchableFields = $fields;
    }

    /**
     * Get searchable fields.
     */
    protected function getSearchableFields(): array
    {
        return $this->searchableFields;
    }
}
