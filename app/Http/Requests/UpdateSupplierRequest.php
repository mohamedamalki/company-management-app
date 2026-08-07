<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSupplierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $data = [];

        if ($this->has('name')) {
            $data['name'] = trim(
                $this->input('name')
            );
        }

        if ($this->has('code')) {
            $data['code'] = strtoupper(
                trim($this->input('code'))
            );
        }

        if ($this->has('email')) {
            $email = trim(
                $this->input('email')
            );

            $data['email'] = $email !== ''
                ? strtolower($email)
                : null;
        }

        foreach ([
            'contact_name',
            'phone',
            'address',
            'ice',
        ] as $field) {
            if ($this->has($field)) {
                $value = trim(
                    $this->input($field)
                );

                $data[$field] = $value !== ''
                    ? $value
                    : null;
            }
        }

        $this->merge($data);
    }

    public function rules(): array
    {
        $supplier = $this->route(
            'supplier'
        );

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

                Rule::unique(
                    'suppliers',
                    'code'
                )->ignore($supplier),
            ],

            'contact_name' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
            ],

            'email' => [
                'sometimes',
                'nullable',
                'email',
                'max:255',
            ],

            'phone' => [
                'sometimes',
                'nullable',
                'string',
                'max:30',
            ],

            'address' => [
                'sometimes',
                'nullable',
                'string',
                'max:500',
            ],

            'ice' => [
                'sometimes',
                'nullable',
                'string',
                'max:30',

                Rule::unique(
                    'suppliers',
                    'ice'
                )->ignore($supplier),
            ],

            'is_active' => [
                'sometimes',
                'boolean',
            ],
        ];
    }
}
