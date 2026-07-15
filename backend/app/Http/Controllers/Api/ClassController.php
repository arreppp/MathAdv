<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassRoom;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ClassController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'classes' => $request->user()->teacher->classes()->withCount('students')->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'grade_level' => ['nullable', 'string', 'max:255'],
        ]);

        $class = $request->user()->teacher->classes()->create([
            'name' => $data['name'],
            'grade_level' => $data['grade_level'] ?? null,
            'join_code' => $this->generateJoinCode(),
        ]);

        return response()->json(['class' => $class], 201);
    }

    public function show(Request $request, ClassRoom $class): JsonResponse
    {
        abort_unless($class->teacher_id === $request->user()->teacher->id, 403);

        return response()->json([
            'class' => $class->load('students.user'),
        ]);
    }

    private function generateJoinCode(): string
    {
        do {
            $code = strtoupper(Str::random(6));
        } while (ClassRoom::where('join_code', $code)->exists());

        return $code;
    }
}
