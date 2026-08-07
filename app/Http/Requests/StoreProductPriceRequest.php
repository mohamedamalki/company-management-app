<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductPriceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'product_id' => [
                'required',
                'integer',
                'exists:products,id',
            ],

            'location_id' => [
                'nullable',
                'integer',
                'exists:locations,id',
            ],

            'tax_rate_id' => [
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
                'required',
                'numeric',
                'min:0',
                'decimal:0,2',
            ],

            'tiers' => [
                'nullable',
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
