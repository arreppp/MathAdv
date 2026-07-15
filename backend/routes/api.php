<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\GameLevelController;
use App\Http\Controllers\Api\ProgressController;
use App\Http\Controllers\Api\QuestionController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);

        Route::middleware('role:student')->group(function () {
            Route::get('/dashboard', [ProgressController::class, 'summary']);
            Route::get('/levels', [GameLevelController::class, 'index']);
            Route::get('/levels/{level}/questions/next', [QuestionController::class, 'next']);
            Route::post('/levels/{level}/answers', [ProgressController::class, 'submitAnswer']);
        });
    });
});
