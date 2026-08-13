<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => trim(
                (string) $this->input('name')
            ),

            'email' => $this->filled('email')
                ? strtolower(trim(
                    $this->input('email')
                ))
                : null,

            'phone' => $this->filled('phone')
                ? trim($this->input('phone'))
                : null,

            'ice' => $this->filled('ice')
                ? trim($this->input('ice'))
                : null,

            'address' =>
                $this->filled('address')
                    ? trim(
                        $this->input('address')
                    )
                    : null,

            'city' => $this->filled('city')
                ? trim($this->input('city'))
                : null,

            'user_id' =>
                $this->filled('user_id')
                    ? $this->input('user_id')
                    : null,
        ]);
    }

    public function rules(): array
    {
        return [
            'category' => [
                'required',
                Rule::in([
                    'registered',
                    'fournisseur',
                ]),
            ],

            'entity_type' => [
                'required',
                Rule::in([
                    'individual',
                    'company',
                ]),
            ],

            'user_id' => [
                'nullable',
                'required_if:category,fournisseur',
                'integer',

                Rule::exists(
                    'users',
                    'id'
                )->where(
                    fn ($query) =>
                        $query
                            ->where(
                                'role',
                                'fournisseur'
                            )
                            ->where(
                                'status',
                                'active'
                            )
                ),

                Rule::unique(
                    'customers',
                    'user_id'
                ),
            ],

            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'phone' => [
                'nullable',
                'string',
                'max:30',
            ],

            'email' => [
                'nullable',
                'email',
                'max:255',
            ],

            'ice' => [
                'nullable',
                'string',
                'size:15',
                'regex:/^\d{15}$/',
                Rule::unique(
                    'customers',
                    'ice'
                ),
            ],

            'address' => [
                'nullable',
                'string',
                'max:255',
            ],

            'city' => [
                'nullable',
                'string',
                'max:100',
            ],

            'status' => [
                'sometimes',
                Rule::in([
                    'active',
                    'inactive',
                ]),
            ],

            'notes' => [
                'nullable',
                'string',
                'max:2000',
            ],
        ];
    }
}
