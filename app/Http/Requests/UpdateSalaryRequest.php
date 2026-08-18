<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSalaryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'employee_id'   => ['sometimes', 'required', 'integer', 'exists:employees,id'],
            'salary_month'  => ['sometimes', 'required', 'date'],
            'base_salary'   => ['sometimes', 'required', 'numeric', 'min:0'],
            'bonuses'       => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'deductions'    => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'net_salary'    => ['sometimes', 'required', 'numeric'],
            'payment_date'  => ['sometimes', 'nullable', 'date'],
            'status'        => ['sometimes', 'required', Rule::in(['pending', 'paid', 'cancelled'])],
        ];
    }
}
