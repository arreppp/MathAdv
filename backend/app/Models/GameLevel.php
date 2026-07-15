<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GameLevel extends Model
{
    protected $fillable = [
        'question_category_id',
        'world',
        'level_number',
        'name',
        'description',
        'difficulty',
        'xp_reward',
        'unlock_xp_threshold',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(QuestionCategory::class, 'question_category_id');
    }

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class);
    }

    public function progress(): HasMany
    {
        return $this->hasMany(PlayerProgress::class);
    }

    public function gameSessions(): HasMany
    {
        return $this->hasMany(GameSession::class);
    }
}
