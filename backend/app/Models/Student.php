<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Student extends Model
{
    protected $fillable = ['user_id', 'class_id', 'date_of_birth', 'xp', 'level'];

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function classRoom(): BelongsTo
    {
        return $this->belongsTo(ClassRoom::class, 'class_id');
    }

    public function progress(): HasMany
    {
        return $this->hasMany(PlayerProgress::class);
    }

    public function gameSessions(): HasMany
    {
        return $this->hasMany(GameSession::class);
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }

    public function achievements(): BelongsToMany
    {
        return $this->belongsToMany(Achievement::class, 'student_achievement')
            ->withPivot('earned_at');
    }

    public function badges(): BelongsToMany
    {
        return $this->belongsToMany(Badge::class, 'student_badge')
            ->withPivot('earned_at');
    }

    public function rewards(): BelongsToMany
    {
        return $this->belongsToMany(Reward::class, 'student_reward')
            ->withPivot('claimed_at');
    }

    /**
     * Levels run 1-100 on a flat 100xp-per-level curve.
     */
    public function addXp(int $amount): void
    {
        $this->xp += $amount;
        $this->level = min(100, intdiv($this->xp, 100) + 1);
        $this->save();
    }
}
