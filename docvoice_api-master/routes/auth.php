<?php

use App\Http\Controllers\AdminAuthController;
use App\Http\Controllers\DriverAuthController;
use App\Http\Controllers\UserAuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Authentication Routes
|--------------------------------------------------------------------------
|
| Here is where you can register authentication routes for your application.
| These routes handle authentication for Admin, Driver, and User.
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return response()->json([
        'status' => true,
        'code' => 200,
        'message' => 'User retrieved successfully',
        'payload' => $request->user(),
    ]);
});

// Admin Authentication Routes
// Route::prefix('admin')->group(function () {
//     // Public routes (no authentication required)
//     Route::post('/register', [AdminAuthController::class, 'register']);
//     Route::post('/login', [AdminAuthController::class, 'login']);

//     // Protected routes (authentication required)
//     Route::middleware('auth:sanctum')->group(function () {
//         Route::post('/logout', [AdminAuthController::class, 'logout']);
//         Route::post('/logout-all', [AdminAuthController::class, 'logoutAll']);
//         Route::get('/profile', [AdminAuthController::class, 'profile']);
//         Route::put('/profile', [AdminAuthController::class, 'updateProfile']);
//         Route::post('/change-password', [AdminAuthController::class, 'changePassword']);
//     });
// });

// Driver Authentication Routes
// Route::prefix('driver')->group(function () {
//     // Public routes (no authentication required)
//     Route::post('/register', [DriverAuthController::class, 'register']);
//     Route::post('/login', [DriverAuthController::class, 'login']);

//     // Protected routes (authentication required)
//     Route::middleware('auth:sanctum')->group(function () {
//         Route::post('/logout', [DriverAuthController::class, 'logout']);
//         Route::post('/logout-all', [DriverAuthController::class, 'logoutAll']);
//         Route::get('/profile', [DriverAuthController::class, 'profile']);
//         Route::put('/profile', [DriverAuthController::class, 'updateProfile']);
//         Route::post('/change-password', [DriverAuthController::class, 'changePassword']);
//     });
// });

// User Authentication Routes
Route::prefix('auth')->middleware(['api'])->group(function () {
    // Public routes (no authentication required)
    Route::post('/register', [UserAuthController::class, 'register']);
    Route::post('/login', [UserAuthController::class, 'login']);

    // Protected routes (authentication required)
    Route::middleware('auth:sanctum')->group(function () {
        // Route::post('/logout', [UserAuthController::class, 'logout']);
        // Route::post('/logout-all', [UserAuthController::class, 'logoutAll']);

        Route::get('/user', [UserAuthController::class, 'profile']);
        Route::get('/profile', [UserAuthController::class, 'profile']);
        Route::put('/profile', [UserAuthController::class, 'updateProfile']);
        Route::post('/change-password', [UserAuthController::class, 'changePassword']);
    });

    // Login by ID (for development/testing)
    Route::post('/login-by-id', [UserAuthController::class, 'loginById']);
});
