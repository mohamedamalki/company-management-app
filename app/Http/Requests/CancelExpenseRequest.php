<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CancelExpenseRequest extends FormRequest
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
                    (string) $this->input("cancellation_reason"),
                ),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            "cancellation_reason" => [
                "required",
                "string",
                "min:3",
                "max:2000",
            ],
        ];
    }
}
