
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Crear la tabla de tareas.
     */
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();

            // Usuario propietario de la tarea.
            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            // Información principal.
            $table->string('title');
            $table->text('description')->nullable();

            // Estado de la tarea.
            $table->boolean('completed')->default(false);

            // Fotografía asociada.
            $table->string('image_path')->nullable();

            // Coordenadas GPS.
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();

            $table->timestamps();
        });
    }

    /**
     * Eliminar la tabla al revertir la migración.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
