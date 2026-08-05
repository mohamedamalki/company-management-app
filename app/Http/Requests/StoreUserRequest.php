<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                'unique:users,email',
            ],

            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
            ],

            'role' => [
                'required',
                Rule::in([
                    'responsable',
                    'fournisseur',
                    'admin'
                ]),
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
            'name.required' => 'The user name is required.',

            'email.required' => 'The email address is required.',
            'email.email' => 'Please enter a valid email address.',
            'email.unique' => 'This email address is already used.',

            'password.required' => 'The password is required.',
            'password.min' => 'The password must contain at least 8 characters.',
            'password.confirmed' => 'The password confirmation does not match.',

            'role.required' => 'The user role is required.',
            'role.in' => 'The role must be responsable or fournisseur.',

            'status.in' => 'The status must be active or inactive.',
        ];
    }
}
