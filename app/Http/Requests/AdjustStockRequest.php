<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdjustStockRequest extends FormRequest
{
    /**
     * Authorization is already handled
     * by controller permission middleware.
     */
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('type')) {
            $this->merge([
                'type' => strtolower(
                    trim($this->input('type'))
                ),
            ]);
        }

        if ($this->has('notes')) {
            $this->merge([
                'notes' => $this->filled('notes')
                    ? trim($this->input('notes'))
                    : null,
            ]);
        }
    }

    public function rules(): array
    {
        return [
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

            'product_id' => [
                'required',
                'integer',
                'exists:products,id',

                // The product stock must already
                // be initialized in this location.
                Rule::exists(
                    'location_stocks',
                    'product_id'
                )->where(
                    fn ($query) =>
                        $query->where(
                            'location_id',
                            $this->input('location_id')
                        )
                ),
            ],

            'type' => [
                'required',

                Rule::in([
                    'opening_stock',
                    'adjustment_in',
                    'adjustment_out',
                ]),
            ],

            'quantity' => [
                'required',
                'numeric',
                'gt:0',
                'decimal:0,3',
            ],

            'notes' => [
                Rule::requiredIf(
                    fn () => in_array(
                        $this->input('type'),
                        [
                            'adjustment_in',
                            'adjustment_out',
                        ],
                        true
                    )
                ),
                'nullable',
                'string',
                'max:1000',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'location_id.required' =>
                'Please select a location.',

            'location_id.exists' =>
                'The selected location does not exist or is inactive.',

            'product_id.required' =>
                'Please select a product.',

            'product_id.exists' =>
                'This product stock has not been initialized in the selected location.',

            'type.required' =>
                'Please select a movement type.',

            'type.in' =>
                'The selected movement type is invalid.',

            'quantity.required' =>
                'Please enter a quantity.',

            'quantity.numeric' =>
                'The quantity must be a number.',

            'quantity.gt' =>
                'The quantity must be greater than zero.',

            'quantity.decimal' =>
                'The quantity can have a maximum of three decimal places.',

            'notes.required' =>
                'A reason is required for manual stock adjustments.',

            'notes.max' =>
                'The notes cannot contain more than 1000 characters.',
        ];
    }
}
