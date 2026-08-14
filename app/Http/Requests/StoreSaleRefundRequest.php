<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSaleRefundRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            "reference" => $this->filled("reference")
                ? trim($this->input("reference"))
                : null,

            "notes" => $this->filled("notes")
                ? trim($this->input("notes"))
                : null,
        ]);
    }

    public function rules(): array
    {
        return [
            "payment_method_id" => [
                "required",
                "integer",
                "exists:payment_methods,id",
            ],

            "amount" => ["required", "numeric", "gt:0", "decimal:0,2"],

            "reference" => ["nullable", "string", "max:255"],

            "refunded_at" => ["nullable", "date", "before_or_equal:now"],

            "notes" => ["nullable", "string", "max:1000"],
        ];
    }
}
