/**
 * Toute la logique de données du site, directement sur Supabase.
 * Les pages appellent des adresses du type '/api/products/iphone-13' ;
 * ce fichier les traduit en requêtes Supabase (tables als_*, fonctions SQL als_*).
 * La sécurité est dans la base : règles RLS + fonctions (commande, stock, équipe).
 */
import { BUCKET, imageUrl, supabase } from './supabase';

// --- Erreurs ----------------------------------------------------------------
export class ApiError extends Error {
    constructor(status, body) {
        super(body?.message || `Erreur ${status}`);
        this.status = status;
        this.body = body;
        this.errors = body?.errors || {};
    }
}

const GRADES = {
    A: 'Comme neuf — aucune trace visible',
    B: 'Très bon état — micro-rayures légères',
    C: "État correct — traces d'usage visibles",
};
const STATUSES = { new: 'Nouvelle', confirmed: 'Confirmée', shipped: 'En livraison', delivered: 'Livrée', cancelled: 'Annulée' };
const PAYMENT_STATUSES = { pending: 'En attente', paid: 'Payée', refunded: 'Remboursée' };
const IMPORT_COLUMNS = ['nom', 'categorie', 'marque', 'etat', 'grade', 'batterie', 'garantie_mois', 'piece_unique', 'sku', 'couleur', 'stockage', 'prix', 'prix_barre', 'stock', 'imei', 'description_courte', 'image_url'];

function fail(error, fallback = 'Une erreur est survenue.') {
    if (!error) return;
    // Erreurs de validation renvoyées par les fonctions SQL (detail = JSON)
    if (error.code === '22023') {
        let errors = {};
        try { errors = error.details ? JSON.parse(error.details) : {}; } catch { /* message simple */ }
        throw new ApiError(422, { message: error.message, errors });
    }
    if (error.code === '42501' || error.code === 'PGRST301' || /JWT|not authorized|permission denied/i.test(error.message || '')) {
        throw new ApiError(401, { message: 'Session expirée ou accès refusé.' });
    }
    if (error.code === '23505') throw new ApiError(422, { message: 'Cette valeur existe déjà (adresse ou SKU en double).', errors: {} });
    if (error.code === '23503') throw new ApiError(422, { message: 'Élément encore utilisé ailleurs : impossible de le supprimer.', errors: {} });
    throw new ApiError(500, { message: error.message || fallback });
}
const must = ({ data, error, count }) => { fail(error); return count !== undefined && count !== null ? { data, count } : data; };
const notFound = () => { throw new ApiError(404, { message: 'Introuvable' }); };

export const slugify = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);

// --- Mise en forme des produits (équivalent de l'ancien ProductPresenter) ---------
const PRODUCT_SELECT = 'id, name, slug, condition, grade, battery_health, warranty_months, is_unique, is_featured, min_price, total_stock, created_at, brand:als_brands(name, slug), category:als_categories(name, slug, icon), images:als_product_images(path, alt, position), variants:als_product_variants(id, sku, color, color_hex, storage, price, compare_at_price, stock, low_stock_threshold, is_active)';

const activeVariants = (p) => (p.variants || []).filter((v) => v.is_active).sort((a, b) => a.price - b.price);
const sortedImages = (p) => [...(p.images || [])].sort((a, b) => a.position - b.position);

function card(p) {
    const vs = activeVariants(p);
    const cheapest = vs[0];
    const colors = [];
    vs.forEach((v) => v.color_hex && !colors.some((c) => c.hex === v.color_hex) && colors.push({ name: v.color, hex: v.color_hex }));
    return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        brand: p.brand?.name ?? null,
        category: p.category?.name ?? null,
        category_icon: p.category?.icon ?? 'phone',
        condition: p.condition,
        grade: p.grade,
        battery_health: p.battery_health,
        warranty_months: p.warranty_months,
        is_unique: p.is_unique,
        price: Number(p.min_price),
        compare_at_price: cheapest?.compare_at_price ? Number(cheapest.compare_at_price) : null,
        has_options: vs.length > 1,
        in_stock: p.total_stock > 0,
        low_stock: p.total_stock > 0 && p.total_stock <= 2,
        image: imageUrl(sortedImages(p)[0]?.path),
        storages: [...new Set(vs.map((v) => v.storage).filter(Boolean))],
        colors,
    };
}

function detail(p) {
    return {
        ...card(p),
        short_description: p.short_description,
        description: p.description,
        specs: p.specs || [],
        meta_title: p.meta_title,
        meta_description: p.meta_description || p.short_description,
        category_slug: p.category?.slug,
        images: sortedImages(p).map((i) => ({ url: imageUrl(i.path), alt: i.alt || p.name })),
        variants: activeVariants(p).map((v) => ({
            id: v.id, sku: v.sku, color: v.color, color_hex: v.color_hex, storage: v.storage,
            price: Number(v.price), compare_at_price: v.compare_at_price ? Number(v.compare_at_price) : null,
            stock: p.is_unique ? Math.min(1, v.stock) : v.stock,
            low_stock: v.stock > 0 && v.stock <= v.low_stock_threshold,
        })),
    };
}

const conditionLabel = (p) => (p.condition === 'refurbished' ? `Reconditionné${p.grade ? ` · Grade ${p.grade}` : ''}` : 'Neuf');

