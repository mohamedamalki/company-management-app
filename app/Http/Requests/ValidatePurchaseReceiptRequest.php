<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ValidatePurchaseReceiptRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can(
            'purchase-receipts.validate'
        ) ?? false;
    }

    public function rules(): array
    {
        return [];
    }
}
