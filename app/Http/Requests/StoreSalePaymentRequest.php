<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSalePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'reference' =>
                $this->filled('reference')
                    ? trim(
                        $this->input(
                            'reference'
                        )
                    )
                    : null,

            'paid_at' =>
                $this->filled('paid_at')
                    ? $this->input(
                        'paid_at'
                    )
                    : null,

            'notes' =>
                $this->filled('notes')
                    ? trim(
                        $this->input('notes')
                    )
                    : null,
        ]);
    }

    public function rules(): array
    {
        return [
            'payment_method_id' => [
                'required',
                'integer',

                Rule::exists(
                    'payment_methods',
                    'id'
                )->where(
                    fn ($query) =>
                        $query->where(
                            'status',
                            'active'
                        )
                ),
            ],

            'amount' => [
                'required',
                'numeric',
                'gt:0',
                'decimal:0,2',
            ],

            'reference' => [
                'nullable',
                'string',
                'max:255',
            ],

            'paid_at' => [
                'nullable',
                'date',
            ],

            'notes' => [
                'nullable',
                'string',
                'max:1000',
            ],
        ];
    }
}
