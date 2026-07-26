<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Log;

trait Filterable
{
    /**
     * Apply filters to the query.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  array  $requestFilters
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeApplyFilters(Builder $query, array $requestFilters = []): Builder
    {
        if (empty($requestFilters)) {
            Log::info('No request filters to process');
            return $query;
        }

        Log::info('Processing request filters', $requestFilters);
        $tableName = $this->getTable();
        
        foreach ($requestFilters as $field => $value) {
            // Skip pagination parameters and empty values
            if ($this->shouldSkipFilter($field, $value)) {
                Log::debug('Skipping filter', ['field' => $field, 'value' => $value]);
                continue;
            }
            
            // Handle global search
            if ($field === 'search') {
                $query = $this->applyGlobalSearch($query, $tableName, $value);
                continue;
            }
            
            // Apply field-specific filters
            $query = $this->applyFieldFilter($query, $tableName, $field, $value);
        }
        
        return $query;
    }
    
    /**
     * Check if a filter should be skipped.
     *
     * @param  string  $field
     * @param  mixed  $value
     * @return bool
     */
    protected function shouldSkipFilter(string $field, $value): bool
    {
        return in_array($field, ['page', 'per_page', 'sort_by', 'sort_order']) || 
               $value === '' || 
               $value === null;
    }
    
    /**
     * Apply global search to the query.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  string  $tableName
     * @param  string  $searchTerm
     * @return \Illuminate\Database\Eloquent\Builder
     */
    protected function applyGlobalSearch(Builder $query, string $tableName, string $searchTerm): Builder
    {
        $query->where(function($q) use ($tableName, $searchTerm) {
            $columns = $this->getConnection()->getSchemaBuilder()->getColumnListing($tableName);
            $first = true;
            
            foreach ($columns as $column) {
                // Skip non-string columns for LIKE search
                $columnType = $this->getConnection()->getSchemaBuilder()->getColumnType($tableName, $column);
                if (!in_array($columnType, ['string', 'text', 'varchar', 'char'])) {
                    continue;
                }
                
                $method = $first ? 'where' : 'orWhere';
                $q->$method($column, 'LIKE', "%{$searchTerm}%");
                $first = false;
            }
        });
        
        Log::info('Applied global search', ['search_term' => $searchTerm]);
        return $query;
    }
    
    /**
     * Apply field-specific filter to the query.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  string  $tableName
     * @param  string  $field
     * @param  mixed  $value
     * @return \Illuminate\Database\Eloquent\Builder
     */
    protected function applyFieldFilter(Builder $query, string $tableName, string $field, $value): Builder
    {
        $columns = $this->getConnection()->getSchemaBuilder()->getColumnListing($tableName);
        
        // Check if the field exists in the database table
        if (in_array($field, $columns) || $field === 'id') {
            // Handle special cases for specific fields
            if ($field === 'driver_id' && $value === 'unassigned') {
                $query->whereNull('driver_id')->orWhere('driver_id', '');
                Log::info('Applied unassigned driver filter');
            } else {
                $query->where($field, $value);
                Log::info('Applied filter', [
                    'field' => $field, 
                    'value' => $value,
                    'query' => $query->toSql(),
                    'bindings' => $query->getBindings()
                ]);
            }
        } else {
            Log::warning('Attempted to filter by non-existent field', [
                'field' => $field,
                'value' => $value,
                'available_fields' => $columns
            ]);
        }
        
        return $query;
    }
}
