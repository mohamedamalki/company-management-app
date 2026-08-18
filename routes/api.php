<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\ExpenseCategoryController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\ExpensePaymentController;
use App\Http\Controllers\Api\FournisseurController;
use App\Http\Controllers\Api\LocationAssignmentController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\LocationStockController;
use App\Http\Controllers\Api\PaymentMethodController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProductPriceController;
use App\Http\Controllers\Api\PurchaseOrderController;
use App\Http\Controllers\Api\PurchaseReceiptController;
use App\Http\Controllers\Api\SaleController;
use App\Http\Controllers\Api\SalePaymentController;
use App\Http\Controllers\Api\SaleRefundController;
use App\Http\Controllers\Api\SaleReturnController;
use App\Http\Controllers\Api\StockMovementController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\TaxRateController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\UserPermissionController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\SalaryController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public routes
|--------------------------------------------------------------------------
*/

Route::post("/login", [AuthController::class, "login"])->middleware(
    "throttle:5,1",
);

/*
|--------------------------------------------------------------------------
| Authenticated routes
|--------------------------------------------------------------------------
*/

Route::middleware("auth:sanctum")->group(function () {
    Route::get("/me", [AuthController::class, "me"]);

    Route::post("/logout", [AuthController::class, "logout"]);

    /*
    |----------------------------------------------------------------------
    | Admin access management
    |----------------------------------------------------------------------
    */

    Route::middleware("role:admin")->group(function () {
        Route::middleware("can:users.manage")->group(function () {
            Route::apiResource("users", UserController::class)->except(
                "destroy",
            );
        });

        Route::get("/location-assignments", [
            LocationAssignmentController::class,
            "index",
        ])->middleware("can:location-assignments.view");

        Route::post("/location-assignments", [
            LocationAssignmentController::class,
            "store",
        ])->middleware("can:location-assignments.manage");

        Route::delete("/location-assignments/{locationAssignment}", [
            LocationAssignmentController::class,
            "destroy",
        ])->middleware("can:location-assignments.manage");

        Route::prefix("admin")
            ->middleware("can:permissions.manage")
            ->group(function () {
                Route::get("/permissions", [
                    UserPermissionController::class,
                    "index",
                ]);

                Route::get("/users/{user}/permissions", [
                    UserPermissionController::class,
                    "show",
                ]);

                Route::put("/users/{user}/permissions", [
                    UserPermissionController::class,
                    "update",
                ]);
            });
    });

    /*
    |----------------------------------------------------------------------
    | Selection and filter options
    |----------------------------------------------------------------------
    |
    | Keep static endpoints before apiResource endpoints so values such as
    | "active" and "options" are not treated as model identifiers.
    |
    */

    Route::get("/payment-methods/active", [
        PaymentMethodController::class,
        "active",
    ])->middleware("can:payment-methods.view");

    Route::get("/tax-rates/active", [
        TaxRateController::class,
        "active",
    ])->middleware("can:tax-rates.view");

    Route::get("/product-prices/current", [
        ProductPriceController::class,
        "current",
    ])->middleware("can:product-prices.view");

    Route::get("/product-prices/catalogue", [
        ProductPriceController::class,
        "catalogue",
    ])->middleware("can:product-prices.view");

    Route::get("/suppliers/active", [
        SupplierController::class,
        "active",
    ])->middleware("can:suppliers.view");

    Route::get("/products/filter-options", [
        ProductController::class,
        "filterOptions",
    ])->middleware("can:products.view");

    Route::get("/location-stocks/options", [
        LocationStockController::class,
        "options",
    ])->middleware("can:location-stocks.manage");

    Route::get("/purchase-receipts/receivable-orders", [
        PurchaseReceiptController::class,
        "receivableOrders",
    ])->middleware("can:purchase-receipts.manage");

    Route::get("/customers/active", [CustomerController::class, "active"]);

    Route::get("/sales/options", [
        SaleController::class,
        "options",
    ])->middleware("can:sales.manage");

    /*
    |----------------------------------------------------------------------
    | Purchase-order actions
    |----------------------------------------------------------------------
    */

    Route::patch("/purchase-orders/{purchaseOrder}/confirm", [
        PurchaseOrderController::class,
        "confirm",
    ])->middleware("can:purchase-orders.confirm");

    Route::patch("/purchase-orders/{purchaseOrder}/cancel", [
        PurchaseOrderController::class,
        "cancel",
    ])->middleware("can:purchase-orders.cancel");

    Route::get("/purchase-orders/{purchaseOrder}/pdf", [
        PurchaseOrderController::class,
        "pdf",
    ])->middleware("can:purchase-orders.view");

    /*
    |----------------------------------------------------------------------
    | Location-stock and purchase-receipt actions
    |----------------------------------------------------------------------
    */

    Route::patch("/location-stocks/{locationStock}/minimum-quantity", [
        LocationStockController::class,
        "updateMinimumQuantity",
    ])->middleware("can:location-stocks.manage");

    Route::patch("/purchase-receipts/{purchaseReceipt}/validate", [
        PurchaseReceiptController::class,
        "validateReceipt",
    ])->middleware("can:purchase-receipts.manage");

    /*
    |----------------------------------------------------------------------
    | Sale actions and remaining payments
    |----------------------------------------------------------------------
    */

    Route::patch("/sales/{sale}/confirm", [
        SaleController::class,
        "confirm",
    ])->middleware("can:sales.confirm");

    Route::patch("/sales/{sale}/cancel", [
        SaleController::class,
        "cancel",
    ])->middleware("can:sales.cancel");

    Route::get("/sale-balances", [SalePaymentController::class, "outstanding"]);

    Route::get("/sales/{sale}/payments", [
        SalePaymentController::class,
        "index",
    ]);

    Route::post("/sales/{sale}/payments", [
        SalePaymentController::class,
        "store",
    ]);

    Route::get("/fournisseur/my-account", [
        FournisseurController::class,
        "myAccount",
    ]);

    /*
    |----------------------------------------------------------------------
    | Business resources
    |----------------------------------------------------------------------
    |
    | Most resource permissions are defined by HasMiddleware inside their
    | controllers. Every route in this group is also protected by Sanctum.
    |
    */

    Route::apiResource("locations", LocationController::class)->except(
        "destroy",
    );

    Route::apiResource("categories", CategoryController::class)->except(
        "destroy",
    );

    Route::apiResource("brands", BrandController::class)->except("destroy");

    Route::apiResource("products", ProductController::class);

    Route::apiResource(
        "payment-methods",
        PaymentMethodController::class,
    )->except("destroy");

    Route::apiResource("tax-rates", TaxRateController::class)->except(
        "destroy",
    );

    Route::apiResource("product-prices", ProductPriceController::class)->except(
        "destroy",
    );

    Route::apiResource("suppliers", SupplierController::class);

    Route::apiResource(
        "purchase-orders",
        PurchaseOrderController::class,
    )->except("destroy");

    Route::apiResource("location-stocks", LocationStockController::class)->only(
        ["index", "store", "show"],
    );

    Route::apiResource("stock-movements", StockMovementController::class)->only(
        ["index", "store", "show"],
    );

    Route::apiResource(
        "purchase-receipts",
        PurchaseReceiptController::class,
    )->except("destroy");

    Route::apiResource("customers", CustomerController::class)->only([
        "index",
        "store",
        "show",
        "update",
    ]);

    Route::apiResource("fournisseurs", FournisseurController::class)->only([
        "index",
        "store",
        "show",
        "update",
    ]);

    Route::apiResource("sales", SaleController::class)->only([
        "index",
        "store",
        "show",
        "update",
    ]);

    Route::get(
    '/sale-returns/options',
    [SaleReturnController::class, 'options']
);

Route::patch(
    '/sale-returns/{saleReturn}/validate',
    [SaleReturnController::class, 'validateReturn']
);

Route::patch(
    '/sale-returns/{saleReturn}/cancel',
    [SaleReturnController::class, 'cancel']
);

Route::get(
    '/sale-returns/{saleReturn}/refunds',
    [SaleRefundController::class, 'index']
);

Route::post(
    '/sale-returns/{saleReturn}/refunds',
    [SaleRefundController::class, 'store']
);

Route::apiResource(
    'sale-returns',
    SaleReturnController::class
)->only([
    'index',
    'store',
    'show',
    'update',
]);

Route::get(
    '/dashboard/options',
    [DashboardController::class, 'options']
)->middleware('can:dashboard.view');

Route::get(
    '/dashboard/analytics',
    [DashboardController::class, 'analytics']
)->middleware('can:dashboard.view');
Route::get("/expenses/options", [ExpenseController::class, "options"]);

Route::patch("/expenses/{expense}/approve", [
    ExpenseController::class,
    "approve",
]);

Route::patch("/expenses/{expense}/cancel", [
    ExpenseController::class,
    "cancel",
]);

Route::get("/expenses/{expense}/payments", [
    ExpensePaymentController::class,
    "index",
]);

Route::post("/expenses/{expense}/payments", [
    ExpensePaymentController::class,
    "store",
]);

Route::apiResource(
    "expense-categories",
    ExpenseCategoryController::class,
)->only(["index", "store", "show", "update"]);

Route::apiResource("expenses", ExpenseController::class)->only([
    "index",
    "store",
    "show",
    "update",
]);
    Route::post('/expenses/{expense}/mark-paid', [ExpenseController::class, 'markPaid']);


    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);

    Route::apiResource('employees', EmployeeController::class);
    Route::apiResource('salaries', SalaryController::class);
});
