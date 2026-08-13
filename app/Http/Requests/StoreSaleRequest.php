<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'customer_id' =>
                $this->filled('customer_id')
                    ? $this->input(
                        'customer_id'
                    )
                    : null,

            'sale_date' =>
                $this->filled('sale_date')
                    ? $this->input(
                        'sale_date'
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
            'customer_id' => [
                'nullable',
                'integer',

                Rule::exists(
                    'customers',
                    'id'
                )->where(
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

            'paid_amount' => [
                'required',
                'numeric',
                'min:0',
                'decimal:0,2',
            ],

            'payment_method_id' => [
                'nullable',
                'integer',
                'exists:payment_methods,id',
            ],

        'payment_reference' => [
            'nullable',
            'string',
            'max:255',
        ],

            'notes' => [
                'nullable',
                'string',
                'max:2000',
            ],

            'items' => [
                'required',
                'array',
                'min:1',
            ],

            'items.*.product_id' => [
                'required',
                'integer',
                'distinct',
                'exists:products,id',
            ],

            'items.*.quantity' => [
                'required',
                'numeric',
                'gt:0',
                'decimal:0,3',
            ],

            'items.*.discount_amount' => [
                'sometimes',
                'numeric',
                'min:0',
                'decimal:0,2',
            ],
            'apply_tax' => [
                'required',
                'boolean',
            ],

            'tax_exemption_reason' => [
                'nullable',
                'string',
                'max:500',
            ],
        ];
    }
}
