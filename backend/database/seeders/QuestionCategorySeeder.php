<?php

namespace Database\Seeders;

use App\Models\QuestionCategory;
use Illuminate\Database\Seeder;

class QuestionCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['world' => 1, 'name' => 'Addition', 'slug' => 'addition', 'order' => 1],
            ['world' => 1, 'name' => 'Subtraction', 'slug' => 'subtraction', 'order' => 2],
            ['world' => 2, 'name' => 'Multiplication', 'slug' => 'multiplication', 'order' => 3],
            ['world' => 3, 'name' => 'Division', 'slug' => 'division', 'order' => 4],
            ['world' => 4, 'name' => 'Fractions', 'slug' => 'fractions', 'order' => 5],
        ];

        foreach ($categories as $category) {
            QuestionCategory::firstOrCreate(['slug' => $category['slug']], $category);
        }
    }
}
