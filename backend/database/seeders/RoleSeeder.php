<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        foreach (['student', 'teacher', 'admin'] as $name) {
            Role::firstOrCreate(['name' => $name]);
        }
    }
}
