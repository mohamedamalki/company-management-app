<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
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

        if ($this->has('sku')) {
            $data['sku'] = strtoupper(
                trim($this->input('sku'))
            );
        }

        if ($this->has('barcode')) {
            $data['barcode'] = $this->filled('barcode')
                ? trim($this->input('barcode'))
                : null;
        }

        if ($this->has('unit')) {
            $data['unit'] = strtolower(
                trim($this->input('unit'))
            );
        }

        $this->merge($data);
    }

    public function rules(): array
    {
        return [
            'category_id' => [
                'sometimes',
                'required',
                'integer',
                'exists:categories,id',
            ],

            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],

            'sku' => [
                'sometimes',
                'required',
                'string',
                'max:100',

                Rule::unique(
                    'products',
                    'sku'
                )->ignore(
                    $this->route('product')
                ),
            ],

            'barcode' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',

                Rule::unique(
                    'products',
                    'barcode'
                )->ignore(
                    $this->route('product')
                ),
            ],

            'description' => [
                'sometimes',
                'nullable',
                'string',
            ],

            'purchase_price' => [
                'sometimes',
                'required',
                'numeric',
                'min:0',
            ],

            'sale_price' => [
                'sometimes',
                'required',
                'numeric',
                'min:0',
            ],

            'unit' => [
                'sometimes',
                'required',

                Rule::in([
                    'piece',
                    'kg',
                    'liter',
                    'box',
                    'pack',
                    'meter',
                ]),
            ],
        ];
    }
}
