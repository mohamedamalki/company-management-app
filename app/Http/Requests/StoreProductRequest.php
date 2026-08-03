<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
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
                'required',
                'integer',
                'exists:categories,id',
            ],

            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'sku' => [
                'required',
                'string',
                'max:100',
                'unique:products,sku',
            ],

            'barcode' => [
                'nullable',
                'string',
                'max:100',
                'unique:products,barcode',
            ],

            'description' => [
                'nullable',
                'string',
            ],

            'purchase_price' => [
                'required',
                'numeric',
                'min:0',
            ],

            'sale_price' => [
                'required',
                'numeric',
                'min:0',
            ],

            'unit' => [
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
