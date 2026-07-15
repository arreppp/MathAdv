<?php

namespace Tests\Feature;

use App\Models\GameLevel;
use App\Models\Question;
use App\Models\QuestionCategory;
use App\Models\Role;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProgressTest extends TestCase
{
    use RefreshDatabase;

    private function makeStudentUser(): User
    {
        $role = Role::firstOrCreate(['name' => 'student']);
        $user = User::factory()->create(['role_id' => $role->id]);
        Student::create(['user_id' => $user->id]);

        return $user;
    }

    private function makeLevelWithQuestion(): array
    {
        $category = QuestionCategory::create([
            'world' => 1, 'name' => 'Addition', 'slug' => 'addition', 'order' => 1,
        ]);

        $level = GameLevel::create([
            'question_category_id' => $category->id,
            'world' => 1,
            'level_number' => 1,
            'name' => 'Addition Meadow',
            'difficulty' => 'easy',
            'xp_reward' => 20,
            'unlock_xp_threshold' => 0,
        ]);

        $question = Question::create([
            'question_category_id' => $category->id,
            'game_level_id' => $level->id,
            'type' => 'multiple_choice',
            'difficulty' => 'easy',
            'prompt' => 'What is 2 + 2?',
            'options' => ['3', '4', '5', '6'],
            'correct_answer' => '4',
            'xp_value' => 5,
        ]);

        return [$level, $question];
    }

    public function test_a_correct_answer_awards_xp(): void
    {
        $user = $this->makeStudentUser();
        [$level, $question] = $this->makeLevelWithQuestion();

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/v1/levels/{$level->id}/answers", [
            'question_id' => $question->id,
            'answer' => '4',
        ]);

        $response->assertOk()
            ->assertJsonPath('correct', true)
            ->assertJsonPath('xp_awarded', 5)
            ->assertJsonPath('student.xp', 5);

        $this->assertDatabaseHas('students', ['user_id' => $user->id, 'xp' => 5]);
    }

    public function test_an_incorrect_answer_awards_no_xp(): void
    {
        $user = $this->makeStudentUser();
        [$level, $question] = $this->makeLevelWithQuestion();

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/v1/levels/{$level->id}/answers", [
            'question_id' => $question->id,
            'answer' => '999',
        ]);

        $response->assertOk()
            ->assertJsonPath('correct', false)
            ->assertJsonPath('xp_awarded', 0)
            ->assertJsonPath('student.xp', 0);

        $this->assertDatabaseHas('students', ['user_id' => $user->id, 'xp' => 0]);
    }

    public function test_completing_a_level_awards_bonus_xp_and_marks_progress_complete(): void
    {
        $user = $this->makeStudentUser();
        [$level, $firstQuestion] = $this->makeLevelWithQuestion();

        $extraQuestions = collect(range(1, 4))->map(fn () => Question::create([
            'question_category_id' => $level->question_category_id,
            'game_level_id' => $level->id,
            'type' => 'multiple_choice',
            'difficulty' => 'easy',
            'prompt' => 'What is 3 + 3?',
            'options' => ['5', '6', '7', '8'],
            'correct_answer' => '6',
            'xp_value' => 5,
        ]));

        $questions = collect([$firstQuestion])->merge($extraQuestions);
        $answers = ['4', '6', '6', '6', '6'];

        foreach ($questions as $index => $question) {
            $response = $this->actingAs($user, 'sanctum')->postJson("/api/v1/levels/{$level->id}/answers", [
                'question_id' => $question->id,
                'answer' => $answers[$index],
            ]);
        }

        $response->assertOk()->assertJsonPath('level_completed', true);

        // 5 correct answers * 5 xp each + 20 level completion bonus = 45
        $this->assertDatabaseHas('students', ['user_id' => $user->id, 'xp' => 45]);
        $this->assertDatabaseHas('player_progress', [
            'student_id' => Student::where('user_id', $user->id)->value('id'),
            'game_level_id' => $level->id,
            'status' => 'completed',
        ]);
    }
}
