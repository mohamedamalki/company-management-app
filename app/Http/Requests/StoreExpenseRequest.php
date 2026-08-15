<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $data = [];

        foreach (["title", "bill_reference", "notes"] as $field) {
            if (!$this->has($field)) {
                continue;
            }

            $value = trim((string) $this->input($field));

            $data[$field] = $value !== "" ? $value : null;
        }

        foreach (
            [
                "location_id",
                "supplier_id",
                "tax_rate_id",
                "due_date",
                "period_start",
                "period_end",
            ]
            as $field
        ) {
            if ($this->has($field) && $this->input($field) === "") {
                $data[$field] = null;
            }
        }

        $this->merge($data);
    }

    public function rules(): array
    {
        return [
            "expense_category_id" => [
                "required",
                "integer",
                Rule::exists("expense_categories", "id")->where(
                    fn($query) => $query->where("is_active", true),
                ),
            ],

            "location_id" => [
                "nullable",
                "integer",
                Rule::exists("locations", "id")->where(
                    fn($query) => $query->where("status", "active"),
                ),
            ],

            "supplier_id" => [
                "nullable",
                "integer",
                Rule::exists("suppliers", "id")->where(
                    fn($query) => $query->where("is_active", true),
                ),
            ],

            "tax_rate_id" => [
                "nullable",
                "integer",
                Rule::exists("tax_rates", "id")->where(
                    fn($query) => $query->where("status", "active"),
                ),
            ],

            "title" => ["required", "string", "max:255"],

            "bill_reference" => ["nullable", "string", "max:100"],

            "issue_date" => ["required", "date_format:Y-m-d"],

            "due_date" => [
                "nullable",
                "date_format:Y-m-d",
                "after_or_equal:issue_date",
            ],

            "period_start" => [
                "nullable",
                "required_with:period_end",
                "date_format:Y-m-d",
            ],

            "period_end" => [
                "nullable",
                "required_with:period_start",
                "date_format:Y-m-d",
                "after_or_equal:period_start",
            ],

            "amount_ht" => ["required", "numeric", "gt:0", "decimal:0,2"],

            "notes" => ["nullable", "string", "max:5000"],

            "document" => [
                "nullable",
                "file",
                "mimes:pdf,jpg,jpeg,png,webp",
                "max:5120",
            ],
        ];
    }
}
