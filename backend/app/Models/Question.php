<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Question extends Model
{
    protected $fillable = [
        'question_category_id',
        'game_level_id',
        'type',
        'difficulty',
        'prompt',
        'options',
        'correct_answer',
        'explanation',
        'xp_value',
    ];

    protected function casts(): array
    {
        return [
            'options' => 'array',
            'correct_answer' => 'array',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(QuestionCategory::class, 'question_category_id');
    }

    public function gameLevel(): BelongsTo
    {
        return $this->belongsTo(GameLevel::class);
    }

    /**
     * Compares a submitted answer against correct_answer. Both are normalized
     * to strings for scalar answers (MCQ/fill-blank/true-false); array-shaped
     * answers (matching/drag-drop) are compared as sorted arrays.
     */
    public function isCorrect(mixed $submitted): bool
    {
        $correct = $this->correct_answer;

        if (is_array($correct) && count($correct) === 1 && array_key_exists(0, $correct)) {
            $correct = $correct[0];
        }

        if (is_array($correct) || is_array($submitted)) {
            $normalize = fn ($value) => collect((array) $value)->map(fn ($v) => (string) $v)->sort()->values()->all();

            return $normalize($correct) === $normalize($submitted);
        }

        return mb_strtolower(trim((string) $correct)) === mb_strtolower(trim((string) $submitted));
    }
}
