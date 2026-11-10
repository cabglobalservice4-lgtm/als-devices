<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category' => ['nullable', 'in:laptop,phone,tablet,accessory'],
        ]);

        $products = Product::query()
            ->where('in_stock', true)
            ->when($validated['category'] ?? null, fn ($q, $c) => $q->where('category', $c))
            ->orderByDesc('id')
            ->get();

        return response()->json(['data' => $products]);
    }
}
