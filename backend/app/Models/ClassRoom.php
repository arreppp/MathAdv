<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Maps to the `classes` table. Named ClassRoom because `Class` is a reserved word in PHP.
 */
class ClassRoom extends Model
{
    protected $table = 'classes';

    protected $fillable = ['teacher_id', 'name', 'join_code', 'grade_level'];

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class, 'class_id');
    }
}