// --- Pagination au format attendu par le composant <Pagination> ---------------
function paginate(rows, count, page, perPage, search) {
    const last = Math.max(1, Math.ceil(count / perPage));
    const url = (n) => {
        const q = new URLSearchParams(search);
        q.set('page', n);
        return `http://x/?${q.toString()}`;
    };
    const links = [{ label: '&laquo;', url: page > 1 ? url(page - 1) : null, active: false }];
    for (let n = 1; n <= last; n++) {
        if (n === 1 || n === last || Math.abs(n - page) <= 2) links.push({ label: String(n), url: url(n), active: n === page });
        else if (links[links.length - 1].label !== '…') links.push({ label: '…', url: null, active: false });
    }
    links.push({ label: '&raquo;', url: page < last ? url(page + 1) : null, active: false });
    return { data: rows, total: count, current_page: page, last_page: last, links };
}

const parseQuery = (qs) => {
    const p = new URLSearchParams(qs);
    const arr = (k) => p.getAll(`${k}[]`).concat(p.getAll(k)).filter(Boolean);
    return { p, arr, get: (k) => p.get(k) || undefined, page: Math.max(1, parseInt(p.get('page') || '1', 10)) };
};

// --- Réglages -------------------------------------------------------------
let settingsCache = null;
async function settings() {
    if (settingsCache) return settingsCache;
    const row = must(await supabase.from('als_settings').select('data').eq('id', 1).maybeSingle());
    settingsCache = row?.data ?? {};
    return settingsCache;
}

async function config() {
    const [s, nav] = await Promise.all([
        settings(),
        supabase.from('als_categories').select('name, slug, icon').order('position').then(must),
    ]);
    return {
        shop: {
            name: s.name || 'ALS Devices',
            url: typeof window !== 'undefined' ? window.location.origin : '',
            currency: s.currency || 'XOF',
            currency_symbol: s.currency_symbol || 'FCFA',
            decimals: s.decimals ?? 0,
            whatsapp: s.whatsapp,
            phone: s.phone,
            email: s.email,
            address: s.address,
            hours: s.hours,
            social: s.social || {},
            tracking: s.tracking || {},
        },
        nav,
    };
}

// --- Boutique ---------------------------------------------------------------
async function home() {
    const base = () => supabase.from('als_products').select(PRODUCT_SELECT).eq('is_active', true).gt('total_stock', 0);
    const [featured, refurbished, categories, brands, reviews] = await Promise.all([
        base().eq('is_featured', true).order('created_at', { ascending: false }).limit(8).then(must),
        base().eq('condition', 'refurbished').order('created_at', { ascending: false }).limit(4).then(must),
        supabase.from('als_category_stats').select('*').order('position').then(must),
        supabase.from('als_brands').select('name').order('name').then(must),
        supabase.from('als_reviews').select('author, city, rating, body').eq('is_published', true).order('created_at', { ascending: false }).limit(6).then(must),
    ]);
    return {
        featured: featured.map(card),
        refurbished: refurbished.map(card),
        categories,
        brands: brands.map((b) => b.name),
        reviews,
    };
}

async function catalog(categorySlug, search) {
    const { arr, get, page } = parseQuery(search);
    const perPage = 24;
    let category = null;
    if (categorySlug) {
        category = must(await supabase.from('als_categories').select('id, name, slug, description, icon, meta_title, meta_description').eq('slug', categorySlug).maybeSingle());
        if (!category) notFound();
    }

    const filters = {
        q: get('q'), brand: arr('brand'), condition: get('condition'), grade: arr('grade'), storage: arr('storage'),
        min: get('min'), max: get('max'), stock: get('stock') === '1' || get('stock') === 'true' ? 1 : undefined, sort: get('sort') || 'newest',
    };

    // Produits correspondant aux filtres de stockage / marque (via les tables liées)
    let ids = null;
    if (filters.storage.length) {
        const rows = must(await supabase.from('als_product_variants').select('product_id').eq('is_active', true).in('storage', filters.storage));
        ids = [...new Set(rows.map((r) => r.product_id))];
    }
    let brandIds = null;
    if (filters.brand.length) {
        brandIds = must(await supabase.from('als_brands').select('id').in('slug', filters.brand)).map((b) => b.id);
    }

    let q = supabase.from('als_products').select(PRODUCT_SELECT, { count: 'exact' }).eq('is_active', true);
    if (category) q = q.eq('category_id', category.id);
    if (filters.q) {
        const term = filters.q.replace(/[%,()]/g, ' ').trim();
        const matchingBrands = must(await supabase.from('als_brands').select('id').ilike('name', `%${term}%`)).map((b) => b.id);
        q = q.or([`name.ilike.%${term}%`, matchingBrands.length ? `brand_id.in.(${matchingBrands.join(',')})` : null].filter(Boolean).join(','));
    }
    if (brandIds) q = q.in('brand_id', brandIds.length ? brandIds : [0]);
    if (ids) q = q.in('id', ids.length ? ids : [0]);
    if (filters.condition) q = q.eq('condition', filters.condition);
    if (filters.grade.length) q = q.in('grade', filters.grade);
    if (filters.min) q = q.gte('min_price', Number(filters.min));
    if (filters.max) q = q.lte('min_price', Number(filters.max));
    if (filters.stock) q = q.gt('total_stock', 0);
    if (filters.sort === 'price_asc') q = q.order('min_price', { ascending: true });
    else if (filters.sort === 'price_desc') q = q.order('min_price', { ascending: false });
    else q = q.order('total_stock', { ascending: false }).order('created_at', { ascending: false });
    q = q.range((page - 1) * perPage, page * perPage - 1);

    const { data, count } = must(await q);

    // Facettes : seulement les valeurs présentes dans le rayon
    let scope = supabase.from('als_products').select('id, brand_id, min_price').eq('is_active', true);
    if (category) scope = scope.eq('category_id', category.id);
    const scopeRows = must(await scope);
    const scopeBrandIds = [...new Set(scopeRows.map((r) => r.brand_id).filter(Boolean))];
    const [brands, storages] = await Promise.all([
        scopeBrandIds.length ? supabase.from('als_brands').select('name, slug').in('id', scopeBrandIds).order('name').then(must) : [],
        scopeRows.length ? supabase.from('als_product_variants').select('storage').eq('is_active', true).in('product_id', scopeRows.map((r) => r.id)).not('storage', 'is', null).then(must) : [],
    ]);
    const storageValue = (s) => (parseInt(s, 10) || 0) * (/to/i.test(s) ? 1024 : 1);

    return {
        category,
        products: paginate(data.map(card), count ?? 0, page, perPage, search),
        filters: Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined && !(Array.isArray(v) && !v.length))),
        facets: {
            brands,
            storages: [...new Set(storages.map((s) => s.storage))].sort((a, b) => storageValue(a) - storageValue(b)),
            price_max: Math.max(0, ...scopeRows.map((r) => Number(r.min_price))),
        },
    };
}

