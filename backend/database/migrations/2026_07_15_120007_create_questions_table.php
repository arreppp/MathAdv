<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_category_id')->constrained()->cascadeOnDelete();
            $table->foreignId('game_level_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('type', ['multiple_choice', 'fill_blank', 'true_false', 'matching', 'drag_drop']);
            $table->enum('difficulty', ['easy', 'medium', 'hard'])->default('easy');
            $table->text('prompt');
            $table->json('options')->nullable();
            $table->json('correct_answer');
            $table->text('explanation')->nullable();
            $table->unsignedInteger('xp_value')->default(5);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('questions');
    }
};
