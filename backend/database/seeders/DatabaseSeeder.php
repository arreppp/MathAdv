<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            QuestionCategorySeeder::class,
            GameLevelSeeder::class,
            QuestionSeeder::class,
            BadgeSeeder::class,
            AdminUserSeeder::class,
        ]);
    }
}
