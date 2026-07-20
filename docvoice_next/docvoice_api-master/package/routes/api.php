<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes for LaraCore Package
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your package. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group.
|
*/

// API version prefix is automatically added by RouteServiceProvider
Route::middleware('auth:sanctum')->group(function () {
    // Protected API routes
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});

// Test route for role middleware
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/test-role', function () {
        return response()->json([
            'status' => true,
            'message' => 'Role middleware is working correctly',
            'user' => auth()->user()
        ]);
    })->name('api.test.role');
});

// Public API routes - Examples removed as controller doesn't exist

// Helper API routes
Route::prefix('helpers')->group(function () {
    Route::get('/price', function () {
        $helpers = app('laracore.helpers');
        return response()->json([
            'status' => true,
            'data' => [
                'formatted_price' => $helpers->price()->format(100.50, 'SAR'),
                'percentage' => $helpers->price()->percentage(25, 100),
                'discount' => $helpers->price()->discount(100, 20),
                'final_price' => $helpers->price()->finalPrice(100, 20)
            ]
        ]);
    })->name('api.helpers.price');

    Route::get('/file', function () {
        $helpers = app('laracore.helpers');
        return response()->json([
            'status' => true,
            'data' => [
                'extension' => $helpers->file()->getExtension('document.pdf'),
                'name' => $helpers->file()->getName('important_document.pdf'),
                'size_formatted' => $helpers->file()->formatSize(1048576),
                'is_image' => $helpers->file()->isImage('photo.jpg'),
                'unique_name' => $helpers->file()->uniqueName('document.pdf')
            ]
        ]);
    })->name('api.helpers.file');

    Route::get('/user', function () {
        $helpers = app('laracore.helpers');
        return response()->json([
            'status' => true,
            'data' => [
                'initials' => $helpers->user()->getInitials('أحمد محمد علي'),
                'masked_email' => $helpers->file()->maskEmail('ahmed@example.com'),
                'masked_phone' => $helpers->user()->maskPhone('0501234567'),
                'age' => $helpers->user()->getAge('1990-05-15'),
                'is_adult' => $helpers->user()->isAdult('1990-05-15')
            ]
        ]);
    })->name('api.helpers.user');
});

// Health check route
Route::get('/health', function () {
    return response()->json([
        'status' => 'healthy',
        'package' => 'LaraCore',
        'version' => '1.0.0',
        'timestamp' => now()->toISOString()
    ]);
})->name('api.health');
