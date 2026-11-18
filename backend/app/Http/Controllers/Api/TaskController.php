<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    /**
     * Listar las tareas del usuario autenticado.
     */
    public function index(Request $request)
    {
        $tareas = $request->user()
            ->tasks()
            ->latest()
            ->get();

        return response()->json([
            'message' => 'Tareas obtenidas correctamente.',
            'tasks' => $tareas,
        ]);
    }

    /**
     * Crear una tarea y guardar su fotografía.
     */
    public function store(Request $request)
    {
        $datos = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'completed' => 'sometimes|boolean',
            'image' => 'nullable|image|max:5120',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
        ]);

        // Guardar la fotografía en storage/app/public/tasks.
        if ($request->hasFile('image')) {
            $datos['image_path'] = $request->file('image')
                ->store('tasks', 'public');
        }

        unset($datos['image']);

        $tarea = $request->user()->tasks()->create($datos);

        return response()->json([
            'message' => 'Tarea creada correctamente.',
            'task' => $tarea,
        ], 201);
    }

    /**
     * Mostrar una tarea del usuario autenticado.
     */
    public function show(Request $request, string $id)
    {
        $tarea = $request->user()->tasks()->find($id);

        if (!$tarea) {
            return response()->json([
                'message' => 'Tarea no encontrada.',
            ], 404);
        }

        return response()->json([
            'task' => $tarea,
        ]);
    }

    /**
     * Actualizar una tarea existente.
     */
    public function update(Request $request, string $id)
    {
        $tarea = $request->user()->tasks()->find($id);

        if (!$tarea) {
            return response()->json([
                'message' => 'Tarea no encontrada.',
            ], 404);
        }

        $datos = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|nullable|string',
            'completed' => 'sometimes|boolean',
            'image_path' => 'sometimes|nullable|string|max:255',
            'latitude' => 'sometimes|nullable|numeric|between:-90,90',
            'longitude' => 'sometimes|nullable|numeric|between:-180,180',
        ]);

        $tarea->update($datos);

        return response()->json([
            'message' => 'Tarea actualizada correctamente.',
            'task' => $tarea->fresh(),
        ]);
    }

    /**
     * Eliminar una tarea.
     */
    public function destroy(Request $request, string $id)
    {
        $tarea = $request->user()->tasks()->find($id);

        if (!$tarea) {
            return response()->json([
                'message' => 'Tarea no encontrada.',
            ], 404);
        }

        $tarea->delete();

        return response()->json([
            'message' => 'Tarea eliminada correctamente.',
        ]);
    }
}
