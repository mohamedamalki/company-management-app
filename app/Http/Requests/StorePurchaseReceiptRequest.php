<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StorePurchaseReceiptRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can(
            'purchase-receipts.manage'
        ) ?? false;
    }

    public function rules(): array
    {
        return [
            'purchase_order_id' => [
                'required',
                'integer',
                'exists:purchase_orders,id',
            ],

            'received_at' => [
                'nullable',
                'date',
                'before_or_equal:now',
            ],

            'notes' => [
                'nullable',
                'string',
                'max:2000',
            ],

            'items' => [
                'required',
                'array',
                'min:1',
            ],

            'items.*.purchase_order_item_id' => [
                'required',
                'integer',
                'distinct',
                'exists:purchase_order_items,id',
            ],

            'items.*.received_quantity' => [
                'required',
                'numeric',
                'gt:0',
                'decimal:0,3',
            ],

            'items.*.accepted_quantity' => [
                'required',
                'numeric',
                'min:0',
                'decimal:0,3',
            ],

            'items.*.rejected_quantity' => [
                'required',
                'numeric',
                'min:0',
                'decimal:0,3',
            ],

            'items.*.notes' => [
                'nullable',
                'string',
                'max:1000',
            ],
        ];
    }

    public function withValidator(
        Validator $validator
    ): void {
        $validator->after(
            function (Validator $validator) {
                foreach (
                    $this->input('items', [])
                    as $index => $item
                ) {
                    $received = (float) (
                        $item['received_quantity'] ?? 0
                    );

                    $accepted = (float) (
                        $item['accepted_quantity'] ?? 0
                    );

                    $rejected = (float) (
                        $item['rejected_quantity'] ?? 0
                    );

                    if (
                        abs(
                            $received -
                            ($accepted + $rejected)
                        ) > 0.0005
                    ) {
                        $validator
                            ->errors()
                            ->add(
                                "items.{$index}.received_quantity",
                                'Received quantity must equal accepted quantity plus rejected quantity.'
                            );
                    }
                }
            }
        );
    }
}
