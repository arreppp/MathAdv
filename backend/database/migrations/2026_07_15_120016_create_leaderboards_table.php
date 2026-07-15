<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leaderboards', function (Blueprint $table) {
            $table->id();
            $table->enum('scope', ['global', 'class', 'weekly']);
            $table->foreignId('class_id')->nullable()->constrained('classes')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->date('period_start')->nullable();
            $table->date('period_end')->nullable();
            $table->unsignedInteger('xp');
            $table->unsignedInteger('rank');
            $table->timestamps();

            $table->index(['scope', 'class_id', 'period_start']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leaderboards');
    }
};
