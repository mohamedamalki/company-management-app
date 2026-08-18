<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSalaryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'employee_id'   => ['required', 'integer', 'exists:employees,id'],
            'salary_month'  => ['required', 'date'],
            'base_salary'   => ['required', 'numeric', 'min:0'],
            'bonuses'       => ['nullable', 'numeric', 'min:0'],
            'deductions'    => ['nullable', 'numeric', 'min:0'],
            'net_salary'    => ['required', 'numeric'],
            'payment_date'  => ['nullable', 'date'],
            'status'        => ['required', Rule::in(['pending', 'paid', 'cancelled'])],
        ];
    }
}
