<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DemoUsersSeeder extends Seeder
{
    /**
     * Crear o actualizar las cuentas de demostración.
     */
    public function run(): void
    {
        // Crear la cuenta de administrador.
        User::updateOrCreate(
            ['email' => 'admin@organizaplus.test'],
            [
                'name' => 'Administrador Demo',
                'password' => 'AdminOrganiza2026!',
                'role' => 'admin',
            ]
        );

        // Crear o actualizar la cuenta de usuario normal.
        User::updateOrCreate(
            ['email' => 'usuario@organizaplus.test'],
            [
                'name' => 'Usuario Demo',
                'password' => 'OrganizaDemo2026!',
                'role' => 'user',
            ]
        );
    }
}
