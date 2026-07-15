<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlayerProgress extends Model
{
    protected $table = 'player_progress';

    protected $fillable = [
        'student_id',
        'game_level_id',
        'status',
        'stars',
        'best_score',
        'attempts',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'completed_at' => 'datetime',
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