async function product(slug) {
    const p = must(await supabase.from('als_products')
        .select(`${PRODUCT_SELECT}, short_description, description, specs, meta_title, meta_description, category_id`)
        .eq('slug', slug).eq('is_active', true).maybeSingle());
    if (!p) notFound();
    const [reviews, related] = await Promise.all([
        supabase.from('als_reviews').select('author, city, rating, body').eq('product_id', p.id).eq('is_published', true).then(must),
        supabase.from('als_products').select(PRODUCT_SELECT).eq('is_active', true).eq('category_id', p.category_id).neq('id', p.id).gt('total_stock', 0).limit(8).then(must),
    ]);
    return {
        product: detail(p),
        reviews,
        related: related.sort(() => Math.random() - 0.5).slice(0, 4).map(card),
        grades: GRADES,
    };
}

async function page(slug) {
    const pg = must(await supabase.from('als_pages').select('title, slug, body, meta_description, updated_at').eq('slug', slug).eq('is_published', true).maybeSingle());
    if (!pg) notFound();
    const { markdown } = await import('./markdown');
    return {
        page: {
            title: pg.title, slug: pg.slug, html: markdown(pg.body), meta_description: pg.meta_description,
            updated_at: new Date(pg.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
        },
    };
}

/** Recalcule le panier du navigateur avec les prix et stocks réels. */
async function cart(items = []) {
    const merged = new Map();
    items.forEach((i) => {
        const id = Number(i.variant_id); const q = Number(i.quantity);
        if (id > 0 && q > 0) merged.set(id, Math.min((merged.get(id) || 0) + q, 20));
    });
    if (!merged.size) return { lines: [], removed: [], subtotal: 0 };

    const rows = must(await supabase.from('als_product_variants')
        .select('id, sku, color, color_hex, storage, price, stock, is_active, product:als_products(id, name, slug, condition, grade, is_unique, is_active, category:als_categories(icon), images:als_product_images(path, position))')
        .in('id', [...merged.keys()]));
    const byId = new Map(rows.map((r) => [r.id, r]));

    const lines = []; const removed = [];
    merged.forEach((qty, id) => {
        const v = byId.get(id);
        if (!v || !v.product) { removed.push(id); return; }
        const max = v.is_active && v.product.is_active ? (v.product.is_unique ? Math.min(1, v.stock) : Math.min(v.stock, 20)) : 0;
        const available = max > 0;
        const quantity = Math.min(qty, max);
        lines.push({
            variant_id: v.id, product_id: v.product.id, slug: v.product.slug, name: v.product.name,
            variant_label: [v.storage, v.color].filter(Boolean).join(' · '), sku: v.sku, category_icon: v.product.category?.icon,
            color_hex: v.color_hex, image: imageUrl(sortedImages(v.product)[0]?.path), condition: conditionLabel(v.product),
            unit_price: Number(v.price), quantity: available ? quantity : qty, max,
            line_total: available ? Number(v.price) * quantity : 0, available, adjusted: available && quantity < qty,
        });
    });
    return { lines, removed, subtotal: lines.filter((l) => l.available).reduce((s, l) => s + l.line_total, 0) };
}

async function checkoutOptions() {
    const [s, zones] = await Promise.all([
        settings(),
        supabase.from('als_delivery_zones').select('id, name, fee, delay').eq('is_active', true).order('position').then(must),
    ]);
    return {
        zones: zones.map((z) => ({ ...z, fee: Number(z.fee) })),
        pickupEnabled: s.pickup_enabled !== false,
        paymentMethods: s.payment_methods || [{ value: 'cod', label: 'Paiement à la livraison', hint: '' }],
    };
}

async function placeOrder(data) {
    const { items, ...customer } = data;
    const res = must(await supabase.rpc('als_place_order', { p_items: items || [], p_customer: customer }));
    return { ...res, total: Number(res.total), redirect: null };
}

function paymentInstructions(order, s) {
    const fmt = (n) => `${new Intl.NumberFormat('fr-FR').format(n).replace(/ /g, ' ')} ${s.currency_symbol || 'FCFA'}`;
    if (order.payment_method === 'wave') return `Envoyez ${fmt(order.total)} par Wave au ${s.wave_number || '(numéro à configurer)'} en indiquant la référence ${order.number}. Votre commande est confirmée dès réception.`;
    if (order.payment_method === 'orange_money') return `Envoyez ${fmt(order.total)} par Orange Money au ${s.om_number || '(numéro à configurer)'} en indiquant la référence ${order.number}. Votre commande est confirmée dès réception.`;
    return 'Vous payez à la réception, en espèces ou par mobile money. Nous vous appelons pour confirmer la livraison.';
}

async function order(token) {
    if (!/^[0-9a-f-]{36}$/i.test(token)) notFound();
    const [o, s] = await Promise.all([supabase.rpc('als_get_order', { p_token: token }).then(must), settings()]);
    if (!o) notFound();
    const label = (s.payment_methods || []).find((m) => m.value === o.payment_method)?.label || o.payment_method;
    const num = (k) => Number(o[k]);
    return {
        order: {
            ...o, subtotal: num('subtotal'), delivery_fee: num('delivery_fee'), total: num('total'),
            created_at: new Date(o.created_at).toLocaleString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            created_at_raw: o.created_at,
            payment_label: label,
            items: o.items.map((i) => ({ ...i, unit_price: Number(i.unit_price), line_total: Number(i.line_total) })),
        },
        instructions: paymentInstructions({ ...o, total: num('total') }, s),
        statuses: STATUSES,
        paymentStatuses: PAYMENT_STATUSES,
        shopInfo: { name: s.name, address: s.address, phone: s.phone, email: s.email, currency_symbol: s.currency_symbol },
    };
}

// --- Back-office : connexion ---------------------------------------------------
async function staffUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new ApiError(401, { message: 'Non connecté.' });
    const row = must(await supabase.from('als_staff').select('role, name').eq('user_id', user.id).maybeSingle());
    if (!row) throw new ApiError(403, { message: "Ce compte n'a pas accès au back-office." });
    return { id: user.id, email: user.email, name: row.name || user.email.split('@')[0], role: row.role };
}

