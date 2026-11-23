// Génère au moment du build : sitemap.xml, robots.txt et le flux catalogue Facebook.
// Lancé automatiquement par « npm run build » (Vercel). Ne bloque jamais le build.
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';

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
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;
const host = env.VITE_SITE_URL || (env.VERCEL_PROJECT_PRODUCTION_URL && `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`) || (env.VERCEL_URL && `https://${env.VERCEL_URL}`);
const SITE = (host || '').replace(/\/$/, '');

const write = (path, content) => { mkdirSync(path.split('/').slice(0, -1).join('/'), { recursive: true }); writeFileSync(path, content); };

async function rest(path) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    return res.json();
}

try {
    if (!SUPABASE_URL || !KEY) throw new Error('variables Supabase absentes');
    write('public/robots.txt', `User-agent: *\nDisallow: /admin\nDisallow: /commande\nDisallow: /panier\n${SITE ? `Sitemap: ${SITE}/sitemap.xml\n` : ''}`);
    if (!SITE) throw new Error('adresse du site inconnue (VITE_SITE_URL)');

    const [cats, products, pages, settings] = await Promise.all([
        rest('als_categories?select=slug,updated_at'),
        rest('als_products?select=name,slug,short_description,condition,updated_at,brand:als_brands(name),images:als_product_images(path,position),variants:als_product_variants(sku,color,storage,price,stock,is_active)&is_active=eq.true'),
        rest('als_pages?select=slug,updated_at&is_published=eq.true'),
        rest('als_settings?select=data&id=eq.1'),
    ]);

    const url = (loc, lastmod, priority) => `<url><loc>${loc}</loc>${lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : ''}<priority>${priority}</priority></url>`;
    write('public/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[
        url(`${SITE}/`, null, '1.0'), url(`${SITE}/boutique`, null, '0.9'),
        ...cats.map((c) => url(`${SITE}/boutique/${c.slug}`, c.updated_at, '0.8')),
        ...products.map((p) => url(`${SITE}/produit/${p.slug}`, p.updated_at, '0.7')),
        ...pages.map((p) => url(`${SITE}/page/${p.slug}`, p.updated_at, '0.3')),
    ].join('')}</urlset>\n`);

    // Flux Meta (Facebook / Instagram Shop) : Commerce Manager › Catalogue › Sources de données › Flux programmé
    const currency = settings[0]?.data?.currency || 'XOF';
    const img = (p) => {
        const path = [...(p.images || [])].sort((a, b) => a.position - b.position)[0]?.path;
        return !path ? '' : /^https?:/.test(path) ? path : `${SUPABASE_URL}/storage/v1/object/public/als-devices/${path}`;
    };
    const esc = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const rows = [['id', 'title', 'description', 'availability', 'condition', 'price', 'link', 'image_link', 'brand', 'item_group_id', 'color', 'size']];
    for (const p of products) for (const v of p.variants.filter((x) => x.is_active)) {
        rows.push([v.sku, [p.name, v.storage, v.color].filter(Boolean).join(' '), p.short_description || p.name, v.stock > 0 ? 'in stock' : 'out of stock',
            p.condition === 'new' ? 'new' : 'refurbished', `${Number(v.price).toFixed(2)} ${currency}`, `${SITE}/produit/${p.slug}`, img(p), p.brand?.name || '', p.slug, v.color || '', v.storage || '']);
    }
    write('public/feeds/facebook.csv', rows.map((r) => r.map(esc).join(',')).join('\n') + '\n');
    console.log(`✓ SEO : sitemap (${products.length} produits) et flux Facebook générés pour ${SITE}`);
} catch (e) {
    console.warn(`⚠ SEO : génération ignorée (${e.message}). Le site fonctionne quand même.`);
}
