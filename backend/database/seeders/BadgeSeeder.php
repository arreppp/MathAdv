<?php

namespace Database\Seeders;

use App\Models\Badge;
use Illuminate\Database\Seeder;

class BadgeSeeder extends Seeder
{
    public function run(): void
    {
        $badges = [
            ['name' => 'First Steps', 'slug' => 'first-steps', 'description' => 'Complete your very first level.', 'icon' => 'footprints', 'rarity' => 'common'],
            ['name' => 'Addition Ace', 'slug' => 'addition-ace', 'description' => 'Master every Addition level.', 'icon' => 'plus-circle', 'rarity' => 'rare'],
            ['name' => 'Subtraction Star', 'slug' => 'subtraction-star', 'description' => 'Master every Subtraction level.', 'icon' => 'minus-circle', 'rarity' => 'rare'],
            ['name' => 'Perfect Score', 'slug' => 'perfect-score', 'description' => 'Answer every question in a level correctly.', 'icon' => 'star', 'rarity' => 'epic'],
            ['name' => 'World 1 Champion', 'slug' => 'world-1-champion', 'description' => 'Complete every level in Basic Arithmetic.', 'icon' => 'trophy', 'rarity' => 'legendary'],
        ];

        foreach ($badges as $badge) {
            Badge::firstOrCreate(['slug' => $badge['slug']], $badge);
        }
    }
}
