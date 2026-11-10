<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('category', ['laptop', 'phone', 'tablet', 'accessory']);
            $table->string('icon', 8)->default('📦');
            $table->unsignedInteger('price');          // en FCFA
            $table->unsignedInteger('old_price')->nullable();
            $table->string('badge', 30)->nullable();
            $table->string('note')->nullable();
            $table->boolean('in_stock')->default(true);
            $table->timestamps();

            $table->index('category');
        });

        Schema::create('quote_requests', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('phone', 30);
            $table->string('need', 50);
            $table->unsignedInteger('quantity')->default(1);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quote_requests');
        Schema::dropIfExists('products');
    }
};
