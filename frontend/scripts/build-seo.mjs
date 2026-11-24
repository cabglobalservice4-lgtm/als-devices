// Lancé APRÈS « vite build » (npm run build). Écrit dans dist/ :
//  - une page HTML par produit, rayon et page de contenu, avec le bon titre, la description,
//    la photo (Open Graph) et les données structurées : Google, WhatsApp et Facebook les lisent
//    sans exécuter le JavaScript, puis React prend le relais normalement ;
//  - sitemap.xml, robots.txt et le flux catalogue Facebook (feeds/facebook.csv).
// Ne fait jamais échouer le build : sans accès à Supabase, le site reste un site React classique.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const DIST = 'dist';

function loadEnv() {
    const env = { ...process.env };
    for (const f of ['.env', '.env.production', '.env.local']) {
        if (!existsSync(f)) continue;
        for (const line of readFileSync(f, 'utf8').split(/\r?\n/)) {
            const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
            if (m && env[m[1]] === undefined) env[m[1]] = m[2];
        }
    }
    return env;
}

const env = loadEnv();
const SUPABASE_URL = (env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;
const host = env.VITE_SITE_URL || (env.VERCEL_PROJECT_PRODUCTION_URL && `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`) || (env.VERCEL_URL && `https://${env.VERCEL_URL}`);
const SITE = (host || '').replace(/\/$/, '');

const write = (path, content) => { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, content); };
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const money = (n, sym) => `${new Intl.NumberFormat('fr-FR').format(Number(n)).replace(/\u202F/g, ' ')} ${sym}`;

async function rest(path) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    return res.json();
}

/** Copie de index.html avec un <head> propre à la page. */
function pageHtml(template, { title, description, url, image, type = 'website', jsonLd }) {
    const tags = [
        `<title>${esc(title)}</title>`,
        `<meta name="description" content="${esc(description)}" />`,
        `<link rel="canonical" href="${esc(url)}" />`,
        `<meta property="og:type" content="${type}" />`,
        `<meta property="og:site_name" content="ALS Devices" />`,
        `<meta property="og:title" content="${esc(title)}" />`,
        `<meta property="og:description" content="${esc(description)}" />`,
        `<meta property="og:url" content="${esc(url)}" />`,
        image ? `<meta property="og:image" content="${esc(image)}" />` : '',
        `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />`,
        jsonLd ? `<script type="application/ld+json" id="jsonld">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>` : '',
    ].filter(Boolean).join('\n        ');
    return template
        .replace(/<title>[\s\S]*?<\/title>\s*/, '')
        .replace(/<meta name="description"[^>]*>\s*/, '')
        .replace('</head>', `        ${tags}\n    </head>`);
}

