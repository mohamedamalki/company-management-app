<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreExpenseCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Spatie permission middleware is defined in the controller.
        return true;
    }

    protected function prepareForValidation(): void
    {
        $data = [];

        if ($this->has("name")) {
            $data["name"] = trim((string) $this->input("name"));
        }

        if ($this->has("code")) {
            $data["code"] = strtoupper(trim((string) $this->input("code")));
        }

        if ($this->has("description")) {
            $description = trim((string) $this->input("description"));

            $data["description"] = $description !== "" ? $description : null;
        }

        $this->merge($data);
    }

    public function rules(): array
    {
        return [
            "name" => [
                "required",
                "string",
                "max:255",
                Rule::unique("expense_categories", "name"),
            ],

            "code" => [
                "required",
                "string",
                "max:50",
                'regex:/^[A-Z0-9_-]+$/',
                Rule::unique("expense_categories", "code"),
            ],

            "description" => ["nullable", "string", "max:2000"],

            "is_active" => ["sometimes", "boolean"],
        ];
    }

    public function messages(): array
    {
        return [
            "code.regex" =>
                "The code may contain only uppercase letters, numbers, hyphens and underscores.",
        ];
    }
}
