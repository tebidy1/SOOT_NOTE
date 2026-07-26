<?php

declare(strict_types=1);

namespace LaraCore\Http\Controllers;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use LaraCore\Http\Requests\BaseRequest;
use LaraCore\Models\BaseModel;
use LaraCore\Traits\ControllerOperationsTrait;

class BaseControllerTemplate extends BaseController
{
    use ControllerOperationsTrait;

    /**
     * Configuration for the controller
     *
     * This should be overridden in child controllers
     */
    public const CONFIG = [
        'search_fields' => [],           // Fields to search in
        'default_relations' => [],       // Default relationships to load
        'model_class' => BaseModel::class,     // Model class
        'request_class' => BaseRequest::class, // Request class
    ];

    /**
     * Process data and files for the entity
     *
     * @param array<string, mixed> $data
     * @param BaseModel|null $entity
     * @param Request|null $request
     * @return BaseModel
     */
    protected function attach(array $data, ?BaseModel $entity = null, ?Request $request = null): BaseModel
    {
        if (is_null($entity)) {
            $modelClass = static::CONFIG['model_class'];
            $entity = new $modelClass();
        }

        // Fill basic data
        $entity->fill($data);

        // Add current user ID if not present
        if (!$entity->user_id && auth()->check()) {
            $entity->user_id = auth()->id();
        }

        // Save the model
        $entity->save();

        // Process file uploads if any
        if ($request && $request->hasFile('avatar')) {
            // Use FileHandlerTrait if available
            // $this->uploadFile($request->file('avatar'), $entity, 'avatar');
        }

        // Process relationships
        // Add relationship processing logic here based on your needs

        // Load relationships for response
        if (!empty(static::CONFIG['default_relations'])) {
            $entity->load(static::CONFIG['default_relations']);
        }

        return $entity;
    }
}
