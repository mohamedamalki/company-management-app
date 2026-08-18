<?php

namespace App\Http\Requests;

use App\Models\Expense;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateExpenseRequest extends FormRequest
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
        /** @var Expense|null $expense */
        $expense = $this->route("expense");

        $issueDate = $this->input(
            "issue_date",
            $expense?->issue_date?->format("Y-m-d"),
        );
        return [
            "expense_category_id" => [
                "sometimes",
                "required",
                "integer",
                Rule::exists("expense_categories", "id")->where(
                    fn($query) => $query->where("is_active", true),
                ),
            ],

            "location_id" => [
                "sometimes",
                "nullable",
                "integer",
                Rule::exists("locations", "id")->where(
                    fn($query) => $query->where("status", "active"),
                ),
            ],

            "supplier_id" => [
                "sometimes",
                "nullable",
                "integer",
                Rule::exists("suppliers", "id")->where(
                    fn($query) => $query->where("is_active", true),
                ),
            ],

            "tax_rate_id" => [
                "sometimes",
                "nullable",
                "integer",
                Rule::exists("tax_rates", "id")->where(
                    fn($query) => $query->where("status", "active"),
                ),
            ],
            'salary_id' => [
                'nullable',
                'integer',
                'exists:salaries,id',
            ],

            "title" => ["sometimes", "required", "string", "max:255"],

            "bill_reference" => ["sometimes", "nullable", "string", "max:100"],

            "issue_date" => ["sometimes", "required", "date_format:Y-m-d"],

            "amount_ht" => [
                "sometimes",
                "required",
                "numeric",
                "gt:0",
                "decimal:0,2",
            ],

            "notes" => ["sometimes", "nullable", "string", "max:5000"],

            "document" => [
                "sometimes",
                "nullable",
                "file",
                "mimes:pdf,jpg,jpeg,png,webp",
                "max:5120",
            ],

            "remove_document" => ["sometimes", "boolean"],
        ];
    }
}
