<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Reward extends Model
{
    protected $fillable = ['name', 'description', 'type', 'icon', 'xp_value', 'item_data'];

    protected function casts(): array
    {
        return [
            'item_data' => 'array',
        ];
    }

    public function students(): BelongsToMany
    {
        return $this->belongsToMany(Student::class, 'student_reward')
            ->withPivot('claimed_at');
    }
}
