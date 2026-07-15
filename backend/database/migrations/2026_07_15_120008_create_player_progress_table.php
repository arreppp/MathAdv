<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('player_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('game_level_id')->constrained()->cascadeOnDelete();
            $table->enum('status', ['locked', 'unlocked', 'in_progress', 'completed'])->default('locked');
            $table->unsignedTinyInteger('stars')->default(0);
            $table->unsignedInteger('best_score')->default(0);
            $table->unsignedInteger('attempts')->default(0);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['student_id', 'game_level_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('player_progress');
    }
};
