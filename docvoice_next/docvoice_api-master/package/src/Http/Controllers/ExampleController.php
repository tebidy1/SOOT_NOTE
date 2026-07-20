<?php

declare(strict_types=1);

namespace LaraCore\Http\Controllers;

use Illuminate\Http\Request;
use LaraCore\Models\BaseModel;
use LaraCore\Models\ExampleModel;
use LaraCore\Http\Requests\ExampleRequest;

class ExampleController extends BaseControllerTemplate
{
    public const CONFIG = [
        'search_fields' => ['name', 'description'],
        'default_relations' => ['user'],
        'model_class' => ExampleModel::class,
        'request_class' => ExampleRequest::class,
    ];

    /**
     * Process data and files for the entity
     *
     * @param array<string, mixed> $data
     * @param ExampleModel|null $entity
     * @param Request|null $request
     * @return ExampleModel
     */
    protected function attach(array $data, ?BaseModel $entity = null, ?Request $request = null): BaseModel
    {
        if (is_null($entity)) {
            $entity = new ExampleModel();
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

        // Load relationships for response
        if (!empty(static::CONFIG['default_relations'])) {
            $entity->load(static::CONFIG['default_relations']);
        }

        return $entity;
    }
}
