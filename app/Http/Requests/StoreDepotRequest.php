<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDepotRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Authorization is handled by auth:sanctum and role:admin.
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
        return [
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'code' => [
                'required',
                'string',
                'max:50',
                'unique:depots,code',
            ],

            'address' => [
                'nullable',
                'string',
                'max:500',
            ],

            'phone' => [
                'nullable',
                'string',
                'max:30',
            ],

            'status' => [
                'sometimes',
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
            'name.required' => 'The depot name is required.',
            'code.required' => 'The depot code is required.',
            'code.unique' => 'This depot code already exists.',
            'status.in' => 'The status must be active or inactive.',
        ];
    }
}
