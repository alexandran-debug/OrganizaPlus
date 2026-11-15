<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TaskController;

// Rutas públicas de autenticación.
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Rutas protegidas: requieren un token válido.
Route::middleware('auth:sanctum')->group(function () {

    // Autenticación.
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // CRUD de tareas.
    Route::apiResource('tasks', TaskController::class);

});
