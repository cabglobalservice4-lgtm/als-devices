<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'name', 'category', 'icon', 'price', 'old_price', 'badge', 'note', 'in_stock',
    ];

    protected $casts = [
        'price' => 'integer',
        'old_price' => 'integer',
        'in_stock' => 'boolean',
    ];
}