async function login({ email, password }) {
    const errors = {};
    if (!email) errors.email = 'Indiquez votre e-mail.';
    if (!password) errors.password = 'Indiquez votre mot de passe.';
    if (Object.keys(errors).length) throw new ApiError(422, { message: 'Formulaire incomplet', errors });

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new ApiError(422, { message: 'Identifiants incorrects.', errors: { email: 'Identifiants incorrects.' } });
    // Le tout premier compte qui se connecte devient propriétaire
    await supabase.rpc('als_claim_owner');
    try {
        const user = await staffUser();
        return { token: 'supabase', user };
    } catch (e) {
        await supabase.auth.signOut();
        throw new ApiError(422, { message: e.message, errors: { email: "Ce compte n'a pas accès au back-office. Demandez au propriétaire de vous ajouter." } });
    }
}

// --- Back-office : produits ------------------------------------------------------
async function adminProducts(search) {
    const { get, page } = parseQuery(search);
    const perPage = 30;
    let q = supabase.from('als_products')
        .select('id, name, slug, condition, grade, min_price, total_stock, is_active, is_demo, category:als_categories(name), brand:als_brands(name), images:als_product_images(path, position), variants:als_product_variants(count)', { count: 'exact' })
        .order('created_at', { ascending: false }).range((page - 1) * perPage, page * perPage - 1);
    if (get('q')) q = q.ilike('name', `%${get('q').replace(/[%,]/g, ' ')}%`);
    if (get('category')) q = q.eq('category_id', get('category'));
    if (get('stock') === 'low') q = q.lte('total_stock', 2);
    const [{ data, count }, categories] = await Promise.all([q.then(must), supabase.from('als_categories').select('id, name').order('position').then(must)]);
    return {
        products: paginate(data.map((p) => ({
            id: p.id, name: p.name, slug: p.slug, category: p.category?.name, brand: p.brand?.name, condition: conditionLabel(p),
            price: Number(p.min_price), stock: p.total_stock, variants: p.variants?.[0]?.count ?? 0, is_active: p.is_active, is_demo: p.is_demo,
            image: imageUrl(sortedImages(p)[0]?.path),
        })), count ?? 0, page, perPage, search),
        categories,
        filters: Object.fromEntries(['q', 'category', 'stock'].filter((k) => get(k)).map((k) => [k, get(k)])),
    };
}

