<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlayerProgress extends Model
{
    protected $table = 'player_progress';

    /**
     * Mirrors the DB column defaults so a freshly created-in-PHP instance
     * (e.g. via firstOrCreate with a partial attribute list) doesn't carry
     * null in memory for columns the DB would default to 0.
     */
    protected $attributes = [
        'status' => 'locked',
        'stars' => 0,
        'best_score' => 0,
        'attempts' => 0,
    ];

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
