<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLocationStockRequest extends FormRequest
{
    /**
     * Authorization is handled by controller middleware.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare submitted values before validation.
     */
    protected function prepareForValidation(): void
    {
        if (!$this->filled('minimum_quantity')) {
            $this->merge([
                'minimum_quantity' => 0,
            ]);
        }
    }

    /**
     * Validation rules.
     */
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

                // Prevent the same product from being
                // initialized twice in one location.
                Rule::unique(
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

            'minimum_quantity' => [
                'required',
                'numeric',
                'min:0',
                'decimal:0,3',
            ],
        ];
    }

    /**
     * Custom validation messages.
     */
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
                'The selected product does not exist.',

            'product_id.unique' =>
                'This product already has a stock record in the selected location.',

            'minimum_quantity.required' =>
                'The minimum quantity is required.',

            'minimum_quantity.numeric' =>
                'The minimum quantity must be a number.',

            'minimum_quantity.min' =>
                'The minimum quantity cannot be negative.',

            'minimum_quantity.decimal' =>
                'The minimum quantity can have a maximum of three decimal places.',
        ];
    }

    /**
     * Friendly validation attribute names.
     */
    public function attributes(): array
    {
        return [
            'location_id' => 'location',
            'product_id' => 'product',
            'minimum_quantity' => 'minimum quantity',
        ];
    }
}
