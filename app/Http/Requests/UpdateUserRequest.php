<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $user = $this->route('user');

        return [
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],

            'email' => [
                'sometimes',
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')
                    ->ignore($user),
            ],

            'password' => [
                'sometimes',
                'nullable',
                'string',
                'min:8',
                'confirmed',
            ],

            'role' => [
                'sometimes',
                'required',
                Rule::in([
                    'responsable',
                    'fournisseur',
                    'admin'
                ]),
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
            'name.required' => 'The user name cannot be empty.',

            'email.required' => 'The email address cannot be empty.',
            'email.email' => 'Please enter a valid email address.',
            'email.unique' => 'This email address is already used.',

            'password.min' => 'The password must contain at least 8 characters.',
            'password.confirmed' => 'The password confirmation does not match.',

            'role.in' => 'The role must be responsable or fournisseur.',

            'status.in' => 'The status must be active or inactive.',
        ];
    }
}
