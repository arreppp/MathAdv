<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\GameLevel;
use App\Models\GameSession;
use App\Models\PlayerProgress;
use App\Models\Question;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProgressController extends Controller
{
    /**
     * Number of correct answers within a session needed to complete a level.
     */
    private const LEVEL_REQUIRED_CORRECT = 5;

    public function summary(Request $request): JsonResponse
    {
        $student = $request->user()->student;

        $recentActivity = ActivityLog::where('student_id', $student->id)
            ->latest()
            ->limit(10)
            ->get(['type', 'description', 'metadata', 'created_at']);

        return response()->json([
            'student' => ['xp' => $student->xp, 'level' => $student->level],
            'levels_completed' => PlayerProgress::where('student_id', $student->id)->where('status', 'completed')->count(),
            'recent_activity' => $recentActivity,
        ]);
    }

    public function submitAnswer(Request $request, GameLevel $level): JsonResponse
    {
        $data = $request->validate([
            'question_id' => ['required', 'integer', 'exists:questions,id'],
            'answer' => ['required'],
        ]);

        $student = $request->user()->student;
        $question = Question::findOrFail($data['question_id']);

        $isCorrect = $question->isCorrect($data['answer']);
        $xpAwarded = $isCorrect ? $question->xp_value : 0;

        $session = GameSession::where('student_id', $student->id)
            ->where('game_level_id', $level->id)
            ->whereNull('ended_at')
            ->latest('started_at')
            ->first();

        if (! $session) {
            $session = GameSession::create([
                'student_id' => $student->id,
                'game_level_id' => $level->id,
                'started_at' => now(),
            ]);
        }

        $session->increment('questions_answered');
        if ($isCorrect) {
            $session->increment('correct_answers');
            $session->increment('xp_earned', $xpAwarded);
        }

        ActivityLog::create([
            'user_id' => $request->user()->id,
            'student_id' => $student->id,
            'type' => 'question_answered',
            'description' => $isCorrect
                ? "Answered a {$level->category->name} question correctly"
                : "Missed a {$level->category->name} question",
            'metadata' => [
                'question_id' => $question->id,
                'category_id' => $question->question_category_id,
                'game_level_id' => $level->id,
                'correct' => $isCorrect,
                'difficulty' => $question->difficulty,
            ],
        ]);

        $progress = PlayerProgress::firstOrCreate(
            ['student_id' => $student->id, 'game_level_id' => $level->id],
            ['status' => 'in_progress']
        );

        $progress->attempts += 1;
        if (in_array($progress->status, ['locked', 'unlocked'], true)) {
            $progress->status = 'in_progress';
        }

        $levelJustCompleted = false;

        if ($isCorrect && $session->correct_answers >= self::LEVEL_REQUIRED_CORRECT && $progress->status !== 'completed') {
            $progress->status = 'completed';
            $progress->completed_at = now();
            $levelJustCompleted = true;

            $accuracy = $session->correct_answers / max(1, $session->questions_answered);
            $progress->stars = $accuracy >= 0.9 ? 3 : ($accuracy >= 0.7 ? 2 : 1);

            $xpAwarded += $level->xp_reward;
            $session->increment('xp_earned', $level->xp_reward);
            $session->update(['ended_at' => now()]);

            ActivityLog::create([
                'user_id' => $request->user()->id,
                'student_id' => $student->id,
                'type' => 'level_completed',
                'description' => "Completed {$level->name}",
                'metadata' => ['game_level_id' => $level->id, 'xp_reward' => $level->xp_reward],
            ]);
        }

        $progress->best_score = max($progress->best_score, $session->correct_answers);
        $progress->save();

        if ($xpAwarded > 0) {
            $student->addXp($xpAwarded);
        }

        return response()->json([
            'correct' => $isCorrect,
            'correct_answer' => $question->correct_answer,
            'explanation' => $question->explanation,
            'xp_awarded' => $xpAwarded,
            'level_completed' => $levelJustCompleted,
            'student' => ['xp' => $student->xp, 'level' => $student->level],
            'session' => [
                'id' => $session->id,
                'questions_answered' => $session->questions_answered,
                'correct_answers' => $session->correct_answers,
                'xp_earned' => $session->xp_earned,
            ],
            'progress' => [
                'status' => $progress->status,
                'stars' => $progress->stars,
                'attempts' => $progress->attempts,
                'best_score' => $progress->best_score,
            ],
        ]);
    }
}
