// Table des adresses : pages du site React et actions de l'API Laravel.
// Les chemins qui commencent par /api sont envoyés au backend.
const table = {
    // Pages du site
    home: '/',
    'catalog.index': '/boutique',
    'catalog.category': '/boutique/:category',
    'products.show': '/produit/:slug',
    'cart.index': '/panier',
    'checkout.create': '/commande',
    'orders.show': '/commande/:token',
    'pages.show': '/page/:slug',
    contact: '/contact',
    login: '/admin/connexion',
    'admin.dashboard': '/admin',
    'admin.orders.index': '/admin/commandes',
    'admin.orders.show': '/admin/commandes/:id',
    'admin.products.index': '/admin/produits',
    'admin.products.create': '/admin/produits/nouveau',
    'admin.products.edit': '/admin/produits/:id',
    'admin.import.create': '/admin/produits/import',
    'admin.settings': '/admin/reglages',

    // Actions API
    'admin.login': '/api/admin/login',
    'checkout.store': '/api/orders',
    'orders.invoice': '/commande/:token/facture',
    'admin.orders.update': '/api/admin/orders/:id',
    'admin.orders.export': '/api/admin/orders/export',
    'admin.products.store': '/api/admin/products',
    'admin.products.update': '/api/admin/products/:id',
    'admin.products.destroy': '/api/admin/products/:id',
    'admin.images.destroy': '/api/admin/images/:id',
    'admin.import.store': '/api/admin/products/import',
    'admin.import.template': '/api/admin/products/import/template',
    'admin.settings.store': '/api/admin/settings/:resource',
    'admin.settings.update': '/api/admin/settings/:resource/:id',
    'admin.settings.destroy': '/api/admin/settings/:resource/:id',
    'admin.users.store': '/api/admin/users',
    'admin.users.destroy': '/api/admin/users/:id',
};

/**
 * route('products.show', 'iphone-13')            → /produit/iphone-13
 * route('admin.settings.update', ['zones', 4])   → /api/admin/settings/zones/4
 * route('catalog.index', { condition: 'refurbished', grade: ['A'] }) → /boutique?condition=refurbished&grade[]=A
 */
export function route(name, params) {
    const pattern = table[name];
    if (!pattern) throw new Error(`Route inconnue : ${name}`);
    const keys = [...pattern.matchAll(/:(\w+)/g)].map((m) => m[1]);
    let values = {};
    let rest = {};

    if (params === undefined || params === null) {
        // rien
    } else if (Array.isArray(params)) {
        keys.forEach((k, i) => (values[k] = params[i]));
    } else if (typeof params === 'object') {
        Object.entries(params).forEach(([k, v]) => (keys.includes(k) ? (values[k] = v) : (rest[k] = v)));
    } else {
        values[keys[0]] = params;
    }

    const path = pattern.replace(/:(\w+)/g, (_, k) => encodeURIComponent(values[k] ?? ''));
    const q = new URLSearchParams();
    Object.entries(rest).forEach(([k, v]) => {
        if (v === undefined || v === null || v === '') return;
        Array.isArray(v) ? v.forEach((x) => q.append(`${k}[]`, x)) : q.append(k, v);
    });
    const qs = q.toString();
    return qs ? `${path}?${qs}` : path;
}
