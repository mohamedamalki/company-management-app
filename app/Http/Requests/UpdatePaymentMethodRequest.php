<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePaymentMethodRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('code')) {
            $this->merge([
                'code' => strtoupper(trim($this->code)),
            ]);
        }

        if ($this->has('name')) {
            $this->merge([
                'name' => trim($this->name),
            ]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $paymentMethod = $this->route('paymentMethod');
        return [
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:100',
                Rule::unique('payment_methods', 'name')
                    ->ignore($paymentMethod),
            ],

            'code' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                'alpha_dash',
                Rule::unique('payment_methods', 'code')
                    ->ignore($paymentMethod),
            ],

            'requires_reference' => [
                'sometimes',
                'boolean',
            ],

            'status' => [
                'sometimes',
                Rule::in([
                    'active',
                    'inactive',
                ]),
            ],
        ];
    }
}
