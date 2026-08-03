<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDepotRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('code')) {
            $this->merge([
                'code' => strtoupper(trim($this->code)),
            ]);
        }
    }

    public function rules(): array
    {
        $depot = $this->route('depot');

        return [
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],

            'code' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('depots', 'code')
                    ->ignore($depot),
            ],

            'address' => [
                'sometimes',
                'nullable',
                'string',
                'max:500',
            ],

            'phone' => [
                'sometimes',
                'nullable',
                'string',
                'max:30',
            ],

            'status' => [
                'sometimes',
                'required',
                Rule::in([
                    'active',
                    'inactive',
                ]),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'The depot name cannot be empty.',
            'code.required' => 'The depot code cannot be empty.',
            'code.unique' => 'This depot code already exists.',
            'status.in' => 'The status must be active or inactive.',
        ];
    }
}
