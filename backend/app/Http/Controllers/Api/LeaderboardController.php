<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeaderboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $scope = $request->query('scope', 'global');

        if ($scope === 'weekly') {
            return response()->json([
                'scope' => 'weekly',
                'message' => 'Weekly leaderboards are not computed yet - the leaderboards table exists but the recompute job has not been built.',
                'entries' => [],
            ]);
        }

        $query = Student::with('user')->orderByDesc('xp')->limit(50);

        if ($scope === 'class') {
            $classId = $request->query('class_id');

            if (! $classId) {
                return response()->json(['message' => 'class_id is required for scope=class.'], 422);
            }

            $query->where('class_id', $classId);
        }

        $entries = $query->get()->values()->map(fn (Student $student, int $index) => [
            'rank' => $index + 1,
            'student_id' => $student->id,
            'name' => $student->user->name,
            'xp' => $student->xp,
            'level' => $student->level,
        ]);

        return response()->json(['scope' => $scope, 'entries' => $entries]);
    }
}
