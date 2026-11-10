<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QuoteRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuoteRequestController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'phone' => ['required', 'string', 'min:6', 'max:30'],
            'need' => ['required', 'in:Laptops,Smartphones,Tablettes,Autre'],
            'quantity' => ['required', 'integer', 'min:1', 'max:10000'],
        ]);

        $quote = QuoteRequest::create($data);

        return response()->json(['message' => 'Demande enregistrée', 'id' => $quote->id], 201);
    }
}
