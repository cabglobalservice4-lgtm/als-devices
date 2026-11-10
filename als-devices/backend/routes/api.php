<?php

use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\QuoteRequestController;
use Illuminate\Support\Facades\Route;

Route::get('/products', [ProductController::class, 'index']);

// Limite anti-spam : 10 demandes par minute et par IP
Route::post('/quotes', [QuoteRequestController::class, 'store'])->middleware('throttle:10,1');
