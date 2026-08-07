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

        if ($this->has('reference')) {
            $data['reference'] = $this->filled('reference')
                ? strtoupper(trim($this->input('reference')))
                : null;
        }

        if ($this->has('unit')) {
            $data['unit'] = strtolower(
                trim($this->input('unit'))
            );
        }

        if ($this->has('description')) {
            $data['description'] = $this->filled('description')
                ? trim($this->input('description'))
                : null;
        }

        $this->merge($data);
    }

    public function rules(): array
    {
        $product = $this->route('product');

        return [
            'category_id' => [
                'sometimes',
                'required',
                'integer',
                'exists:categories,id',
            ],

            'brand_id' => [
                'sometimes',
                'nullable',
                'integer',
                'exists:brands,id',
            ],

            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],

            'reference' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',

                Rule::unique(
                    'products',
                    'reference'
                )->ignore($product),
            ],

            'description' => [
                'sometimes',
                'nullable',
                'string',
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
