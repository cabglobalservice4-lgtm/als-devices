<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /** Produits d'exemple : remplacez par votre stock réel. */
    public function run(): void
    {
        $items = [
            ['Laptop 15,6" Core i5 / 8 Go / 512 Go', 'laptop', '💻', 350000, 420000, 'Promo', 'Idéal bureautique et études'],
            ['Laptop 14" Ryzen 7 / 16 Go / 512 Go', 'laptop', '💻', 480000, null, null, 'Performance et autonomie'],
            ['Smartphone 128 Go – Écran AMOLED', 'phone', '📱', 140000, 165000, 'Promo', 'Double SIM, 5G'],
            ['Smartphone 256 Go – Triple caméra', 'phone', '📱', 230000, null, 'Nouveau', 'Photo haute qualité'],
            ['Tablette 10,4" – 4 Go / 64 Go', 'tablet', '📲', 110000, null, null, 'Cours, vidéos, lecture'],
            ['Tablette 11" – 8 Go / 256 Go', 'tablet', '📲', 220000, null, 'Top', 'Créativité et productivité'],
        ];

        foreach ($items as [$name, $category, $icon, $price, $old, $badge, $note]) {
            Product::updateOrCreate(
                ['name' => $name],
                ['category' => $category, 'icon' => $icon, 'price' => $price,
                 'old_price' => $old, 'badge' => $badge, 'note' => $note, 'in_stock' => true]
            );
        }
    }
}
