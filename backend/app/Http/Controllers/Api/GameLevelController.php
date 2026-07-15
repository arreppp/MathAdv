<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GameLevel;
use App\Models\PlayerProgress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GameLevelController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $student = $request->user()->student;

        $levels = GameLevel::with('category')->orderBy('world')->orderBy('level_number')->get();
        $progressByLevel = PlayerProgress::where('student_id', $student->id)->get()->keyBy('game_level_id');

        return response()->json([
            'levels' => $levels->map(function (GameLevel $level) use ($student, $progressByLevel) {
                $progress = $progressByLevel->get($level->id);

                return [
                    'id' => $level->id,
                    'world' => $level->world,
                    'level_number' => $level->level_number,
                    'name' => $level->name,
                    'description' => $level->description,
                    'difficulty' => $level->difficulty,
                    'xp_reward' => $level->xp_reward,
                    'unlock_xp_threshold' => $level->unlock_xp_threshold,
                    'category' => [
                        'id' => $level->category->id,
                        'name' => $level->category->name,
                        'slug' => $level->category->slug,
                    ],
                    'unlocked' => $student->xp >= $level->unlock_xp_threshold,
                    'progress' => $progress ? [
                        'status' => $progress->status,
                        'stars' => $progress->stars,
                        'best_score' => $progress->best_score,
                        'attempts' => $progress->attempts,
                        'completed_at' => $progress->completed_at,
                    ] : null,
                ];
            }),
        ]);
    }
}