async function productFormData(id) {
    const [categories, brands] = await Promise.all([
        supabase.from('als_categories').select('id, name').order('position').then(must),
        supabase.from('als_brands').select('id, name').order('name').then(must),
    ]);
    let productData = null;
    if (id) {
        const p = must(await supabase.from('als_products')
            .select('*, images:als_product_images(id, path, alt, position), variants:als_product_variants(*, private:als_variant_private(serial_number))')
            .eq('id', id).maybeSingle());
        if (!p) notFound();
        productData = {
            ...p,
            images: sortedImages(p).map((i) => ({ ...i, url: imageUrl(i.path) })),
            variants: p.variants.sort((a, b) => a.id - b.id).map(({ private: priv, ...v }) => ({
                ...v, price: Number(v.price), compare_at_price: v.compare_at_price ? Number(v.compare_at_price) : '',
                serial_number: (Array.isArray(priv) ? priv[0] : priv)?.serial_number ?? '',
            })),
        };
    }
    return { product: productData, categories, brands, grades: GRADES };
}

function productPayload(d, id) {
    return {
        id: id ?? null,
        name: d.name?.trim(),
        slug: slugify(d.slug || d.name),
        category_id: d.category_id,
        brand_id: d.brand_id || null,
        short_description: d.short_description,
        description: d.description,
        condition: d.condition,
        grade: d.condition === 'refurbished' ? d.grade : null,
        battery_health: d.battery_health === '' ? null : d.battery_health,
        warranty_months: d.warranty_months,
        is_unique: !!d.is_unique, is_featured: !!d.is_featured, is_active: !!d.is_active,
        specs: (d.specs || []).filter((s) => s.label && s.value),
        meta_title: d.meta_title, meta_description: d.meta_description,
        variants: (d.variants || []).map((v) => ({
            id: v.id || null, sku: String(v.sku || '').trim(), color: v.color, color_hex: v.color_hex || null, storage: v.storage,
            price: v.price, compare_at_price: v.compare_at_price === '' ? null : v.compare_at_price, stock: v.stock,
            low_stock_threshold: v.low_stock_threshold, is_active: v.is_active !== false, serial_number: v.serial_number ?? '',
        })),
    };
}

function validateProduct(d) {
    const errors = {};
    if (!d.name?.trim()) errors.name = 'Le nom est obligatoire.';
    if (d.condition === 'refurbished' && !d.grade) errors.grade = 'Le grade est obligatoire pour un reconditionné.';
    if (!d.variants?.length) errors.variants = 'Ajoutez au moins une variante.';
    const skus = new Set();
    (d.variants || []).forEach((v, i) => {
        if (!String(v.sku || '').trim()) errors[`variants.${i}.sku`] = 'SKU obligatoire.';
        else if (skus.has(v.sku)) errors[`variants.${i}.sku`] = 'SKU en double.';
        skus.add(v.sku);
        if (v.price === '' || Number(v.price) < 0 || Number.isNaN(Number(v.price))) errors[`variants.${i}.price`] = 'Prix invalide.';
        if (v.compare_at_price !== '' && v.compare_at_price != null && Number(v.compare_at_price) <= Number(v.price)) errors[`variants.${i}.compare_at_price`] = 'Le prix barré doit être supérieur au prix.';
    });
    (d.images || []).forEach((f, i) => { if (f.size > 5 * 1024 * 1024) errors[`images.${i}`] = `${f.name} dépasse 5 Mo.`; });
    if (Object.keys(errors).length) throw new ApiError(422, { message: 'Vérifiez le formulaire.', errors });
}

