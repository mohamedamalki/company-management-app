<?php

namespace App\Http\Requests;

use App\Models\Customer;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFournisseurRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Permission is already checked by controller middleware.
        return true;
    }

    protected function prepareForValidation(): void
    {
        $data = [];

        if ($this->has('code')) {
            $data['code'] = strtoupper(
                trim((string) $this->input('code'))
            );
        }

        if ($this->has('name')) {
            $data['name'] = trim(
                (string) $this->input('name')
            );
        }

        if ($this->has('email')) {
            $data['email'] = $this->filled('email')
                ? strtolower(
                    trim((string) $this->input('email'))
                )
                : null;
        }

        if ($this->has('entity_type')) {
            $data['entity_type'] = strtolower(
                trim((string) $this->input('entity_type'))
            );
        }

        if ($this->has('status')) {
            $data['status'] = strtolower(
                trim((string) $this->input('status'))
            );
        }

        foreach ([
            'phone',
            'ice',
            'address',
            'city',
            'notes',
        ] as $field) {
            if ($this->has($field)) {
                $data[$field] = $this->filled($field)
                    ? trim(
                        (string) $this->input($field)
                    )
                    : null;
            }
        }

        $this->merge($data);
    }

    public function rules(): array
    {
        $fournisseur = $this->route(
            'fournisseur'
        );

        return [
            'user_id' => [
                'sometimes',
                'required',
                'integer',

                Rule::exists('users', 'id')
                    ->where(
                        fn ($query) =>
                            $query->where(
                                'role',
                                'fournisseur'
                            )
                    ),

                Rule::unique(
                    'customers',
                    'user_id'
                )->ignore($fournisseur),
            ],

            'code' => [
                'sometimes',
                'required',
                'string',
                'max:50',

                Rule::unique(
                    'customers',
                    'code'
                )->ignore($fournisseur),
            ],

            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],

            'entity_type' => [
                'sometimes',
                'required',

                Rule::in([
                    Customer::ENTITY_INDIVIDUAL,
                    Customer::ENTITY_COMPANY,
                ]),
            ],

            'phone' => [
                'sometimes',
                'nullable',
                'string',
                'max:30',
            ],

            'email' => [
                'sometimes',
                'nullable',
                'email',
                'max:255',

                Rule::unique(
                    'customers',
                    'email'
                )->ignore($fournisseur),
            ],

            'ice' => [
                'sometimes',
                'nullable',
                'string',
                'max:50',

                Rule::unique(
                    'customers',
                    'ice'
                )->ignore($fournisseur),
            ],

            'address' => [
                'sometimes',
                'nullable',
                'string',
                'max:500',
            ],

            'city' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
            ],

            'status' => [
                'sometimes',

                Rule::in([
                    Customer::STATUS_ACTIVE,
                    Customer::STATUS_INACTIVE,
                ]),
            ],

            'credit_limit' => [
                'sometimes',
                'numeric',
                'min:0',
                'decimal:0,2',
            ],

            'payment_terms_days' => [
                'sometimes',
                'integer',
                'min:0',
                'max:365',
            ],

            'notes' => [
                'sometimes',
                'nullable',
                'string',
                'max:2000',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'user_id.exists' =>
                'The selected user must have the fournisseur role.',

            'user_id.unique' =>
                'This user already has another customer account.',

            'code.unique' =>
                'This fournisseur code is already used.',

            'email.unique' =>
                'This email is already assigned to another customer.',

            'ice.unique' =>
                'This ICE is already assigned to another customer.',
        ];
    }
}
