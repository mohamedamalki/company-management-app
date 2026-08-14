<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CancelSaleReturnRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has("cancellation_reason")) {
            $this->merge([
                "cancellation_reason" => trim(
                    $this->input("cancellation_reason"),
                ),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            "cancellation_reason" => ["required", "string", "max:1000"],
        ];
    }
}
