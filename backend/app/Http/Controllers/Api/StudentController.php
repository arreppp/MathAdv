<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassRoom;
use App\Models\PlayerProgress;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    public function index(Request $request, ClassRoom $class): JsonResponse
    {
        abort_unless($class->teacher_id === $request->user()->teacher->id, 403);

        $students = $class->students()->with('user')->get()->map(fn (Student $student) => [
            'id' => $student->id,
            'name' => $student->user->name,
            'xp' => $student->xp,
            'level' => $student->level,
            'levels_completed' => PlayerProgress::where('student_id', $student->id)->where('status', 'completed')->count(),
        ]);

        return response()->json(['students' => $students]);
    }
}
