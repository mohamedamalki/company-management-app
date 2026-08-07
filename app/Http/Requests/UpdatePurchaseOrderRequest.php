<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePurchaseOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'supplier_id' => [
                'required',
                'integer',

                Rule::exists(
                    'suppliers',
                    'id'
                )
                    ->whereNull('deleted_at')
                    ->where(
                        'is_active',
                        true
                    ),
            ],

            'location_id' => [
                'required',
                'integer',

                Rule::exists(
                    'locations',
                    'id'
                )->where(
                    'status',
                    'active'
                ),
            ],

            'order_date' => [
                'required',
                'date',
            ],

            'expected_date' => [
                'nullable',
                'date',
                'after_or_equal:order_date',
            ],

            'status' => [
                'sometimes',

                Rule::in([
                    'draft',
                    'ordered',
                ]),
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

                Rule::exists(
                    'products',
                    'id'
                )->whereNull(
                    'deleted_at'
                ),
            ],

            'items.*.quantity' => [
                'required',
                'numeric',
                'gt:0',
                'decimal:0,3',
            ],

            'items.*.unit_price_ht' => [
                'required',
                'numeric',
                'min:0',
                'decimal:0,2',
            ],

            'items.*.tax_rate' => [
                'required',
                'numeric',
                'min:0',
                'max:100',
                'decimal:0,2',
            ],
        ];
    }
}
