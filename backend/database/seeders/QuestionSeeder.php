<?php

namespace Database\Seeders;

use App\Models\GameLevel;
use App\Models\Question;
use Illuminate\Database\Seeder;

class QuestionSeeder extends Seeder
{
    private const RANGES = [
        'easy' => [1, 10],
        'medium' => [10, 50],
        'hard' => [50, 200],
    ];

    /**
     * World 1 (Addition/Subtraction) only, matching the levels from GameLevelSeeder.
     */
    public function run(): void
    {
        $levels = GameLevel::where('world', 1)->with('category')->get();

        foreach ($levels as $level) {
            $operation = $level->category->slug === 'subtraction' ? 'subtract' : 'add';
            [$min, $max] = self::RANGES[$level->difficulty];

            Question::where('game_level_id', $level->id)->delete();

            foreach (range(1, 3) as $i) {
                $this->createQuestion($level, $operation, $min, $max, 'multiple_choice');
            }

            foreach (range(1, 2) as $i) {
                $this->createQuestion($level, $operation, $min, $max, 'fill_blank');
            }

            $this->createQuestion($level, $operation, $min, $max, 'true_false');
        }
    }

    private function createQuestion(GameLevel $level, string $operation, int $min, int $max, string $type): void
    {
        $a = random_int($min, $max);
        $b = random_int($min, $max);

        if ($operation === 'subtract' && $b > $a) {
            [$a, $b] = [$b, $a];
        }

        $symbol = $operation === 'add' ? '+' : '-';
        $answer = $operation === 'add' ? $a + $b : $a - $b;

        $xpByDifficulty = ['easy' => 5, 'medium' => 8, 'hard' => 12];

        $payload = [
            'question_category_id' => $level->question_category_id,
            'game_level_id' => $level->id,
            'type' => $type,
            'difficulty' => $level->difficulty,
            'xp_value' => $xpByDifficulty[$level->difficulty],
        ];

        match ($type) {
            'multiple_choice' => $this->fillMultipleChoice($payload, $a, $symbol, $b, $answer),
            'fill_blank' => $this->fillFillBlank($payload, $a, $symbol, $b, $answer),
            'true_false' => $this->fillTrueFalse($payload, $a, $symbol, $b, $answer),
        };

        Question::create($payload);
    }

    private function fillMultipleChoice(array &$payload, int $a, string $symbol, int $b, int $answer): void
    {
        $distractors = collect([$answer + random_int(1, 5), max(0, $answer - random_int(1, 5)), $answer + random_int(6, 10)])
            ->unique()
            ->reject(fn ($v) => $v === $answer)
            ->take(3)
            ->values();

        $options = $distractors->push($answer)->shuffle()->map(fn ($v) => (string) $v)->values()->all();

        $payload['prompt'] = "What is {$a} {$symbol} {$b}?";
        $payload['options'] = $options;
        $payload['correct_answer'] = (string) $answer;
        $payload['explanation'] = "{$a} {$symbol} {$b} = {$answer}";
    }

    private function fillFillBlank(array &$payload, int $a, string $symbol, int $b, int $answer): void
    {
        $payload['prompt'] = "{$a} {$symbol} {$b} = ?";
        $payload['options'] = null;
        $payload['correct_answer'] = (string) $answer;
        $payload['explanation'] = "{$a} {$symbol} {$b} = {$answer}";
    }

    private function fillTrueFalse(array &$payload, int $a, string $symbol, int $b, int $answer): void
    {
        $isTrueStatement = random_int(0, 1) === 1;
        $shownAnswer = $isTrueStatement ? $answer : $answer + random_int(1, 4);

        $payload['prompt'] = "True or false: {$a} {$symbol} {$b} = {$shownAnswer}";
        $payload['options'] = ['true', 'false'];
        $payload['correct_answer'] = $isTrueStatement ? 'true' : 'false';
        $payload['explanation'] = "{$a} {$symbol} {$b} = {$answer}";
    }
}
