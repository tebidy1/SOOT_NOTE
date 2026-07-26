<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ExcelImportController;
use LaraCore\Http\Controllers\ExampleController;

Route::get('/test', [ExampleController::class, 'test']);

Route::get('/', function () {
    return view('welcome');
})->name('home');

// Single sheet import routes
Route::get('/excel-import', [ExcelImportController::class, 'showImportForm'])->name('excel.import.form');
Route::post('/excel-import', [ExcelImportController::class, 'import'])->name('excel.import');

// Multi-sheet import routes
Route::get('/excel-import/multi-sheet', [ExcelImportController::class, 'showMultiSheetImport'])->name('excel.import.multi-sheet.form');
Route::post('/excel-import/multi-sheet', [ExcelImportController::class, 'importMultiSheet'])->name('excel.import.multi-sheet');
Route::post('/excel-import/preview-sheets', [ExcelImportController::class, 'previewSheets'])->name('excel.preview-sheets');
Route::post('/excel-import/import-sheet/{sheetName}', [ExcelImportController::class, 'importSheetData'])->name('excel.import.sheet');

// Audio Transcription Page
Route::get('/transcribe', function () {
    return view('transcribe');
})->name('transcribe.form');

// Field extraction now happens inline in applyMacro — no separate analyze routes.
