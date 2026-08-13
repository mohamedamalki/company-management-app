<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CustomerController;
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
use App\Http\Controllers\Api\StockMovementController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\TaxRateController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\UserPermissionController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public routes
|--------------------------------------------------------------------------
*/

Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:5,1');

/*
|--------------------------------------------------------------------------
| Authenticated routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);


    Route::middleware('role:admin')->group(function () {
        Route::middleware('can:users.manage')->group(function () {
            Route::apiResource('users', UserController::class)
                ->except('destroy');
        });

        Route::get(
            '/location-assignments',
            [LocationAssignmentController::class, 'index']
        )->middleware('can:location-assignments.view');

        Route::post(
            '/location-assignments',
            [LocationAssignmentController::class, 'store']
        )->middleware('can:location-assignments.manage');

        Route::delete(
            '/location-assignments/{locationAssignment}',
            [LocationAssignmentController::class, 'destroy']
        )->middleware('can:location-assignments.manage');

        Route::prefix('admin')
            ->middleware('can:permissions.manage')
            ->group(function () {
                Route::get(
                    '/permissions',
                    [UserPermissionController::class, 'index']
                );

                Route::get(
                    '/users/{user}/permissions',
                    [UserPermissionController::class, 'show']
                );

                Route::put(
                    '/users/{user}/permissions',
                    [UserPermissionController::class, 'update']
                );
            });
    });


    Route::get(
        '/payment-methods/active',
        [PaymentMethodController::class, 'active']
    )->middleware('can:payment-methods.view');

    Route::get(
        '/tax-rates/active',
        [TaxRateController::class, 'active']
    )->middleware('can:tax-rates.view');

    Route::get(
        '/product-prices/current',
        [ProductPriceController::class, 'current']
    )->middleware('can:product-prices.view');

    Route::get(
        '/product-prices/catalogue',
        [ProductPriceController::class, 'catalogue']
    )->middleware('can:product-prices.view');

    Route::get(
        '/suppliers/active',
        [SupplierController::class, 'active']
    )->middleware('can:suppliers.view');

    Route::patch(
        '/purchase-orders/{purchaseOrder}/confirm',
        [PurchaseOrderController::class, 'confirm']
    )->middleware('can:purchase-orders.manage');

    Route::patch(
        '/purchase-orders/{purchaseOrder}/cancel',
        [PurchaseOrderController::class, 'cancel']
    )->middleware('can:purchase-orders.manage');

    Route::get(
        '/purchase-orders/{purchaseOrder}/pdf',
        [PurchaseOrderController::class, 'pdf']
    )->middleware('can:purchase-orders.view');

    Route::apiResource('locations', LocationController::class)
        ->except('destroy');

    Route::apiResource('categories', CategoryController::class)
        ->except('destroy');

    Route::apiResource('brands', BrandController::class)
        ->except('destroy');

    Route::get('/products/filter-options',[ProductController::class, 'filterOptions']);
    Route::apiResource('products', ProductController::class);

    Route::apiResource(
        'payment-methods',
        PaymentMethodController::class
    )->except('destroy');

    Route::apiResource('tax-rates', TaxRateController::class)
        ->except('destroy');

    Route::patch(
    '/purchase-orders/{purchaseOrder}/confirm',
    [
        PurchaseOrderController::class,
        'confirm',
    ]
    )->middleware('can:purchase-orders.confirm');

    Route::apiResource(
        'product-prices',
        ProductPriceController::class
    )->except('destroy');

    Route::apiResource('suppliers', SupplierController::class);

    Route::apiResource(
        'purchase-orders',
        PurchaseOrderController::class
    )->except('destroy');


    Route::get(
    '/location-stocks/options',
    [
        LocationStockController::class,
        'options',
    ]
    );

    Route::patch(
    '/location-stocks/{locationStock}/minimum-quantity',
    [
        LocationStockController::class,
        'updateMinimumQuantity',
    ]
    );


    Route::apiResource(
        'location-stocks',
        LocationStockController::class
    )->only([
        'index',
        'store',
        'show',
    ]);

    Route::apiResource(
        'stock-movements',
        StockMovementController::class
    )->only([
        'index',
        'store',
        'show',
    ]);

    Route::get('/purchase-receipts/receivable-orders',
        [
        PurchaseReceiptController::class,
        'receivableOrders',
        ]
        );

    Route::patch('/purchase-receipts/{purchaseReceipt}/validate',
        [
        PurchaseReceiptController::class,
        'validateReceipt',
        ]
        );

    Route::apiResource('purchase-receipts',PurchaseReceiptController::class);

    /*
|--------------------------------------------------------------------------
| Sales special routes
|--------------------------------------------------------------------------
*/

Route::get(
    '/customers/active',
    [
        CustomerController::class,
        'active',
    ]
);

Route::get(
    '/sales/options',
    [
        SaleController::class,
        'options',
    ]
);

Route::patch(
    '/sales/{sale}/confirm',
    [
        SaleController::class,
        'confirm',
    ]
);

Route::patch(
    '/sales/{sale}/cancel',
    [
        SaleController::class,
        'cancel',
    ]
);

Route::get(
    '/sales/{sale}/payments',
    [
        SalePaymentController::class,
        'index',
    ]
);

Route::post(
    '/sales/{sale}/payments',
    [
        SalePaymentController::class,
        'store',
    ]
);

/*
|--------------------------------------------------------------------------
| Sales resources
|--------------------------------------------------------------------------
*/

Route::apiResource(
    'customers',
    CustomerController::class
)->only([
    'index',
    'store',
    'show',
    'update',
]);

        Route::get(
        '/fournisseur/my-account',
        [FournisseurController::class, 'myAccount']
    );

    Route::apiResource(
        'fournisseurs',
        FournisseurController::class
    )->only([
        'index',
        'store',
        'show',
        'update',
    ]);

Route::apiResource(
    'sales',
    SaleController::class
)->only([
    'index',
    'store',
    'show',
    'update',
]);
});
