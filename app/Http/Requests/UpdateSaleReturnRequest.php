<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateSaleReturnRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            "reason" => $this->filled("reason")
                ? trim($this->input("reason"))
                : null,

            "notes" => $this->filled("notes")
                ? trim($this->input("notes"))
                : null,
        ]);
    }

    public function rules(): array
    {
        return [
            "reason" => ["required", "string", "max:1000"],

            "notes" => ["nullable", "string", "max:2000"],

            "items" => ["required", "array", "min:1"],

            "items.*.sale_item_id" => [
                "required",
                "integer",
                "distinct",
                "exists:sale_items,id",
            ],

            "items.*.quantity" => [
                "required",
                "numeric",
                "gt:0",
                "decimal:0,3",
            ],

            "items.*.restock_quantity" => [
                "required",
                "numeric",
                "min:0",
                "decimal:0,3",
            ],

            "items.*.damaged_quantity" => [
                "required",
                "numeric",
                "min:0",
                "decimal:0,3",
            ],

            "items.*.notes" => ["nullable", "string", "max:1000"],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                foreach ($this->input("items", []) as $index => $item) {
                    $quantity = (float) ($item["quantity"] ?? 0);

                    $classifiedQuantity =
                        (float) ($item["restock_quantity"] ?? 0) +
                        (float) ($item["damaged_quantity"] ?? 0);

                    if (abs($quantity - $classifiedQuantity) > 0.0005) {
                        $validator
                            ->errors()
                            ->add(
                                "items.{$index}.quantity",
                                "Restock quantity plus damaged quantity must equal the returned quantity.",
                            );
                    }
                }
            },
        ];
    }
}
