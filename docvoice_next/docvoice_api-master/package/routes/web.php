<?php

use Illuminate\Support\Facades\Route;
use LaraCore\Http\Controllers\ExampleController;

/*
|--------------------------------------------------------------------------
| Web Routes for LaraCore Package
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your package. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group.
|
*/

// Example routes
Route::get('/example', [ExampleController::class, 'index'])->name('laracore.example.index');
Route::get('/example/create', [ExampleController::class, 'create'])->name('laracore.example.create');
Route::post('/example', [ExampleController::class, 'store'])->name('laracore.example.store');
Route::get('/example/{id}', [ExampleController::class, 'show'])->name('laracore.example.show');
Route::get('/example/{id}/edit', [ExampleController::class, 'edit'])->name('laracore.example.edit');
Route::put('/example/{id}', [ExampleController::class, 'update'])->name('laracore.example.update');
Route::delete('/example/{id}', [ExampleController::class, 'destroy'])->name('laracore.example.destroy');

// Test route
Route::get('/test', [ExampleController::class, 'test'])->name('laracore.test');

// Dashboard route
Route::get('/dashboard', function () {
    return view('laracore::dashboard');
})->name('laracore.dashboard');

// Helper demo routes
Route::get('/helpers/price', function () {
    $helpers = app('laracore.helpers');
    return [
        'formatted_price' => $helpers->price()->format(100.50, 'SAR'),
        'percentage' => $helpers->price()->percentage(25, 100),
        'discount' => $helpers->price()->discount(100, 20),
        'final_price' => $helpers->price()->finalPrice(100, 20)
    ];
})->name('laracore.helpers.price');

Route::get('/helpers/file', function () {
    $helpers = app('laracore.helpers');
    return [
        'extension' => $helpers->file()->getExtension('document.pdf'),
        'name' => $helpers->file()->getName('important_document.pdf'),
        'size_formatted' => $helpers->file()->formatSize(1048576),
        'is_image' => $helpers->file()->isImage('photo.jpg'),
        'unique_name' => $helpers->file()->uniqueName('document.pdf')
    ];
})->name('laracore.helpers.file');

Route::get('/helpers/user', function () {
    $helpers = app('laracore.helpers');
    return [
        'initials' => $helpers->user()->getInitials('أحمد محمد علي'),
        'masked_email' => $helpers->user()->maskEmail('ahmed@example.com'),
        'masked_phone' => $helpers->user()->maskPhone('0501234567'),
        'age' => $helpers->user()->getAge('1990-05-15'),
        'is_adult' => $helpers->user()->isAdult('1990-05-15')
    ];
})->name('laracore.helpers.user');
