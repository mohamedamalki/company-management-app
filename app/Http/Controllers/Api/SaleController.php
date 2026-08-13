<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CancelSaleRequest;
use App\Http\Requests\StoreSaleRequest;
use App\Http\Requests\UpdateSaleRequest;
use App\Models\Customer;
use App\Models\Location;
use App\Models\LocationStock;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SalePayment;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class SaleController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware("can:sales.view", only: ["index", "show"]),

            new Middleware(
                "can:sales.manage",
                only: ["store", "update", "options"],
            ),

            new Middleware("can:sales.confirm", only: ["confirm"]),

            new Middleware("can:sales.cancel", only: ["cancel"]),
        ];
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = min(max($request->integer("per_page", 15), 1), 100);

        $query = Sale::query()
            ->with([
                "customer:id,code,name,category",
                "location:id,name,code",
                "creator:id,name",
                "confirmedBy:id,name",
            ])
            ->withCount("items");

        $this->applyLocationScope($query, $request->user());

        $sales = $query
            ->when(
                $request->filled("status"),
                fn(Builder $query) => $query->where(
                    "status",
                    $request->input("status"),
                ),
            )
            ->when(
                $request->filled("payment_status"),
                fn(Builder $query) => $query->where(
                    "payment_status",
                    $request->input("payment_status"),
                ),
            )
            ->when($request->filled("search"), function (Builder $query) use (
                $request,
            ) {
                $search = trim($request->input("search"));

                $query->where(function (Builder $query) use ($search) {
                    $query
                        ->where("sale_number", "like", "%{$search}%")
                        ->orWhereHas(
                            "customer",
                            fn(Builder $query) => $query->where(
                                "name",
                                "like",
                                "%{$search}%",
                            ),
                        );
                });
            })
            ->latest("sale_date")
            ->paginate($perPage)
            ->withQueryString();

        $sales
            ->getCollection()
            ->transform(fn(Sale $sale) => $this->addRemainingAmount($sale));

        return response()->json($sales);
    }

    public function store(StoreSaleRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user();

        $applyTax = filter_var(
            $data["apply_tax"] ?? true,
            FILTER_VALIDATE_BOOLEAN,
        );

        $sale = DB::transaction(function () use ($data, $user, $applyTax) {
            $this->ensureUserCanAccessLocation(
                $user,
                (int) $data["location_id"],
            );

            $sale = Sale::create([
                "sale_number" => $this->generateSaleNumber(),

                "customer_id" => $data["customer_id"] ?? null,

                "location_id" => $data["location_id"],

                "created_by" => $user->id,

                "sale_date" => now(),

                "apply_tax" => $applyTax,

                "tax_exemption_reason" => $applyTax
                    ? null
                    : $data["tax_exemption_reason"] ?? null,

                "status" => Sale::STATUS_DRAFT,

                "payment_status" => Sale::PAYMENT_UNPAID,

                "notes" => $data["notes"] ?? null,
            ]);

            $this->replaceItemsAndTotals($sale, $data["items"], $applyTax);

            $sale->refresh();
            $sale->load("items");

            $this->confirmSaleAndUpdateStock($sale, $user);

            $this->recordInitialPayment($sale, $user, $data);

            return $sale;
        });

        return response()->json(
            [
                "message" => "Sale completed successfully.",

                "data" => $this->loadSale($sale),
            ],
            201,
        );
    }

    public function show(Request $request, Sale $sale): JsonResponse
    {
        $this->ensureUserCanAccessLocation(
            $request->user(),
            $sale->location_id,
        );

        return response()->json([
            "data" => $this->loadSale($sale),
        ]);
    }

    public function update(UpdateSaleRequest $request, Sale $sale): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user();

        $sale = DB::transaction(function () use ($data, $user, $sale) {
            $sale = Sale::query()->lockForUpdate()->findOrFail($sale->id);

            if ($sale->status !== Sale::STATUS_DRAFT) {
                throw ValidationException::withMessages([
                    "status" => "Only draft sales can be updated.",
                ]);
            }

            $applyTax = filter_var(
                $data["apply_tax"] ?? ($sale->apply_tax ?? true),
                FILTER_VALIDATE_BOOLEAN,
            );

            $this->ensureUserCanAccessLocation(
                $user,
                (int) $data["location_id"],
            );

            $sale->update([
                "customer_id" => $data["customer_id"] ?? null,

                "location_id" => $data["location_id"],

                "sale_date" => $data["sale_date"] ?? $sale->sale_date,

                "apply_tax" => $applyTax,

                "tax_exemption_reason" => $applyTax
                    ? null
                    : $data["tax_exemption_reason"] ??
                        $sale->tax_exemption_reason,

                "notes" => $data["notes"] ?? null,
            ]);

            $this->replaceItemsAndTotals($sale, $data["items"], $applyTax);

            return $sale;
        });

        return response()->json([
            "message" => "Sale updated successfully.",

            "data" => $this->loadSale($sale),
        ]);
    }

    /**
     * Confirm sale and subtract stock.
     */
    public function confirm(Request $request, Sale $sale): JsonResponse
    {
        $user = $request->user();

        $sale = DB::transaction(function () use ($sale, $user) {
            $sale = Sale::query()
                ->with("items")
                ->lockForUpdate()
                ->findOrFail($sale->id);

            $this->confirmSaleAndUpdateStock($sale, $user);

            return $sale;
        });

        return response()->json([
            "message" => "Sale confirmed and stock updated successfully.",

            "data" => $this->loadSale($sale),
        ]);
    }

    /**
     * Only draft sales can be cancelled.
     * Confirmed sales need a return feature.
     */
    public function cancel(CancelSaleRequest $request, Sale $sale): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user();

        $sale = DB::transaction(function () use ($data, $user, $sale) {
            $sale = Sale::query()->lockForUpdate()->findOrFail($sale->id);

            $this->ensureUserCanAccessLocation($user, $sale->location_id);

            if ($sale->status !== Sale::STATUS_DRAFT) {
                throw ValidationException::withMessages([
                    "status" =>
                        "Only draft sales can be cancelled. Use a sale return for confirmed sales.",
                ]);
            }

            $sale->status = Sale::STATUS_CANCELLED;

            $sale->cancelled_by = $user->id;

            $sale->cancelled_at = now();

            $sale->cancellation_reason = $data["cancellation_reason"];

            $sale->save();

            return $sale;
        });

        return response()->json([
            "message" => "Sale cancelled successfully.",

            "data" => $this->loadSale($sale),
        ]);
    }

    public function options(Request $request): JsonResponse
    {
        $validated = $request->validate([
            "location_id" => ["nullable", "integer", "exists:locations,id"],
        ]);

        $user = $request->user();

        /*
    |--------------------------------------------------------------------------
    | Accessible locations
    |--------------------------------------------------------------------------
    */

        if ($user->role === "admin") {
            $locations = Location::query()
                ->where("status", "active")
                ->select(["id", "name", "code", "type"])
                ->orderBy("name")
                ->get();
        } else {
            $locations = $user
                ->assignedLocations()
                ->where("locations.status", "active")
                ->select([
                    "locations.id",
                    "locations.name",
                    "locations.code",
                    "locations.type",
                ])
                ->orderBy("locations.name")
                ->get();
        }

        $locationId = isset($validated["location_id"])
            ? (int) $validated["location_id"]
            : null;

        /*
    |--------------------------------------------------------------------------
    | Prevent the user from using an unauthorized location
    |--------------------------------------------------------------------------
    */

        if ($locationId !== null && !$locations->contains("id", $locationId)) {
            return response()->json(
                [
                    "message" => "You do not have access to this location.",
                ],
                403,
            );
        }

        /*
    |--------------------------------------------------------------------------
    | Registered customers
    |--------------------------------------------------------------------------
    |
    | Walk-in customers are not returned because the frontend represents
    | them with customer_id = null.
    |
    */

        $customers = Customer::query()
            ->where("status", "active")
            ->select(["id", "code", "name", "category", "entity_type", "phone"])
            ->orderBy("name")
            ->get();

        /*
    |--------------------------------------------------------------------------
    | Products and their current prices
    |--------------------------------------------------------------------------
    */

        $products = Product::query()
            ->select([
                "products.id",
                "products.name",
                "products.reference",
                "products.unit",
                "products.category_id",
                "products.brand_id",
            ])
            ->with([
                "category:id,name",
                "brand:id,name",

                "currentGlobalPrice" => function ($query) {
                    $query->with([
                        "taxRate:id,name,code,rate",

                        "tiers" => function ($query) {
                            $query->orderBy("min_quantity");
                        },
                    ]);
                },
            ])
            ->whereHas("currentGlobalPrice")
            ->orderBy("products.name")
            ->get();

        /*
    |--------------------------------------------------------------------------
    | Stock quantities for the selected location
    |--------------------------------------------------------------------------
    */

        $stocksByProduct = collect();

        if ($locationId !== null) {
            $stocksByProduct = LocationStock::query()
                ->where("location_id", $locationId)
                ->pluck("quantity", "product_id");
        }

        $products->transform(function ($product) use (
            $locationId,
            $stocksByProduct,
        ) {
            $product->available_quantity =
                $locationId !== null
                    ? (float) $stocksByProduct->get($product->id, 0)
                    : null;

            return $product;
        });

        $paymentMethods = PaymentMethod::query()
            ->where("status", "active")
            ->select(["id", "name", "code", "requires_reference"])
            ->orderBy("name")
            ->get();

        return response()->json([
            "data" => [
                "locations" => $locations,
                "customers" => $customers,
                "products" => $products,
                "payment_methods" => $paymentMethods,
            ],
        ]);
    }

    private function confirmSaleAndUpdateStock(Sale $sale, User $user): void
    {
        if ($sale->status !== Sale::STATUS_DRAFT) {
            throw ValidationException::withMessages([
                "status" => "Only draft sales can be confirmed.",
            ]);
        }

        if ($sale->items->isEmpty()) {
            throw ValidationException::withMessages([
                "items" => "The sale must contain at least one product.",
            ]);
        }

        $this->ensureUserCanAccessLocation($user, $sale->location_id);

        foreach ($sale->items as $item) {
            $stock = LocationStock::query()
                ->where("location_id", $sale->location_id)
                ->where("product_id", $item->product_id)
                ->lockForUpdate()
                ->first();

            $availableQuantity = (float) ($stock?->quantity ?? 0);

            $soldQuantity = (float) $item->quantity;

            if (!$stock || $availableQuantity + 0.0005 < $soldQuantity) {
                throw ValidationException::withMessages([
                    "stock" => [
                        "Insufficient stock for product {$item->product_name}. Available: {$availableQuantity}.",
                    ],
                ]);
            }

            $quantityBefore = $availableQuantity;

            $quantityAfter = $quantityBefore - $soldQuantity;

            $stock->update([
                "quantity" => $quantityAfter,
            ]);

            $sale->stockMovements()->create([
                "location_id" => $sale->location_id,

                "product_id" => $item->product_id,

                "user_id" => $user->id,

                "type" => "sale_out",

                "quantity" => $soldQuantity,

                "quantity_before" => $quantityBefore,

                "quantity_after" => $quantityAfter,

                "notes" => "Generated from sale {$sale->sale_number}.",
            ]);
        }

        $sale->update([
            "status" => Sale::STATUS_CONFIRMED,

            "confirmed_by" => $user->id,

            "confirmed_at" => now(),
        ]);
    }

    private function recordInitialPayment(
        Sale $sale,
        User $user,
        array $data,
    ): void {
        $totalAmount = round((float) $sale->total_ttc, 2);

        // Walk-in and fournisseur sales may both be unpaid or partially paid.
        // A walk-in balance remains linked to the sale number because there is
        // no customer account attached to it.
        $paidAmount = round((float) ($data["paid_amount"] ?? 0), 2);

        if ($paidAmount < 0) {
            throw ValidationException::withMessages([
                "paid_amount" => "The paid amount cannot be negative.",
            ]);
        }

        if ($paidAmount > $totalAmount) {
            throw ValidationException::withMessages([
                "paid_amount" =>
                    "The paid amount cannot exceed the sale total.",
            ]);
        }

        if ($paidAmount > 0) {
            $paymentMethodId = $data["payment_method_id"] ?? null;

            if (!$paymentMethodId) {
                throw ValidationException::withMessages([
                    "payment_method_id" =>
                        "The payment method is required when an amount is paid.",
                ]);
            }

            $paymentMethod = PaymentMethod::query()
                ->where("status", "active")
                ->find($paymentMethodId);

            if (!$paymentMethod) {
                throw ValidationException::withMessages([
                    "payment_method_id" =>
                        "The selected payment method is invalid or inactive.",
                ]);
            }

            $reference = filled($data["payment_reference"] ?? null)
                ? trim($data["payment_reference"])
                : null;

            if ((bool) $paymentMethod->requires_reference && !$reference) {
                throw ValidationException::withMessages([
                    "payment_reference" =>
                        "The payment reference is required for this payment method.",
                ]);
            }

            $sale->payments()->create([
                "payment_number" => $this->generatePaymentNumber(),

                "payment_method_id" => $paymentMethod->id,

                "received_by" => $user->id,
                "amount" => $paidAmount,
                "reference" => $reference,
                "paid_at" => now(),
            ]);
        }

        $paymentStatus = match (true) {
            $paidAmount <= 0 => Sale::PAYMENT_UNPAID,

            $paidAmount < $totalAmount => Sale::PAYMENT_PARTIALLY_PAID,

            default => Sale::PAYMENT_PAID,
        };

        $sale->update([
            "paid_amount" => $paidAmount,
            "payment_status" => $paymentStatus,
        ]);
    }

    private function replaceItemsAndTotals(
        Sale $sale,
        array $items,
        bool $applyTax,
    ): void {
        $sale->items()->delete();

        $subtotalHt = 0;
        $discountTotal = 0;
        $taxTotal = 0;
        $totalTtc = 0;

        foreach ($items as $index => $itemData) {
            $product = Product::query()
                ->with([
                    "currentGlobalPrice.taxRate",
                    "currentGlobalPrice.tiers",
                ])
                ->findOrFail($itemData["product_id"]);

            $price = $product->currentGlobalPrice;

            if (!$price) {
                throw ValidationException::withMessages([
                    "items.{$index}.product_id" => "No active price is configured for {$product->name}.",
                ]);
            }

            $quantity = (float) $itemData["quantity"];

            $unitPriceHt = $this->resolveUnitPrice($price, $quantity);

            $grossHt = round($unitPriceHt * $quantity, 2);

            $discount = round((float) ($itemData["discount_amount"] ?? 0), 2);

            if ($discount > $grossHt) {
                throw ValidationException::withMessages([
                    "items.{$index}.discount_amount" => "The discount cannot exceed the line amount.",
                ]);
            }

            $lineHt = round($grossHt - $discount, 2);

            $taxRate = $applyTax ? (float) ($price->taxRate?->rate ?? 0) : 0.0;

            $taxAmount = round(($lineHt * $taxRate) / 100, 2);

            $lineTtc = round($lineHt + $taxAmount, 2);

            $sale->items()->create([
                "product_id" => $product->id,

                "product_name" => $product->name,

                "product_reference" => $product->reference,

                "unit" => $product->unit,

                "quantity" => $quantity,

                "unit_price_ht" => $unitPriceHt,

                "discount_amount" => $discount,

                "tax_rate" => $taxRate,

                "total_ht" => $lineHt,

                "tax_amount" => $taxAmount,

                "total_ttc" => $lineTtc,
            ]);

            $subtotalHt += $grossHt;
            $discountTotal += $discount;
            $taxTotal += $taxAmount;
            $totalTtc += $lineTtc;
        }

        $sale->update([
            "subtotal_ht" => round($subtotalHt, 2),

            "discount_total" => round($discountTotal, 2),

            "tax_total" => round($taxTotal, 2),

            "total_ttc" => round($totalTtc, 2),
        ]);
    }

    private function resolveUnitPrice(object $price, float $quantity): float
    {
        $tier = $price->tiers
            ->filter(fn($tier) => (float) $tier->min_quantity <= $quantity)
            ->sortByDesc(fn($tier) => (float) $tier->min_quantity)
            ->first();

        $value = $tier?->unit_price_ht ?? ($price->sale_price_ht ?? null);

        if ($value === null) {
            throw ValidationException::withMessages([
                "price" => "The product price is not configured correctly.",
            ]);
        }

        return round((float) $value, 2);
    }

    private function ensureUserCanAccessLocation(
        User $user,
        int $locationId,
    ): void {
        if ($this->isAdmin($user)) {
            return;
        }

        $hasAccess = $user
            ->assignedLocations()
            ->whereKey($locationId)
            ->exists();

        abort_unless($hasAccess, 403, "You are not assigned to this location.");
    }

    private function applyLocationScope(Builder $query, User $user): void
    {
        if ($this->isAdmin($user)) {
            return;
        }

        $query->whereIn(
            "location_id",
            $user->assignedLocations()->select("locations.id"),
        );
    }

    private function isAdmin(User $user): bool
    {
        return $user->role === "admin" || $user->hasRole("admin");
    }

    private function generateSaleNumber(): string
    {
        return "SAL-" .
            now()->format("Ymd-His") .
            "-" .
            Str::upper(Str::random(6));
    }

    private function generatePaymentNumber(): string
    {
        do {
            $number =
                "PAY-" .
                now()->format("Ymd-His") .
                "-" .
                Str::upper(Str::random(6));
        } while (
            SalePayment::query()->where("payment_number", $number)->exists()
        );

        return $number;
    }

    private function loadSale(Sale $sale): Sale
    {
        $sale->load([
            "customer:id,code,name,category",
            "location:id,name,code",
            "creator:id,name",
            "confirmedBy:id,name",
            "cancelledBy:id,name",
            "items.product:id,name,reference,unit",
            "payments.paymentMethod:id,name,code",
            "payments.receiver:id,name",
        ]);

        return $this->addRemainingAmount($sale);
    }

    private function addRemainingAmount(Sale $sale): Sale
    {
        $sale->setAttribute(
            "remaining_amount",
            round(
                max((float) $sale->total_ttc - (float) $sale->paid_amount, 0),
                2,
            ),
        );

        return $sale;
    }
}
