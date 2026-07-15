<?php

use App\Http\Controllers\Api\AchievementController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClassController;
use App\Http\Controllers\Api\GameLevelController;
use App\Http\Controllers\Api\LeaderboardController;
use App\Http\Controllers\Api\ProgressController;
use App\Http\Controllers\Api\QuestionController;
use App\Http\Controllers\Api\RewardController;
use App\Http\Controllers\Api\StudentController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);

        Route::get('/leaderboard', [LeaderboardController::class, 'index']);

        Route::middleware('role:student')->group(function () {
            Route::get('/dashboard', [ProgressController::class, 'summary']);
            Route::get('/levels', [GameLevelController::class, 'index']);
            Route::get('/levels/{level}/questions/next', [QuestionController::class, 'next']);
            Route::post('/levels/{level}/answers', [ProgressController::class, 'submitAnswer']);
            Route::get('/achievements', [AchievementController::class, 'index']);
            Route::get('/rewards/daily', [RewardController::class, 'dailyStatus']);
            Route::post('/rewards/daily/claim', [RewardController::class, 'claimDaily']);
        });

        Route::middleware('role:teacher')->prefix('teacher')->group(function () {
            Route::apiResource('classes', ClassController::class)->only(['index', 'store', 'show']);
            Route::get('/classes/{class}/students', [StudentController::class, 'index']);
            Route::get('/classes/{class}/analytics', [AnalyticsController::class, 'classSummary']);
        });
    });
});