try {
    if (!existsSync(`${DIST}/index.html`)) throw new Error('dist/index.html absent : lancer vite build avant');
    const template = readFileSync(`${DIST}/index.html`, 'utf8');
    write(`${DIST}/robots.txt`, `User-agent: *\nDisallow: /admin\nDisallow: /commande\nDisallow: /panier\n${SITE ? `Sitemap: ${SITE}/sitemap.xml\n` : ''}`);

    if (!SUPABASE_URL || !KEY) throw new Error('variables Supabase absentes');
    if (!SITE) throw new Error('adresse du site inconnue (ajoutez VITE_SITE_URL)');

    const [cats, products, pages, settings] = await Promise.all([
        rest('als_categories?select=name,slug,description,meta_title,meta_description,updated_at'),
        rest('als_products?select=name,slug,short_description,meta_title,meta_description,condition,grade,min_price,total_stock,updated_at,brand:als_brands(name),images:als_product_images(path,position),variants:als_product_variants(sku,color,storage,price,stock,is_active)&is_active=eq.true'),
        rest('als_pages?select=title,slug,meta_description,body,updated_at&is_published=eq.true'),
        rest('als_settings?select=data&id=eq.1'),
    ]);
    const s = settings[0]?.data || {};
    const currency = s.currency || 'XOF';
    const sym = s.currency_symbol || 'FCFA';
    const img = (p) => {
        const path = [...(p.images || [])].sort((a, b) => a.position - b.position)[0]?.path;
        return !path ? null : /^https?:/.test(path) ? path : `${SUPABASE_URL}/storage/v1/object/public/als-devices/${path}`;
    };

    // Pages produits
    for (const p of products) {
        const url = `${SITE}/produit/${p.slug}`;
        const label = p.condition === 'refurbished' ? ` reconditionné${p.grade ? ` grade ${p.grade}` : ''}` : '';
        const active = p.variants.filter((v) => v.is_active);
        write(`${DIST}/produit/${p.slug}/index.html`, pageHtml(template, {
            title: `${p.meta_title || p.name + label} — ${money(p.min_price, sym)} | ALS Devices`,
            description: p.meta_description || p.short_description || `${p.name}${label}, testé et garanti. Livraison à Dakar, paiement à la livraison.`,
            url, image: img(p), type: 'product',
            jsonLd: {
                '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.short_description || undefined,
                brand: p.brand ? { '@type': 'Brand', name: p.brand.name } : undefined, image: img(p) || undefined,
                itemCondition: p.condition === 'new' ? 'https://schema.org/NewCondition' : 'https://schema.org/RefurbishedCondition',
                offers: active.map((v) => ({ '@type': 'Offer', sku: v.sku, price: Number(v.price), priceCurrency: currency, url,
                    availability: v.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' })),
            },
        }));
    }
    // Rayons
    for (const c of cats) {
        write(`${DIST}/boutique/${c.slug}/index.html`, pageHtml(template, {
            title: `${c.meta_title || c.name} | ALS Devices`, description: c.meta_description || c.description || `${c.name} neufs et reconditionnés à Dakar.`,
            url: `${SITE}/boutique/${c.slug}`,
        }));
    }
    // Pages de contenu
    for (const pg of pages) {
        write(`${DIST}/page/${pg.slug}/index.html`, pageHtml(template, {
            title: `${pg.title} | ALS Devices`, description: pg.meta_description || pg.body.replace(/[#*_\[\]()>-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 155),
            url: `${SITE}/page/${pg.slug}`,
        }));
    }

    // Plan du site
    const u = (loc, lastmod, priority) => `<url><loc>${esc(loc)}</loc>${lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : ''}<priority>${priority}</priority></url>`;
    write(`${DIST}/sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[
        u(`${SITE}/`, null, '1.0'), u(`${SITE}/boutique`, null, '0.9'),
        ...cats.map((c) => u(`${SITE}/boutique/${c.slug}`, c.updated_at, '0.8')),
        ...products.map((p) => u(`${SITE}/produit/${p.slug}`, p.updated_at, '0.7')),
        ...pages.map((p) => u(`${SITE}/page/${p.slug}`, p.updated_at, '0.3')),
    ].join('')}</urlset>\n`);

    // Flux Meta (Facebook / Instagram Shop) : Commerce Manager › Catalogue › Sources de données › Flux programmé
    const csv = (v) => { const x = String(v ?? ''); return /[",\n]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x; };
    const rows = [['id', 'title', 'description', 'availability', 'condition', 'price', 'link', 'image_link', 'brand', 'item_group_id', 'color', 'size']];
    for (const p of products) for (const v of p.variants.filter((x) => x.is_active)) {
        rows.push([v.sku, [p.name, v.storage, v.color].filter(Boolean).join(' '), p.short_description || p.name, v.stock > 0 ? 'in stock' : 'out of stock',
            p.condition === 'new' ? 'new' : 'refurbished', `${Number(v.price).toFixed(2)} ${currency}`, `${SITE}/produit/${p.slug}`, img(p) || '', p.brand?.name || '', p.slug, v.color || '', v.storage || '']);
    }
    write(`${DIST}/feeds/facebook.csv`, rows.map((r) => r.map(csv).join(',')).join('\n') + '\n');

    console.log(`✓ SEO : ${products.length} fiches produits, ${cats.length} rayons et ${pages.length} pages pré-rendus, sitemap et flux Facebook pour ${SITE}`);
} catch (e) {
    console.warn(`⚠ SEO : pré-rendu ignoré (${e.message}). Le site fonctionne quand même.`);
}
