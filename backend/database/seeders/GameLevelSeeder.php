<?php

namespace Database\Seeders;

use App\Models\GameLevel;
use App\Models\QuestionCategory;
use Illuminate\Database\Seeder;

class GameLevelSeeder extends Seeder
{
    /**
     * World 1 (Basic Arithmetic) only. Worlds 2-4 will get their own levels
     * once Multiplication/Division/Fractions gameplay is built.
     */
    public function run(): void
    {
        $addition = QuestionCategory::where('slug', 'addition')->firstOrFail();
        $subtraction = QuestionCategory::where('slug', 'subtraction')->firstOrFail();

        $levels = [
            ['level_number' => 1, 'category' => $addition, 'name' => 'Addition Meadow', 'difficulty' => 'easy', 'xp_reward' => 20, 'unlock_xp_threshold' => 0],
            ['level_number' => 2, 'category' => $subtraction, 'name' => 'Subtraction Swamp', 'difficulty' => 'easy', 'xp_reward' => 20, 'unlock_xp_threshold' => 20],
            ['level_number' => 3, 'category' => $addition, 'name' => 'Addition Hills', 'difficulty' => 'medium', 'xp_reward' => 30, 'unlock_xp_threshold' => 40],
            ['level_number' => 4, 'category' => $subtraction, 'name' => 'Subtraction Caves', 'difficulty' => 'medium', 'xp_reward' => 30, 'unlock_xp_threshold' => 70],
            ['level_number' => 5, 'category' => $addition, 'name' => 'Arithmetic Summit', 'difficulty' => 'hard', 'xp_reward' => 50, 'unlock_xp_threshold' => 100],
        ];

        foreach ($levels as $level) {
            GameLevel::updateOrCreate(
                ['world' => 1, 'level_number' => $level['level_number']],
                [
                    'question_category_id' => $level['category']->id,
                    'name' => $level['name'],
                    'description' => "Solve {$level['category']->name} challenges to advance.",
                    'difficulty' => $level['difficulty'],
                    'xp_reward' => $level['xp_reward'],
                    'unlock_xp_threshold' => $level['unlock_xp_threshold'],
                ]
            );
        }
    }
}
