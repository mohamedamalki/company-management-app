<?php

namespace App\Http\Requests;

class UpdatePurchaseReceiptRequest extends
    StorePurchaseReceiptRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can(
            'purchase-receipts.manage'
        ) ?? false;
    }
}
