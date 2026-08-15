<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreExpensePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $data = [];

        foreach (["reference", "notes"] as $field) {
            if (!$this->has($field)) {
                continue;
            }

            $value = trim((string) $this->input($field));

            $data[$field] = $value !== "" ? $value : null;
        }

        if ($this->has("paid_at") && $this->input("paid_at") === "") {
            $data["paid_at"] = null;
        }

        $this->merge($data);
    }

    public function rules(): array
    {
        return [
            "payment_method_id" => [
                "required",
                "integer",
                Rule::exists("payment_methods", "id")->where(
                    fn($query) => $query->where("status", "active"),
                ),
            ],

            "amount" => ["required", "numeric", "gt:0", "decimal:0,2"],

            "reference" => ["nullable", "string", "max:255"],

            "paid_at" => ["nullable", "date", "before_or_equal:now"],

            "notes" => ["nullable", "string", "max:2000"],
        ];
    }
}
