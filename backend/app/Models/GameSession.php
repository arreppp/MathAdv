<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GameSession extends Model
{
    protected $fillable = [
        'student_id',
        'game_level_id',
        'started_at',
        'ended_at',
        'questions_answered',
        'correct_answers',
        'xp_earned',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function gameLevel(): BelongsTo
    {
        return $this->belongsTo(GameLevel::class);
    }
}
