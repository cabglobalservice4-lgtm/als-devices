# ALS Devices — boutique en ligne (React + Supabase)

Boutique en ligne d'ALS Devices : smartphones, tablettes, ordinateurs, objets connectés et accessoires, **neufs et reconditionnés**.

Deux briques seulement, sans serveur à gérer :

```
als-devices/
├── frontend/    site React 18 (Vite + React Router + Tailwind) : boutique + back-office  → Vercel
└── supabase/    base PostgreSQL, sécurité (RLS), logique de commande et de stock      → Supabase
```

- **Supabase** stocke tout (produits, stock, commandes, pages, réglages), gère la connexion de l'équipe et les photos.
- La **sécurité est dans la base** : un visiteur ne peut que lire le catalogue et passer commande ; les prix et le stock sont recalculés par la fonction SQL `als_place_order`, pas par le navigateur.
- Toutes les tables commencent par `als_` : elles cohabitent avec les autres tables déjà présentes dans le projet Supabase sans les toucher.

## Démarrer en local

```bash
cd frontend
npm install
cp .env.example .env      # déjà rempli avec l'adresse et la clé publique du projet Supabase
npm run dev               # http://localhost:5173
```

Back-office : http://localhost:5173/admin

## Premier accès au back-office

1. Supabase › **Authentication › Users › Add user** : créez votre compte (e-mail + mot de passe, cochez *Auto Confirm User*).
2. Connectez-vous sur `/admin/connexion` : **le tout premier compte qui se connecte devient propriétaire**.
3. Pour ajouter un employé : créez son compte de la même façon, puis back-office › Réglages › Équipe.

## Mise en ligne (Vercel)

| Réglage Vercel | Valeur |
|---|---|
| Root Directory | `frontend` |
| Framework | Vite (fixé par `frontend/vercel.json`) |
| Variable `VITE_SUPABASE_URL` | `https://pavtymkgaxlxfhicmdet.supabase.co` |
| Variable `VITE_SUPABASE_PUBLISHABLE_KEY` | la clé *publishable* (Supabase › Project Settings › API Keys) |
| Variable `VITE_SITE_URL` | l'adresse finale du site, ex. `https://alsdevices.com` (sitemap et flux Facebook) |

Supprimez les anciennes variables `VITE_API_URL` et `VITE_MOCK` si elles existent.

## Base de données

Les scripts sont dans `supabase/` et **sont déjà appliqués** sur le projet `pavtymkgaxlxfhicmdet` :

| Fichier | Contenu |
|---|---|
| `migrations/…_als_01_schema.sql` | tables, index, recalcul automatique du prix mini et du stock |
| `migrations/…_als_02_security.sql` | règles RLS, bucket photos `als-devices` |
| `migrations/…_als_03_functions.sql` | commande, suivi, annulation avec remise en stock, enregistrement produit, tableau de bord, équipe |
| `seed.sql` | réglages, catégories, marques, zones de livraison, pages |
| `remove_demo_products.sql` | supprime les 11 produits de démonstration avant l'ouverture |

Pour un nouveau projet Supabase : exécuter les trois migrations puis `seed.sql` dans *SQL Editor*.

## Qualité

```bash
cd frontend
npm test        # tests automatiques (prix, panier, import CSV, sécurité du texte des pages…)
npm run build   # site + pages pré-rendues pour Google/WhatsApp (dist/)
```

- Sans les variables Supabase, le site affiche un écran qui explique quoi régler sur Vercel (au lieu d'une page cassée).
- Les photos sont réduites dans le navigateur avant l'envoi (WebP, 1600 px) : une photo de 6 Mo passe à environ 300 Ko.
- Après une commande, le client envoie le détail complet à la boutique sur WhatsApp en un clic.

## Ce que fait le site

| Côté client | Côté back-office (`/admin`) |
|---|---|
| Catalogue filtrable (marque, état, grade, stockage, budget), recherche | Tableau de bord : CA du mois vs seuil de rentabilité, ventes 30 j, origine Facebook / TikTok, stock bas |
| Fiche produit avec **fiche de contrôle** (grade, batterie, garantie) | Produits, variantes, stock, IMEI (visible équipe seulement), photos |
| Panier, commande **sans compte**, livraison par zone ou retrait | Import du catalogue depuis un tableur CSV |
| Paiement à la livraison, Wave, Orange Money | Commandes : statuts, paiement, suivi, export CSV ; annulation = remise en stock |
| Suivi de commande + facture imprimable / PDF | Réglages : boutique (WhatsApp, paiements, pixels), catégories, zones, pages, avis, équipe |

## Limites de cette version sans serveur

- **E-mails** : pas d'e-mail automatique au client ni d'alerte de commande. Les nouvelles commandes apparaissent dans le tableau de bord ; le client garde sa page de suivi et sa facture. *Suite possible : une Edge Function Supabase + Resend.*
- **Facture** : page imprimable (« Enregistrer en PDF » du navigateur) au lieu d'un PDF joint par e-mail.
- **Pages pré-rendues, sitemap et flux Facebook** : générés à chaque déploiement Vercel (titre, prix, photo de chaque fiche pour Google, WhatsApp et Facebook). Redéployez après avoir ajouté des produits pour qu'ils y apparaissent ; le site lui-même est toujours à jour.
