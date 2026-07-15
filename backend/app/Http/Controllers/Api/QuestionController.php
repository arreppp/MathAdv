<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\QuestionResource;
use App\Models\ActivityLog;
use App\Models\GameLevel;
use App\Models\Question;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuestionController extends Controller
{
    private const TIERS = ['easy', 'medium', 'hard'];

    /**
     * Picks the next question for a level, adapting difficulty to the
     * student's rolling accuracy in that level's category over their last
     * 5 answers: >=80% bumps a tier up, <=40% drops a tier down.
     */
    public function next(Request $request, GameLevel $level): JsonResponse
    {
        $student = $request->user()->student;
        $category = $level->category;

        $recentAnswers = ActivityLog::where('student_id', $student->id)
            ->where('type', 'question_answered')
            ->latest()
            ->limit(20)
            ->get()
            ->filter(fn (ActivityLog $log) => ($log->metadata['category_id'] ?? null) === $category->id)
            ->take(5);

        $difficulty = $level->difficulty;

        if ($recentAnswers->isNotEmpty()) {
            $accuracy = $recentAnswers->avg(fn (ActivityLog $log) => $log->metadata['correct'] ? 1 : 0);
            $tierIndex = array_search($difficulty, self::TIERS, true);

            if ($accuracy >= 0.8) {
                $tierIndex = min($tierIndex + 1, count(self::TIERS) - 1);
            } elseif ($accuracy <= 0.4) {
                $tierIndex = max($tierIndex - 1, 0);
            }

            $difficulty = self::TIERS[$tierIndex];
        }

        $excludeId = $request->integer('exclude');

        $question = Question::where('question_category_id', $category->id)
            ->where('difficulty', $difficulty)
            ->when($excludeId, fn ($query) => $query->where('id', '!=', $excludeId))
            ->inRandomOrder()
            ->first()
            ?? Question::where('question_category_id', $category->id)
                ->when($excludeId, fn ($query) => $query->where('id', '!=', $excludeId))
                ->inRandomOrder()
                ->first();

        if (! $question) {
            return response()->json(['message' => 'No questions available for this level yet.'], 404);
        }

        return response()->json([
            'question' => new QuestionResource($question),
        ]);
    }
}
