<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Location;
use App\Models\LocationStock;
use App\Models\PurchaseReceipt;
use App\Models\PurchaseReceiptItem;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SaleReturn;
use App\Models\StockMovement;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class DashboardController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware(
                "can:dashboard.view",
                only: ["options", "analytics"],
            ),
        ];
    }

    /**
     * Return the locations available to the authenticated user.
     */
    public function options(Request $request): JsonResponse
    {
        return response()->json([
            "data" => [
                "locations" => $this->accessibleLocations($request->user()),
            ],
        ]);
    }

    /**
     * Return the complete dashboard analysis.
     */
    public function analytics(Request $request): JsonResponse
    {
        $filters = $this->validatedFilters($request);
        $locations = $this->accessibleLocations($request->user());

        $selectedLocationId = isset($filters["location_id"])
            ? (int) $filters["location_id"]
            : null;

        if (
            $selectedLocationId !== null &&
            !$locations->contains(
                fn(Location $location) => $location->id === $selectedLocationId,
            )
        ) {
            abort(403, "You do not have access to this location.");
        }

        $locationIds =
            $selectedLocationId !== null
                ? collect([$selectedLocationId])
                : $locations->pluck("id");

        [
            "start" => $start,
            "end" => $end,
            "previous_start" => $previousStart,
            "previous_end" => $previousEnd,
            "label" => $periodLabel,
        ] = $this->periodRange($filters["period"], $filters["date"]);

        $sales = $this->salesMetrics($locationIds, $start, $end);

        $previousSales = $this->salesMetrics(
            $locationIds,
            $previousStart,
            $previousEnd,
        );

        $purchases = $this->purchaseMetrics($locationIds, $start, $end);

        $previousPurchases = $this->purchaseMetrics(
            $locationIds,
            $previousStart,
            $previousEnd,
        );

        $returns = $this->returnMetrics($locationIds, $start, $end);

        $stock = $this->stockMetrics($locationIds);

        return response()->json([
            "data" => [
                "period_label" => $periodLabel,

                "summary" => [
                    "revenue_ttc" => $sales["revenue_ttc"],

                    "net_revenue_ttc" => round(
                        $sales["revenue_ttc"] - $returns["returns_total_ttc"],
                        2,
                    ),

                    "sales_count" => $sales["sales_count"],

                    "products_sold" => $sales["products_sold"],

                    "purchase_total_ttc" => $purchases["purchase_total_ttc"],

                    "purchases_count" => $purchases["purchases_count"],

                    "returns_total_ttc" => $returns["returns_total_ttc"],

                    "returns_count" => $returns["returns_count"],

                    "stock_quantity" => $stock["stock_quantity"],

                    "stock_value_ht" => $stock["stock_value_ht"],

                    "low_stock_count" => $stock["low_stock_count"],

                    "out_of_stock_count" => $stock["out_of_stock_count"],
                ],

                "comparison" => [
                    "revenue_change" => $this->percentageChange(
                        $sales["revenue_ttc"],
                        $previousSales["revenue_ttc"],
                    ),

                    "sales_change" => $this->percentageChange(
                        $sales["sales_count"],
                        $previousSales["sales_count"],
                    ),

                    "products_sold_change" => $this->percentageChange(
                        $sales["products_sold"],
                        $previousSales["products_sold"],
                    ),

                    "purchase_change" => $this->percentageChange(
                        $purchases["purchase_total_ttc"],
                        $previousPurchases["purchase_total_ttc"],
                    ),
                ],

                "chart" => $this->chartData(
                    $locationIds,
                    $filters["period"],
                    $start,
                    $end,
                ),

                "top_products" => $this->topProducts(
                    $locationIds,
                    $start,
                    $end,
                ),

                "location_performance" =>
                    $selectedLocationId === null
                        ? $this->locationPerformance($locations, $start, $end)
                        : [],

                "recent_activity" => $this->recentActivity(
                    $locationIds,
                    $start,
                    $end,
                ),
            ],
        ]);
    }

    /**
     * Validate the selected location and period.
     */
    private function validatedFilters(Request $request): array
    {
        $data = Validator::make($request->all(), [
            "location_id" => ["nullable", "integer", "exists:locations,id"],

            "period" => [
                "nullable",
                "string",
                Rule::in(["day", "month", "year"]),
            ],

            "date" => ["nullable", "string", "max:10"],
        ])->validate();

        $period = $data["period"] ?? "month";
        $date = $data["date"] ?? $this->defaultDate($period);

        $pattern = match ($period) {
            "day" => '/^\d{4}-\d{2}-\d{2}$/',
            "month" => '/^\d{4}-\d{2}$/',
            "year" => '/^\d{4}$/',
        };

        if (!preg_match($pattern, $date)) {
            throw ValidationException::withMessages([
                "date" => match ($period) {
                    "day" => "The date must use the format YYYY-MM-DD.",
                    "month" => "The date must use the format YYYY-MM.",
                    "year" => "The date must use the format YYYY.",
                },
            ]);
        }

        try {
            $this->periodRange($period, $date);
        } catch (\Throwable) {
            throw ValidationException::withMessages([
                "date" => "The selected date is invalid.",
            ]);
        }

        return [
            "location_id" => $data["location_id"] ?? null,
            "period" => $period,
            "date" => $date,
        ];
    }

    /**
     * Build the current and previous date intervals.
     * The end date is exclusive.
     */
    private function periodRange(string $period, string $date): array
    {
        $parts = array_map("intval", explode("-", $date));

        $start = match ($period) {
            "day" => CarbonImmutable::createSafe(
                $parts[0],
                $parts[1],
                $parts[2],
            )->startOfDay(),

            "month" => CarbonImmutable::createSafe(
                $parts[0],
                $parts[1],
                1,
            )->startOfMonth(),

            "year" => CarbonImmutable::createSafe(
                $parts[0],
                1,
                1,
            )->startOfYear(),
        };

        $end = match ($period) {
            "day" => $start->addDay(),
            "month" => $start->addMonth(),
            "year" => $start->addYear(),
        };

        $previousStart = match ($period) {
            "day" => $start->subDay(),
            "month" => $start->subMonth(),
            "year" => $start->subYear(),
        };

        $label = match ($period) {
            "day" => $start->format("d M Y"),
            "month" => $start->format("F Y"),
            "year" => $start->format("Y"),
        };

        return [
            "start" => $start,
            "end" => $end,
            "previous_start" => $previousStart,
            "previous_end" => $start,
            "label" => $label,
        ];
    }

    private function defaultDate(string $period): string
    {
        return match ($period) {
            "day" => now()->format("Y-m-d"),
            "month" => now()->format("Y-m"),
            "year" => now()->format("Y"),
        };
    }

    /**
     * Admin sees every active location. Other users only see assignments.
     */
    private function accessibleLocations(User $user): Collection
    {
        if ($this->isAdmin($user)) {
            return Location::query()
                ->where("status", "active")
                ->select(["id", "name", "code", "type"])
                ->orderBy("name")
                ->get();
        }

        return $user
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

    private function salesMetrics(
        Collection $locationIds,
        CarbonImmutable $start,
        CarbonImmutable $end,
    ): array {
        $saleMetrics = Sale::query()
            ->whereIn("location_id", $locationIds)
            ->where("status", Sale::STATUS_CONFIRMED)
            ->where("sale_date", ">=", $start)
            ->where("sale_date", "<", $end)
            ->selectRaw(
                'COUNT(*) as sales_count,
                COALESCE(SUM(total_ttc), 0) as revenue_ttc',
            )
            ->first();

        $productsSold = SaleItem::query()
            ->join("sales", "sales.id", "=", "sale_items.sale_id")
            ->whereIn("sales.location_id", $locationIds)
            ->where("sales.status", Sale::STATUS_CONFIRMED)
            ->where("sales.sale_date", ">=", $start)
            ->where("sales.sale_date", "<", $end)
            ->sum("sale_items.quantity");

        return [
            "sales_count" => (int) ($saleMetrics?->sales_count ?? 0),

            "revenue_ttc" => round(
                (float) ($saleMetrics?->revenue_ttc ?? 0),
                2,
            ),

            "products_sold" => round((float) $productsSold, 3),
        ];
    }

    private function purchaseMetrics(
        Collection $locationIds,
        CarbonImmutable $start,
        CarbonImmutable $end,
    ): array {
        $metrics = PurchaseReceiptItem::query()
            ->join(
                "purchase_receipts",
                "purchase_receipts.id",
                "=",
                "purchase_receipt_items.purchase_receipt_id",
            )
            ->join(
                "purchase_order_items",
                "purchase_order_items.id",
                "=",
                "purchase_receipt_items.purchase_order_item_id",
            )
            ->whereIn("purchase_receipts.location_id", $locationIds)
            ->where(
                "purchase_receipts.status",
                PurchaseReceipt::STATUS_VALIDATED,
            )
            ->where("purchase_receipts.validated_at", ">=", $start)
            ->where("purchase_receipts.validated_at", "<", $end)
            ->selectRaw(
                'COUNT(DISTINCT purchase_receipts.id)
                    as purchases_count,
                COALESCE(SUM(
                    purchase_receipt_items.accepted_quantity *
                    purchase_order_items.unit_price_ht *
                    (1 + purchase_order_items.tax_rate / 100)
                ), 0) as purchase_total_ttc',
            )
            ->first();

        return [
            "purchases_count" => (int) ($metrics?->purchases_count ?? 0),

            "purchase_total_ttc" => round(
                (float) ($metrics?->purchase_total_ttc ?? 0),
                2,
            ),
        ];
    }

    private function returnMetrics(
        Collection $locationIds,
        CarbonImmutable $start,
        CarbonImmutable $end,
    ): array {
        $metrics = SaleReturn::query()
            ->whereIn("location_id", $locationIds)
            ->where("status", SaleReturn::STATUS_VALIDATED)
            ->where("validated_at", ">=", $start)
            ->where("validated_at", "<", $end)
            ->selectRaw(
                'COUNT(*) as returns_count,
                COALESCE(SUM(total_ttc), 0)
                    as returns_total_ttc',
            )
            ->first();

        return [
            "returns_count" => (int) ($metrics?->returns_count ?? 0),

            "returns_total_ttc" => round(
                (float) ($metrics?->returns_total_ttc ?? 0),
                2,
            ),
        ];
    }

    /**
     * Stock value uses the current global selling price HT.
     */
    private function stockMetrics(Collection $locationIds): array
    {
        $stocks = LocationStock::query()
            ->whereIn("location_id", $locationIds)
            ->with([
                // Do not restrict columns here. currentGlobalPrice uses a
                // latest-of-many query and unqualified columns can become
                // ambiguous in MySQL.
                "product.currentGlobalPrice",
            ])
            ->get([
                "id",
                "location_id",
                "product_id",
                "quantity",
                "minimum_quantity",
            ]);

        $stockValue = $stocks->sum(
            fn(LocationStock $stock) => (float) $stock->quantity *
                (float) ($stock->product?->currentGlobalPrice?->sale_price_ht ??
                    0),
        );

        return [
            "stock_quantity" => round((float) $stocks->sum("quantity"), 3),

            "stock_value_ht" => round($stockValue, 2),

            "low_stock_count" => $stocks
                ->filter(
                    fn(LocationStock $stock) => (float) $stock->quantity > 0 &&
                        (float) $stock->quantity <=
                            (float) $stock->minimum_quantity,
                )
                ->count(),

            "out_of_stock_count" => $stocks
                ->filter(
                    fn(LocationStock $stock) => (float) $stock->quantity <= 0,
                )
                ->count(),
        ];
    }

    private function chartData(
        Collection $locationIds,
        string $period,
        CarbonImmutable $start,
        CarbonImmutable $end,
    ): array {
        $saleExpression = $this->bucketExpression("sales.sale_date", $period);

        $purchaseExpression = $this->bucketExpression(
            "purchase_receipts.validated_at",
            $period,
        );

        $sales = Sale::query()
            ->whereIn("sales.location_id", $locationIds)
            ->where("sales.status", Sale::STATUS_CONFIRMED)
            ->where("sales.sale_date", ">=", $start)
            ->where("sales.sale_date", "<", $end)
            ->selectRaw(
                "{$saleExpression} as bucket,
                COALESCE(SUM(sales.total_ttc), 0) as total",
            )
            ->groupBy("bucket")
            ->pluck("total", "bucket");

        $purchases = PurchaseReceiptItem::query()
            ->join(
                "purchase_receipts",
                "purchase_receipts.id",
                "=",
                "purchase_receipt_items.purchase_receipt_id",
            )
            ->join(
                "purchase_order_items",
                "purchase_order_items.id",
                "=",
                "purchase_receipt_items.purchase_order_item_id",
            )
            ->whereIn("purchase_receipts.location_id", $locationIds)
            ->where(
                "purchase_receipts.status",
                PurchaseReceipt::STATUS_VALIDATED,
            )
            ->where("purchase_receipts.validated_at", ">=", $start)
            ->where("purchase_receipts.validated_at", "<", $end)
            ->selectRaw(
                "{$purchaseExpression} as bucket,
                COALESCE(SUM(
                    purchase_receipt_items.accepted_quantity *
                    purchase_order_items.unit_price_ht *
                    (1 + purchase_order_items.tax_rate / 100)
                ), 0) as total",
            )
            ->groupBy("bucket")
            ->pluck("total", "bucket");

        $result = [];
        $cursor = $start;

        while ($cursor->lessThan($end)) {
            $key = $this->bucketKey($cursor, $period);

            $result[] = [
                "label" => $this->bucketLabel($cursor, $period),

                "revenue_ttc" => round((float) ($sales[$key] ?? 0), 2),

                "purchase_total_ttc" => round(
                    (float) ($purchases[$key] ?? 0),
                    2,
                ),
            ];

            $cursor = match ($period) {
                "day" => $cursor->addHour(),
                "month" => $cursor->addDay(),
                "year" => $cursor->addMonth(),
            };
        }

        return $result;
    }

    private function bucketExpression(string $column, string $period): string
    {
        return match ($period) {
            "day" => "DATE_FORMAT({$column}, '%Y-%m-%d %H:00:00')",
            "month" => "DATE_FORMAT({$column}, '%Y-%m-%d')",
            "year" => "DATE_FORMAT({$column}, '%Y-%m-01')",
        };
    }

    private function bucketKey(CarbonImmutable $date, string $period): string
    {
        return match ($period) {
            "day" => $date->format("Y-m-d H:00:00"),
            "month" => $date->format("Y-m-d"),
            "year" => $date->format("Y-m-01"),
        };
    }

    private function bucketLabel(CarbonImmutable $date, string $period): string
    {
        return match ($period) {
            "day" => $date->format("H:i"),
            "month" => $date->format("d M"),
            "year" => $date->format("M"),
        };
    }

    private function topProducts(
        Collection $locationIds,
        CarbonImmutable $start,
        CarbonImmutable $end,
    ): Collection {
        return SaleItem::query()
            ->join("sales", "sales.id", "=", "sale_items.sale_id")
            ->whereIn("sales.location_id", $locationIds)
            ->where("sales.status", Sale::STATUS_CONFIRMED)
            ->where("sales.sale_date", ">=", $start)
            ->where("sales.sale_date", "<", $end)
            ->select([
                "sale_items.product_id",
                "sale_items.product_name as name",
                "sale_items.product_reference as reference",
                "sale_items.unit",
            ])
            ->selectRaw(
                'SUM(sale_items.quantity) as quantity_sold,
                SUM(sale_items.total_ttc) as revenue_ttc',
            )
            ->groupBy([
                "sale_items.product_id",
                "sale_items.product_name",
                "sale_items.product_reference",
                "sale_items.unit",
            ])
            ->orderByDesc("quantity_sold")
            ->limit(5)
            ->get()
            ->map(
                fn(SaleItem $item) => [
                    "product_id" => $item->product_id,
                    "name" => $item->name,
                    "reference" => $item->reference,
                    "unit" => $item->unit,
                    "quantity_sold" => round((float) $item->quantity_sold, 3),
                    "revenue_ttc" => round((float) $item->revenue_ttc, 2),
                ],
            );
    }

    private function locationPerformance(
        Collection $locations,
        CarbonImmutable $start,
        CarbonImmutable $end,
    ): Collection {
        $locationIds = $locations->pluck("id");

        $sales = Sale::query()
            ->whereIn("location_id", $locationIds)
            ->where("status", Sale::STATUS_CONFIRMED)
            ->where("sale_date", ">=", $start)
            ->where("sale_date", "<", $end)
            ->selectRaw(
                'location_id,
                COUNT(*) as sales_count,
                COALESCE(SUM(total_ttc), 0) as revenue_ttc',
            )
            ->groupBy("location_id")
            ->get()
            ->keyBy("location_id");

        $productsSold = SaleItem::query()
            ->join("sales", "sales.id", "=", "sale_items.sale_id")
            ->whereIn("sales.location_id", $locationIds)
            ->where("sales.status", Sale::STATUS_CONFIRMED)
            ->where("sales.sale_date", ">=", $start)
            ->where("sales.sale_date", "<", $end)
            ->selectRaw(
                'sales.location_id,
                COALESCE(SUM(sale_items.quantity), 0)
                    as products_sold',
            )
            ->groupBy("sales.location_id")
            ->get()
            ->keyBy("location_id");

        $returns = SaleReturn::query()
            ->whereIn("location_id", $locationIds)
            ->where("status", SaleReturn::STATUS_VALIDATED)
            ->where("validated_at", ">=", $start)
            ->where("validated_at", "<", $end)
            ->selectRaw(
                'location_id,
                COALESCE(SUM(total_ttc), 0) as returns_total',
            )
            ->groupBy("location_id")
            ->get()
            ->keyBy("location_id");

        $stocks = LocationStock::query()
            ->whereIn("location_id", $locationIds)
            ->selectRaw(
                'location_id,
                COALESCE(SUM(quantity), 0) as stock_quantity,
                SUM(
                    CASE
                        WHEN quantity > 0
                        AND quantity <= minimum_quantity
                        THEN 1
                        ELSE 0
                    END
                ) as low_stock_count',
            )
            ->groupBy("location_id")
            ->get()
            ->keyBy("location_id");

        return $locations
            ->map(function (Location $location) use (
                $sales,
                $productsSold,
                $returns,
                $stocks,
            ) {
                $revenue =
                    (float) ($sales->get($location->id)?->revenue_ttc ?? 0);

                $returned =
                    (float) ($returns->get($location->id)?->returns_total ?? 0);

                return [
                    "id" => $location->id,
                    "name" => $location->name,
                    "code" => $location->code,
                    "type" => $location->type,

                    "net_revenue_ttc" => round($revenue - $returned, 2),

                    "sales_count" =>
                        (int) ($sales->get($location->id)?->sales_count ?? 0),

                    "products_sold" => round(
                        (float) ($productsSold->get($location->id)
                            ?->products_sold ?? 0),
                        3,
                    ),

                    "stock_quantity" => round(
                        (float) ($stocks->get($location->id)?->stock_quantity ??
                            0),
                        3,
                    ),

                    "low_stock_count" =>
                        (int) ($stocks->get($location->id)?->low_stock_count ??
                            0),
                ];
            })
            ->sortByDesc("net_revenue_ttc")
            ->values();
    }

    private function recentActivity(
        Collection $locationIds,
        CarbonImmutable $start,
        CarbonImmutable $end,
    ): Collection {
        $sales = Sale::query()
            ->with(["location:id,name,code", "customer:id,name"])
            ->whereIn("location_id", $locationIds)
            ->where("status", Sale::STATUS_CONFIRMED)
            ->where("sale_date", ">=", $start)
            ->where("sale_date", "<", $end)
            ->latest("sale_date")
            ->limit(7)
            ->get()
            ->map(
                fn(Sale $sale) => [
                    "id" => $sale->id,
                    "type" => "sale",
                    "title" => $sale->sale_number,
                    "subtitle" => implode(" · ", [
                        $sale->location?->name ?? "Unknown location",
                        $sale->customer?->name ?? "Walk-in customer",
                    ]),
                    "amount" => round((float) $sale->total_ttc, 2),
                    "status" => $sale->status,
                    "occurred_at" => $sale->sale_date,
                ],
            );

        $receipts = PurchaseReceipt::query()
            ->with(["location:id,name,code", "purchaseOrder.supplier:id,name"])
            ->whereIn("location_id", $locationIds)
            ->where("status", PurchaseReceipt::STATUS_VALIDATED)
            ->where("validated_at", ">=", $start)
            ->where("validated_at", "<", $end)
            ->latest("validated_at")
            ->limit(7)
            ->get()
            ->map(
                fn(PurchaseReceipt $receipt) => [
                    "id" => $receipt->id,
                    "type" => "purchase_receipt",
                    "title" => $receipt->receipt_number,
                    "subtitle" => implode(" · ", [
                        $receipt->location?->name ?? "Unknown location",
                        $receipt->purchaseOrder?->supplier?->name ??
                        "Unknown supplier",
                    ]),
                    "amount" => null,
                    "status" => $receipt->status,
                    "occurred_at" => $receipt->validated_at,
                ],
            );

        $returns = SaleReturn::query()
            ->with(["location:id,name,code", "sale.customer:id,name"])
            ->whereIn("location_id", $locationIds)
            ->where("status", SaleReturn::STATUS_VALIDATED)
            ->where("validated_at", ">=", $start)
            ->where("validated_at", "<", $end)
            ->latest("validated_at")
            ->limit(7)
            ->get()
            ->map(
                fn(SaleReturn $return) => [
                    "id" => $return->id,
                    "type" => "sale_return",
                    "title" => $return->return_number,
                    "subtitle" => implode(" · ", [
                        $return->location?->name ?? "Unknown location",
                        $return->sale?->customer?->name ?? "Walk-in customer",
                    ]),
                    "amount" => -round((float) $return->total_ttc, 2),
                    "status" => $return->status,
                    "occurred_at" => $return->validated_at,
                ],
            );

        $movements = StockMovement::query()
            ->with([
                "location:id,name,code",
                "product:id,name,reference",
                "user:id,name",
            ])
            ->whereIn("location_id", $locationIds)
            ->where("created_at", ">=", $start)
            ->where("created_at", "<", $end)
            ->latest()
            ->limit(7)
            ->get()
            ->map(
                fn(StockMovement $movement) => [
                    "id" => $movement->id,
                    "type" => "stock_movement",
                    "title" => $movement->product?->name ?? "Stock movement",
                    "subtitle" => implode(" · ", [
                        $movement->location?->name ?? "Unknown location",
                        str_replace("_", " ", $movement->type),
                    ]),
                    "amount" => null,
                    "status" => $movement->type,
                    "occurred_at" => $movement->created_at,
                ],
            );

        return collect()
            ->concat($sales)
            ->concat($receipts)
            ->concat($returns)
            ->concat($movements)
            ->sortByDesc(
                fn(array $activity) => $activity[
                    "occurred_at"
                ]?->getTimestamp() ?? 0,
            )
            ->take(7)
            ->values();
    }

    private function percentageChange(
        float|int $current,
        float|int $previous,
    ): ?float {
        if ((float) $previous === 0.0) {
            return null;
        }

        return round(
            (((float) $current - (float) $previous) / abs((float) $previous)) *
                100,
            1,
        );
    }

    private function isAdmin(User $user): bool
    {
        return $user->role === "admin" || $user->hasRole("admin");
    }
}
