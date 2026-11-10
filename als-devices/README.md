# ALS Devices – boutique en ligne (React + Laravel)

Site vitrine et boutique pour **ALS Devices** (laptops, téléphones, tablettes) et **ALS Connect** (offres entreprises).

- `frontend/` : React 18 + Vite (interface, filtres produits, formulaire de devis)
- `backend/`  : API Laravel (produits, demandes de devis). Ce dossier contient uniquement **vos fichiers** à copier dans un projet Laravel neuf.

## 1. Backend (Laravel 11 ou 12, PHP 8.2+)

```bash
composer create-project laravel/laravel api-als
cd api-als
php artisan install:api            # active routes/api.php (Sanctum)
```

Copiez ensuite le contenu de `backend/` par-dessus `api-als/` (mêmes chemins), puis :

```bash
# dans database/seeders/DatabaseSeeder.php, ajoutez dans run() :
#   $this->call(ProductSeeder::class);
php artisan migrate --seed
php artisan serve                  # http://127.0.0.1:8000
```

Routes :
| Méthode | URL | Rôle |
|---|---|---|
| GET | `/api/products?category=laptop` | Liste des produits (catégorie facultative) |
| POST | `/api/quotes` | Enregistre une demande de devis |

Pour la production, mettez dans `.env` : une vraie base (MySQL), `APP_ENV=production`, `APP_DEBUG=false`. Si le frontend est sur un autre domaine, publiez la config CORS (`php artisan config:publish cors`) et limitez `allowed_origins` à ce domaine.

## 2. Frontend (Node 18+)

```bash
cd frontend
cp .env.example .env               # mettez votre numéro WhatsApp
npm install
npm run dev                        # http://localhost:5173 (proxy /api -> Laravel)
npm run build                      # production : dossier dist/
```

En production, mettez `VITE_API_URL=https://votre-api.com/api` avant `npm run build`.

## Gérer les produits

Pour l'instant via le seeder (`database/seeders/ProductSeeder.php`) ou `php artisan tinker`. Un espace d'administration (ex. Filament) peut être ajouté ensuite.
