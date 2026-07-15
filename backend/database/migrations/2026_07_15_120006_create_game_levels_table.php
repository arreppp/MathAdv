<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_levels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_category_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('world');
            $table->unsignedInteger('level_number');
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('difficulty', ['easy', 'medium', 'hard'])->default('easy');
            $table->unsignedInteger('xp_reward')->default(10);
            $table->unsignedInteger('unlock_xp_threshold')->default(0);
            $table->timestamps();

            $table->unique(['world', 'level_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_levels');
    }
};
