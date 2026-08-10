<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserPermissionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        // The API route already checks:
        // role:admin and can:permissions.manage
        return true;
    }

    public function rules(): array
    {
        return [
            'permissions' => [
                'present',
                'array',
            ],

            'permissions.*' => [
                'string',
                'distinct',
                'max:255',

                Rule::exists(
                    'permissions',
                    'name'
                )->where(
                    fn ($query) =>
                        $query->where(
                            'guard_name',
                            'web'
                        )
                ),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'permissions.present' =>
                'The permissions field is required.',

            'permissions.array' =>
                'Permissions must be provided as an array.',

            'permissions.*.distinct' =>
                'The same permission cannot be selected more than once.',

            'permissions.*.exists' =>
                'One or more selected permissions do not exist.',
        ];
    }
}
