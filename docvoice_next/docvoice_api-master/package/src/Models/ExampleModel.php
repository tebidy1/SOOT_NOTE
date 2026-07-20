<?php

namespace LaraCore\Models;

class ExampleModel extends BaseModelTemplate
{
    /**
     * The attributes that aren't mass assignable.
     *
     * @var array<int, string>
     */
    protected $guarded = [
        'id',
        'created_at',
        'updated_at',
        // Add any other fields that should never be mass assigned
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Define relationships
    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }
}
