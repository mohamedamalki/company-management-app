<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\LocationAssignmentController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\PaymentMethodController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProductPriceController;
use App\Http\Controllers\Api\PurchaseOrderController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\TaxRateController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/payment-methods/active', [PaymentMethodController::class, 'active']);
    Route::get('/tax-rates/active', [TaxRateController::class, 'active']);
    Route::get('/product-prices/current',[ProductPriceController::class, 'current']);
    Route::get('/me', [AuthController::class, 'me']);
});

Route::middleware(['auth:sanctum', 'role:admin'])->group(function(){

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::apiResource('users', UserController::class)
        ->except('destroy');
    Route::apiResource('locations', LocationController::class)
        ->except('destroy');
    Route::apiResource('categories', CategoryController::class)
        ->except('destroy');

    Route::apiResource('products', ProductController::class);

    Route::apiResource('brands', BrandController::class)
        ->except('destroy');

    Route::get('/location-assignments', [LocationAssignmentController::class, 'index']);

    Route::post('/location-assignments', [LocationAssignmentController::class, 'store']);

    Route::delete('/location-assignments/{locationAssignment}', [LocationAssignmentController::class, 'destroy']);

    Route::apiResource('payment-methods', PaymentMethodController::class)->except(['destroy',]);

    Route::apiResource('tax-rates', TaxRateController::class)->except('destroy');

    Route::apiResource('product-prices', ProductPriceController::class)->except('destroy');

    Route::get('/product-prices/catalogue', [ProductPriceController::class, 'catalogue']);

    Route::get('/suppliers/active', [SupplierController::class, 'active']);

    Route::apiResource('suppliers', SupplierController::class);

    Route::patch('/purchase-orders/{purchaseOrder}/cancel',[PurchaseOrderController::class,'cancel']);
    Route::patch('/purchase-orders/{purchaseOrder}/confirm',[PurchaseOrderController::class, 'confirm']);

    Route::get('/purchase-orders/{purchaseOrder}/pdf',[PurchaseOrderController::class,'pdf']);

    Route::apiResource('purchase-orders',PurchaseOrderController::class)->except(['destroy']);
});
