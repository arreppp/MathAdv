<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Deliberately omits correct_answer and explanation - those are only
 * revealed in the answer-submission response, after the student answers.
 */
class QuestionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'difficulty' => $this->difficulty,
            'prompt' => $this->prompt,
            'options' => $this->options,
            'xp_value' => $this->xp_value,
        ];
    }
}
