<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLocationAssignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Only an admin can assign users.
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'user_id' => [
                'required',
                'integer',

                Rule::exists('users', 'id')
                    ->where(
                        fn ($query) =>
                            $query->where(
                                'status',
                                'active'
                            )
                    ),
            ],

            'location_id' => [
                'required',
                'integer',

                Rule::exists(
                    'locations',
                    'id'
                )->where(
                    fn ($query) =>
                        $query->where(
                            'status',
                            'active'
                        )
                ),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'user_id.exists' =>
                'The selected user must be active.',

            'location_id.exists' =>
                'The selected location must be active.',
        ];
    }
}
