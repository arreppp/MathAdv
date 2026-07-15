<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Achievement extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'icon',
        'criteria_type',
        'criteria_value',
        'xp_reward',
    ];

    public function students(): BelongsToMany
    {
        return $this->belongsToMany(Student::class, 'student_achievement')
            ->withPivot('earned_at');
    }
}
