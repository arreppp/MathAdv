<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\ClassRoom;
use App\Models\GameLevel;
use App\Models\PlayerProgress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    /**
     * "Average score" is approximated as average XP - there's no separate
     * per-quiz score field yet. Chart.js rendering happens on the frontend
     * (deferred); this just returns the numbers.
     */
    public function classSummary(Request $request, ClassRoom $class): JsonResponse
    {
        abort_unless($class->teacher_id === $request->user()->teacher->id, 403);

        $students = $class->students;
        $studentIds = $students->pluck('id');
        $totalLevels = GameLevel::count();

        $completedCount = PlayerProgress::whereIn('student_id', $studentIds)->where('status', 'completed')->count();
        $completionRate = ($students->isEmpty() || $totalLevels === 0)
            ? 0
            : round($completedCount / ($students->count() * $totalLevels) * 100, 1);

        $answerLogs = ActivityLog::whereIn('student_id', $studentIds)
            ->where('type', 'question_answered')
            ->get();

        $categoryAccuracy = $answerLogs
            ->groupBy(fn (ActivityLog $log) => $log->metadata['category_id'] ?? 'unknown')
            ->map(fn ($logs) => round($logs->avg(fn (ActivityLog $log) => $log->metadata['correct'] ? 1 : 0) * 100, 1))
            ->sortBy(fn ($accuracy) => $accuracy);

        return response()->json([
            'student_count' => $students->count(),
            'average_xp' => $students->isEmpty() ? 0 : round($students->avg('xp'), 1),
            'completion_rate_percent' => $completionRate,
            'category_accuracy_percent' => $categoryAccuracy,
            'weakest_category_id' => $categoryAccuracy->keys()->first(),
            'strongest_category_id' => $categoryAccuracy->keys()->last(),
            'recent_activity' => ActivityLog::whereIn('student_id', $studentIds)
                ->latest()
                ->limit(15)
                ->get(['student_id', 'type', 'description', 'created_at']),
        ]);
    }
}
