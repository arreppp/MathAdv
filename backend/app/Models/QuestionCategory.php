<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuestionCategory extends Model
{
    protected $fillable = ['world', 'name', 'slug', 'description', 'order'];

    public function gameLevels(): HasMany
    {
        return $this->hasMany(GameLevel::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class);
    }
}