async function uploadImages(productId, files = [], startPosition = 0) {
    let position = startPosition;
    for (const file of files) {
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
        const path = `products/${productId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
        if (error) throw new ApiError(422, { message: `Envoi de ${file.name} impossible : ${error.message}` });
        must(await supabase.from('als_product_images').insert({ product_id: productId, path, alt: null, position: ++position }));
    }
}

async function saveProduct(d, id) {
    validateProduct(d);
    const productId = must(await supabase.rpc('als_save_product', { p: productPayload(d, id) }));
    if (d.images?.length) {
        const current = must(await supabase.from('als_product_images').select('position').eq('product_id', productId).order('position', { ascending: false }).limit(1));
        await uploadImages(productId, d.images, current[0]?.position ?? 0);
    }
    return { message: id ? 'Produit enregistré.' : 'Produit créé.', id: productId };
}

async function deleteProduct(id) {
    const sold = must(await supabase.from('als_order_items').select('id', { count: 'exact', head: true }).eq('product_id', id));
    if ((sold?.count ?? 0) > 0) {
        must(await supabase.from('als_products').update({ is_active: false }).eq('id', id));
        return { message: 'Produit déjà commandé : il a été masqué du site.' };
    }
    const images = must(await supabase.from('als_product_images').select('path').eq('product_id', id));
    const paths = images.map((i) => i.path).filter((p) => !/^https?:/.test(p));
    if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
    must(await supabase.from('als_products').delete().eq('id', id));
    return { message: 'Produit supprimé.' };
}

async function deleteImage(id) {
    const img = must(await supabase.from('als_product_images').select('path').eq('id', id).maybeSingle());
    if (img && !/^https?:/.test(img.path)) await supabase.storage.from(BUCKET).remove([img.path]);
    must(await supabase.from('als_product_images').delete().eq('id', id));
    return { message: 'Photo supprimée.' };
}

// --- Import CSV --------------------------------------------------------------
function parseCsv(text) {
    text = text.replace(/^﻿/, '');
    const firstLine = text.split(/\r?\n/)[0] || '';
    const sep = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';
    const rows = []; let row = []; let cell = ''; let quoted = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (quoted) {
            if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') quoted = false; else cell += c;
        } else if (c === '"') quoted = true;
        else if (c === sep) { row.push(cell); cell = ''; }
        else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
        else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

async function importProducts(file) {
    if (!file) throw new ApiError(422, { message: 'Choisissez un fichier.', errors: { file: 'Choisissez un fichier .csv.' } });
    const rows = parseCsv(await file.text());
    const header = rows.shift()?.map((h) => slugify(h).replace(/-/g, '_')) ?? [];
    const num = (v) => (v === undefined || v === null || String(v).trim() === '' ? null : Number(String(v).replace(/[\s ]/g, '').replace(',', '.')));
    const yes = (v) => ['oui', 'yes', '1', 'x', 'vrai'].includes(String(v || '').trim().toLowerCase());

    const errors = [];
    const records = rows.map((cols, i) => {
        const r = Object.fromEntries(header.map((h, k) => [h, (cols[k] ?? '').trim()]));
        if (!r.nom || !r.sku || num(r.prix) === null || Number.isNaN(num(r.prix))) errors.push(`Ligne ${i + 2} : nom, sku et prix sont obligatoires.`);
        return r;
    });
    if (errors.length) throw new ApiError(422, { message: errors.slice(0, 5).join(' '), errors: {} });

    const [cats, brands] = await Promise.all([
        supabase.from('als_categories').select('id, slug').then(must),
        supabase.from('als_brands').select('id, slug').then(must),
    ]);
    const catId = new Map(cats.map((c) => [c.slug, c.id]));
    const brandId = new Map(brands.map((b) => [b.slug, b.id]));

    const groups = new Map();
    records.forEach((r) => groups.set(r.nom, [...(groups.get(r.nom) || []), r]));

    let done = 0;
    for (const [name, variants] of groups) {
        const f = variants[0];
        const cslug = slugify(f.categorie || 'Divers');
        if (!catId.has(cslug)) catId.set(cslug, must(await supabase.from('als_categories').insert({ name: f.categorie || 'Divers', slug: cslug }).select('id').single()).id);
        let bId = null;
        if (f.marque) {
            const bslug = slugify(f.marque);
            if (!brandId.has(bslug)) brandId.set(bslug, must(await supabase.from('als_brands').insert({ name: f.marque, slug: bslug }).select('id').single()).id);
            bId = brandId.get(bslug);
        }
        const refurb = slugify(f.etat).startsWith('recond');
        const existing = must(await supabase.from('als_products').select('id').eq('slug', slugify(name)).maybeSingle());
        const id = must(await supabase.rpc('als_save_product', { p: {
            id: existing?.id ?? null,
            name, slug: slugify(name), category_id: catId.get(cslug), brand_id: bId,
            condition: refurb ? 'refurbished' : 'new', grade: refurb ? (f.grade || 'B').toUpperCase() : null,
            battery_health: num(f.batterie), warranty_months: num(f.garantie_mois) ?? (refurb ? 6 : 12),
            is_unique: yes(f.piece_unique), is_active: true, short_description: f.description_courte || null,
            replace_variants: false,
            variants: variants.map((v) => ({
                sku: v.sku, color: v.couleur || null, storage: v.stockage || null, price: num(v.prix), compare_at_price: num(v.prix_barre),
                stock: num(v.stock) ?? 0, is_active: true, ...(v.imei ? { serial_number: v.imei } : {}),
            })),
        } }));
        if (f.image_url) {
            const has = must(await supabase.from('als_product_images').select('id').eq('product_id', id).limit(1));
            if (!has.length) must(await supabase.from('als_product_images').insert({ product_id: id, path: f.image_url, alt: name, position: 1 }));
        }
        done++;
    }
    return { message: `${done} produit(s) importé(s) ou mis à jour.` };
}

function csvBlob(rows) {
    const esc = (v) => { const s = v === null || v === undefined ? '' : String(v); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    return new Blob(['﻿' + rows.map((r) => r.map(esc).join(';')).join('\n')], { type: 'text/csv;charset=utf-8' });
}

function importTemplate() {
    return csvBlob([
        IMPORT_COLUMNS,
        ['iPhone 13', 'Smartphones', 'Apple', 'reconditionne', 'A', '91', '6', 'oui', 'IP13-128-MN-001', 'Minuit', '128 Go', '285000', '', '1', '', 'Écran OLED 6,1", Face ID', ''],
        ['Coque silicone iPhone 13', 'Accessoires', 'Apple', 'neuf', '', '', '3', 'non', 'ACC-CQ13-NR', 'Noir', '', '7500', '10000', '25', '', '', ''],
    ]);
}

// --- Back-office : commandes -------------------------------------------------------
async function adminOrders(search) {
    const { get, page } = parseQuery(search);
    const perPage = 30;
    let q = supabase.from('als_orders').select('id, number, customer_name, customer_phone, total, status, payment_status, created_at', { count: 'exact' })
        .order('created_at', { ascending: false }).range((page - 1) * perPage, page * perPage - 1);
    if (get('status')) q = q.eq('status', get('status'));
    if (get('q')) {
        const t = get('q').replace(/[%,()]/g, ' ').trim();
        q = q.or(`number.ilike.%${t}%,customer_name.ilike.%${t}%,customer_phone.ilike.%${t}%`);
    }
    const { data, count } = must(await q);
    return {
        orders: paginate(data.map((o) => ({ ...o, total: Number(o.total) })), count ?? 0, page, perPage, search),
        filters: Object.fromEntries(['status', 'q'].filter((k) => get(k)).map((k) => [k, get(k)])),
        statuses: STATUSES,
        paymentStatuses: PAYMENT_STATUSES,
    };
}

async function adminOrder(id) {
    const [o, s] = await Promise.all([
        supabase.from('als_orders').select('*, items:als_order_items(*)').eq('id', id).maybeSingle().then(must),
        settings(),
    ]);
    if (!o) notFound();
    return {
        order: {
            ...o,
            subtotal: Number(o.subtotal), delivery_fee: Number(o.delivery_fee), total: Number(o.total),
            items: o.items.sort((a, b) => a.id - b.id).map((i) => ({ ...i, unit_price: Number(i.unit_price), line_total: Number(i.line_total) })),
            payment_label: (s.payment_methods || []).find((m) => m.value === o.payment_method)?.label || o.payment_method,
            zone_name: o.delivery_zone_name,
            track_url: `${window.location.origin}/commande/${o.public_token}`,
            invoice_url: `/commande/${o.public_token}/facture`,
        },
        statuses: STATUSES,
        paymentStatuses: PAYMENT_STATUSES,
    };
}

async function updateOrder(id, d) {
    must(await supabase.rpc('als_update_order', {
        p_id: Number(id), p_status: d.status, p_payment_status: d.payment_status,
        p_payment_reference: d.payment_reference || null, p_tracking_number: d.tracking_number || null,
    }));
    return { message: 'Commande mise à jour.' };
}

async function exportOrders(search) {
    const { get } = parseQuery(search);
    const from = get('from') ? new Date(get('from')) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const to = get('to') ? new Date(get('to')) : new Date();
    to.setHours(23, 59, 59, 999);
    const [rows, s] = await Promise.all([
        supabase.from('als_orders').select('*').gte('created_at', from.toISOString()).lte('created_at', to.toISOString()).order('created_at').then(must),
        settings(),
    ]);
    const pay = (m) => (s.payment_methods || []).find((x) => x.value === m)?.label || m;
    return csvBlob([
        ['Numéro', 'Date', 'Client', 'Téléphone', 'Statut', 'Paiement', 'État paiement', 'Sous-total', 'Livraison', 'Total', 'Source'],
        ...rows.map((o) => [o.number, new Date(o.created_at).toLocaleString('fr-FR'), o.customer_name, o.customer_phone, STATUSES[o.status], pay(o.payment_method),
            PAYMENT_STATUSES[o.payment_status], o.subtotal, o.delivery_fee, o.total, o.source || 'direct']),
    ]);
}

// --- Back-office : réglages ------------------------------------------------------------
const RESOURCES = {
    categories: { table: 'als_categories', fields: ['name', 'icon', 'description', 'position', 'meta_title', 'meta_description'], slugFrom: 'name' },
    brands: { table: 'als_brands', fields: ['name'], slugFrom: 'name' },
    zones: { table: 'als_delivery_zones', fields: ['name', 'fee', 'delay', 'position', 'is_active'] },
    pages: { table: 'als_pages', fields: ['title', 'slug', 'body', 'meta_description', 'is_published'], slugFrom: 'title', keepSlug: true },
    reviews: { table: 'als_reviews', fields: ['author', 'city', 'rating', 'body', 'is_published'] },
};

function resourcePayload(name, d) {
    const r = RESOURCES[name];
    if (!r) notFound();
    const out = {};
    r.fields.forEach((f) => { if (d[f] !== undefined) out[f] = d[f] === '' && f !== 'body' ? null : d[f]; });
    const required = { categories: 'name', brands: 'name', zones: 'name', pages: 'title', reviews: 'author' }[name];
    if (!out[required]) throw new ApiError(422, { message: 'Champ obligatoire manquant.', errors: { [required]: 'Obligatoire.' } });
    if (name === 'reviews' && !out.body) throw new ApiError(422, { message: 'Champ obligatoire manquant.', errors: { body: 'Obligatoire.' } });
    if (r.slugFrom) out.slug = r.keepSlug && d.slug ? slugify(d.slug) : slugify(d[r.slugFrom]);
    if ('position' in out && out.position === null) out.position = 0;
    if (name === 'zones' && out.fee === null) out.fee = 0;
    return out;
}

async function adminSettings() {
    const [categories, brands, zones, pages, reviews, s] = await Promise.all([
        supabase.from('als_categories').select('*, als_products(count)').order('position').then(must),
        supabase.from('als_brands').select('*, als_products(count)').order('name').then(must),
        supabase.from('als_delivery_zones').select('*').order('position').then(must),
        supabase.from('als_pages').select('*').order('title').then(must),
        supabase.from('als_reviews').select('*').order('created_at', { ascending: false }).then(must),
        supabase.from('als_settings').select('data').eq('id', 1).maybeSingle().then(must),
    ]);
    const me = await staffUser();
    const withCount = (rows) => rows.map(({ als_products: c, ...r }) => ({ ...r, products_count: c?.[0]?.count ?? 0 }));
    return {
        categories: withCount(categories),
        brands: withCount(brands),
        zones: zones.map((z) => ({ ...z, fee: Number(z.fee) })),
        pages, reviews,
        shopSettings: s?.data ?? {},
        users: me.role === 'owner' ? must(await supabase.rpc('als_staff_list')) : null,
        tab: new URLSearchParams(window.location.search).get('tab') || 'shop',
    };
}

async function saveShopSettings(d) {
    const current = must(await supabase.from('als_settings').select('data').eq('id', 1).maybeSingle())?.data ?? {};
    const data = { ...current, ...d, whatsapp: String(d.whatsapp ?? current.whatsapp ?? '').replace(/\D/g, ''), break_even_monthly: Number(d.break_even_monthly ?? current.break_even_monthly ?? 0) };
    must(await supabase.from('als_settings').update({ data }).eq('id', 1));
    settingsCache = null;
    return { message: 'Réglages de la boutique enregistrés.' };
}

// --- Aiguillage : adresse → action Supabase ------------------------------------------------
export async function supabaseRequest(method, fullPath, data) {
    const [path, qs = ''] = fullPath.split('?');
    const search = qs ? `?${qs}` : '';
    let m;
    const route = (re) => (m = path.match(re));

    // Boutique
    if (method === 'GET' && path === '/api/config') return config();
    if (method === 'GET' && path === '/api/home') return home();
    if (method === 'GET' && route(/^\/api\/catalog(?:\/([\w-]+))?$/)) return catalog(m[1], search);
    if (method === 'GET' && route(/^\/api\/products\/([\w-]+)$/)) return product(m[1]);
    if (method === 'GET' && route(/^\/api\/pages\/([\w-]+)$/)) return page(m[1]);
    if (method === 'POST' && path === '/api/cart') return cart(data?.items);
    if (method === 'GET' && path === '/api/checkout') return checkoutOptions();
    if (method === 'POST' && path === '/api/orders') return placeOrder(data);
    if (method === 'GET' && route(/^\/api\/orders\/([\w-]+)$/)) return order(m[1]);

    // Connexion
    if (path === '/api/admin/login') return login(data);
    if (path === '/api/admin/me') return { user: await staffUser() };
    if (path === '/api/admin/logout') { await supabase.auth.signOut(); return { message: 'Déconnecté.' }; }

    // Back-office (la base refuse tout si l'utilisateur n'est pas de l'équipe)
    if (path === '/api/admin/dashboard') {
        const d = must(await supabase.rpc('als_dashboard'));
        return { ...d, recentOrders: d.recentOrders.map((o) => ({ ...o, total: Number(o.total) })), kpis: { ...d.kpis, revenue_month: Number(d.kpis.revenue_month), break_even: Number(d.kpis.break_even) } };
    }
    if (path === '/api/admin/products/import') return method === 'GET' ? { columns: IMPORT_COLUMNS } : importProducts(data?.file);
    if (path === '/api/admin/products/import/template') return importTemplate();
    if (path === '/api/admin/products/form') return productFormData(null);
    if (path === '/api/admin/products') return method === 'GET' ? adminProducts(search) : saveProduct(data, null);
    if (route(/^\/api\/admin\/products\/(\d+)$/)) {
        if (method === 'GET') return productFormData(Number(m[1]));
        if (method === 'DELETE') return deleteProduct(Number(m[1]));
        return saveProduct(data, Number(m[1]));
    }
    if (method === 'DELETE' && route(/^\/api\/admin\/images\/(\d+)$/)) return deleteImage(Number(m[1]));

    if (path === '/api/admin/orders') return adminOrders(search);
    if (path === '/api/admin/orders/export') return exportOrders(search);
    if (route(/^\/api\/admin\/orders\/(\d+)$/)) return method === 'GET' ? adminOrder(Number(m[1])) : updateOrder(m[1], data);

    if (path === '/api/admin/settings') return adminSettings();
    if (path === '/api/admin/settings/shop') return saveShopSettings(data);
    if (route(/^\/api\/admin\/settings\/(\w+)(?:\/(\d+))?$/)) {
        const [, name, id] = m;
        const table = RESOURCES[name]?.table ?? notFound();
        if (method === 'DELETE') { must(await supabase.from(table).delete().eq('id', id)); return { message: 'Élément supprimé.' }; }
        if (id) { must(await supabase.from(table).update(resourcePayload(name, data)).eq('id', id)); return { message: 'Modifications enregistrées.' }; }
        must(await supabase.from(table).insert(resourcePayload(name, data)));
        return { message: 'Élément ajouté.' };
    }

    if (method === 'POST' && path === '/api/admin/users') {
        if (!data?.email) throw new ApiError(422, { message: 'E-mail obligatoire.', errors: { email: 'Obligatoire.' } });
        must(await supabase.rpc('als_add_staff', { p_email: data.email, p_role: data.role || 'employee', p_name: data.name || null }));
        return { message: 'Membre ajouté.' };
    }
    if (method === 'DELETE' && route(/^\/api\/admin\/users\/([\w-]+)$/)) {
        must(await supabase.rpc('als_remove_staff', { p_user_id: m[1] }));
        return { message: 'Membre retiré.' };
    }

    notFound();
}
