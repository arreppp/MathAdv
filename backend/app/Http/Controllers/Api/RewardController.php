<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Reward;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RewardController extends Controller
{
    public function dailyStatus(Request $request): JsonResponse
    {
        $student = $request->user()->student;
        $reward = Reward::where('type', 'daily')->first();

        if (! $reward) {
            return response()->json([
                'message' => 'No daily reward is configured yet.',
                'reward' => null,
                'claimed_today' => false,
            ]);
        }

        return response()->json([
            'reward' => ['id' => $reward->id, 'name' => $reward->name, 'xp_value' => $reward->xp_value],
            'claimed_today' => $this->claimedToday($student, $reward),
        ]);
    }

    public function claimDaily(Request $request): JsonResponse
    {
        $student = $request->user()->student;
        $reward = Reward::where('type', 'daily')->first();

        if (! $reward) {
            return response()->json(['message' => 'No daily reward is configured yet.'], 404);
        }

        if ($this->claimedToday($student, $reward)) {
            return response()->json(['message' => 'Already claimed today.'], 409);
        }

        $student->rewards()->attach($reward->id, ['claimed_at' => now()]);

        if ($reward->xp_value > 0) {
            $student->addXp($reward->xp_value);
        }

        return response()->json([
            'message' => 'Daily reward claimed.',
            'xp_awarded' => $reward->xp_value,
            'student' => ['xp' => $student->xp, 'level' => $student->level],
        ]);
    }

    private function claimedToday(Student $student, Reward $reward): bool
    {
        return $student->rewards()
            ->wherePivot('reward_id', $reward->id)
            ->wherePivot('claimed_at', '>=', now()->startOfDay())
            ->exists();
    }
}
