<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdjustStockRequest extends FormRequest
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
            'type' => [
                'required',
                Rule::in([
                    'adjustment_in',
                    'adjustment_out',
                ]),
            ],

            'quantity' => [
                'required',
                'numeric',
                'gt:0',
                'decimal:0,3',
            ],

            'notes' => [
                'required',
                'string',
                'max:1000',
            ],
        ];
    }
}
