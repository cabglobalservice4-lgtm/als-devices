# ALS Devices — site React

React 18, Vite, React Router, Tailwind CSS, `@supabase/supabase-js`. Voir le [README principal](../README.md) pour la mise en ligne.

```bash
npm install
cp .env.example .env
npm run dev        # http://localhost:5173
npm test           # tests automatiques
npm run build      # dist/ + pages pré-rendues, sitemap.xml, robots.txt, feeds/facebook.csv
```

## Organisation

```
src/
├── main.jsx            routes du site et du back-office
├── lib/
│   ├── supabase.js     client Supabase, adresses des photos
│   ├── backend.js      toutes les requêtes : catalogue, panier, commande, back-office
│   ├── api.js          point d'entrée unique des données, erreurs, téléchargements
│   ├── routes.js       table des adresses : route('products.show', 'iphone-13')
│   ├── shop.jsx        réglages, panier (localStorage), notifications, pixels Meta/TikTok
│   ├── auth.jsx        connexion de l'équipe (Supabase Auth)
│   ├── kit.jsx         liens, navigation, formulaires
│   ├── page.jsx        chargement des données d'une page
│   ├── markdown.js     texte des pages
│   ├── image.js        réduction des photos avant envoi
│   └── format.js       prix (FCFA / €), liens WhatsApp, suivi publicitaire
├── Layouts/  Components/  Pages/  css/
scripts/build-seo.mjs   après vite build : pages pré-rendues (SEO, aperçus WhatsApp), sitemap, flux Facebook
src/__tests__/          tests (vitest)
```

Couleurs et polices : `tailwind.config.js` (`ink` = noir, `als` = rouge, `bone` = blanc cassé ; titres Bricolage Grotesque, texte Geist).
