<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductPriceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tax_rate_id' => [
                'sometimes',
                'required',
                'integer',

                Rule::exists('tax_rates', 'id')
                    ->where(
                        fn ($query) => $query->where(
                            'status',
                            'active'
                        )
                    ),
            ],

            'sale_price_ht' => [
                'sometimes',
                'required',
                'numeric',
                'min:0',
                'decimal:0,2',
            ],

            'status' => [
                'sometimes',
                Rule::in([
                    'active',
                    'inactive',
                ]),
            ],

            'tiers' => [
                'sometimes',
                'array',
            ],

            'tiers.*.min_quantity' => [
                'required',
                'integer',
                'min:2',
                'distinct',
            ],

            'tiers.*.unit_price_ht' => [
                'required',
                'numeric',
                'min:0',
                'decimal:0,2',
            ],
        ];
    }
}
