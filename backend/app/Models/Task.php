<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Task extends Model
{
    /**
     * Campos que se pueden asignar masivamente.
     */
    protected $fillable = [
        'user_id',
        'title',
        'description',
        'completed',
        'image_path',
        'latitude',
        'longitude',
    ];

    /**
     * Conversiones de los atributos.
     */
    protected function casts(): array
    {
        return [
            'completed' => 'boolean',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
        ];
    }

    /**
     * Cada tarea pertenece a un usuario.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
