<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMinimumQuantityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array(
            $this->user()?->role,
            ['admin', 'responsable'],
            true
        );
    }

    public function rules(): array
    {
        return [
            'minimum_quantity' => [
                'required',
                'numeric',
                'min:0',
                'decimal:0,3',
            ],
        ];
    }
}
