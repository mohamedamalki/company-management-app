<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\LocationAssignmentController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
Route::middleware(['auth:sanctum', 'role:admin'])->group(function(){
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::apiResource('users', UserController::class)
        ->except('destroy');
    Route::apiResource('locations', LocationController::class)
        ->except('destroy');
    Route::apiResource('categories', CategoryController::class)
        ->except('destroy');

    Route::apiResource('products', ProductController::class)
        ->except('destroy');

    Route::apiResource('brands', BrandController::class)
        ->except('destroy');

    Route::get('/location-assignments', [LocationAssignmentController::class, 'index']);

    Route::post('/location-assignments', [LocationAssignmentController::class, 'store']);

    Route::delete('/location-assignments/{locationAssignment}', [LocationAssignmentController::class, 'destroy']);
});
