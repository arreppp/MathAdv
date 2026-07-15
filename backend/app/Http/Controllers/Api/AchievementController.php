<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Achievement;
use App\Models\Badge;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AchievementController extends Controller
{
    /**
     * Lists the achievement/badge catalog with the student's earned status.
     * Auto-awarding (unlocking achievements/badges as milestones are hit)
     * isn't wired up yet - only XP awarding is live in this pass.
     */
    public function index(Request $request): JsonResponse
    {
        $student = $request->user()->student;

        $earnedAchievementIds = $student->achievements()->pluck('achievements.id');
        $earnedBadgeIds = $student->badges()->pluck('badges.id');

        return response()->json([
            'achievements' => Achievement::all()->map(fn (Achievement $achievement) => [
                'id' => $achievement->id,
                'name' => $achievement->name,
                'description' => $achievement->description,
                'icon' => $achievement->icon,
                'xp_reward' => $achievement->xp_reward,
                'earned' => $earnedAchievementIds->contains($achievement->id),
            ]),
            'badges' => Badge::all()->map(fn (Badge $badge) => [
                'id' => $badge->id,
                'name' => $badge->name,
                'description' => $badge->description,
                'icon' => $badge->icon,
                'rarity' => $badge->rarity,
                'earned' => $earnedBadgeIds->contains($badge->id),
            ]),
        ]);
    }
}
