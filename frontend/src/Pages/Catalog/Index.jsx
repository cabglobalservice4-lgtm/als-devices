import { Link, useRouter, usePage } from '@/lib/kit';
import { useState } from 'react';
import ShopLayout from '@/Layouts/ShopLayout';
import Seo from '@/Components/Seo';
import ProductCard from '@/Components/ProductCard';
import Pagination from '@/Components/Pagination';
import Icon from '@/Components/Icon';
import { cx, useMoney } from '@/lib/format';
import { route } from '@/lib/routes';

const sorts = { newest: 'Nouveautés', price_asc: 'Prix croissant', price_desc: 'Prix décroissant' };

export default function CatalogIndex({ category, products, filters, facets }) {
    const router = useRouter();
    const { nav } = usePage().props;
    const money = useMoney();
    const [drawer, setDrawer] = useState(false);

    const baseUrl = category ? route('catalog.category', category.slug) : route('catalog.index');
    const apply = (next) => {
        const params = { ...filters, ...next };
        Object.keys(params).forEach((k) => (params[k] === '' || params[k] == null || (Array.isArray(params[k]) && !params[k].length) || (k === 'sort' && params[k] === 'newest')) && delete params[k]);
        router.get(baseUrl, params, { preserveState: true, preserveScroll: true, replace: true });
    };
    const toggle = (key, value) => {
        const cur = filters[key] ?? [];
        apply({ [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] });
    };
    const activeCount = ['brand', 'grade', 'storage'].reduce((n, k) => n + (filters[k]?.length ?? 0), 0) + (filters.condition ? 1 : 0) + (filters.min || filters.max ? 1 : 0) + (filters.stock ? 1 : 0);

    const title = category ? category.name : filters.q ? `Recherche « ${filters.q} »` : 'Toute la boutique';

    const panel = (
        <div className="space-y-8">
            <Facet title="État">
                <div className="flex flex-wrap gap-2">
                    {[['', 'Tous'], ['new', 'Neuf'], ['refurbished', 'Reconditionné']].map(([v, l]) => (
                        <button key={l} onClick={() => apply({ condition: v, grade: v === 'new' ? [] : filters.grade })} className={cx('chip', (filters.condition ?? '') === v && 'chip-on')}>{l}</button>
                    ))}
                </div>
                {filters.condition !== 'new' && (
                    <div className="mt-3 flex gap-2">
                        {['A', 'B', 'C'].map((g) => (
                            <button key={g} onClick={() => toggle('grade', g)} className={cx('chip', filters.grade?.includes(g) && 'chip-on')}>Grade {g}</button>
                        ))}
                    </div>
                )}
            </Facet>

            {facets.brands.length > 0 && (
                <Facet title="Marque">
                    <div className="space-y-1">
                        {facets.brands.map((b) => (
                            <label key={b.slug} className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-1.5 hover:bg-bone">
                                <input type="checkbox" checked={filters.brand?.includes(b.slug) ?? false} onChange={() => toggle('brand', b.slug)} className="h-4 w-4 rounded border-bone-300 text-ink focus:ring-0" />
                                <span className="text-[15px]">{b.name}</span>
                            </label>
                        ))}
                    </div>
                </Facet>
            )}

            {facets.storages.length > 0 && (
                <Facet title="Stockage">
                    <div className="flex flex-wrap gap-2">
                        {facets.storages.map((s) => (
                            <button key={s} onClick={() => toggle('storage', s)} className={cx('chip text-[13px]', filters.storage?.includes(s) && 'chip-on')}>{s}</button>
                        ))}
                    </div>
                </Facet>
            )}

            <Facet title="Budget">
                <PriceRange min={filters.min} max={filters.max} ceiling={facets.price_max} onApply={(min, max) => apply({ min, max })} money={money} />
            </Facet>

            <label className="flex cursor-pointer items-center justify-between rounded-lg bg-bone px-4 py-3">
                <span className="text-[15px] font-medium">En stock uniquement</span>
                <input type="checkbox" checked={!!filters.stock} onChange={(e) => apply({ stock: e.target.checked ? 1 : '' })} className="h-5 w-5 rounded border-bone-300 text-als focus:ring-0" />
            </label>
        </div>
    );

    return (
        <ShopLayout>
            <Seo title={category?.meta_title?.replace(' | ALS Devices', '') || title} description={category?.meta_description || category?.description} noindex={!!filters.q} />

            <section className="border-b border-bone-200 bg-bone">
                <div className="container-als py-10 md:py-14">
                    <nav className="eyebrow flex items-center gap-2 text-graphite" aria-label="Fil d'Ariane">
                        <Link href={route('home')} className="hover:text-ink">Accueil</Link><span>/</span>
                        <Link href={route('catalog.index')} className="hover:text-ink">Boutique</Link>
                        {category && <><span>/</span><span className="text-ink">{category.name}</span></>}
                    </nav>
                    <h1 className="h-display mt-4 text-6xl md:text-8xl">{title}</h1>
                    {category?.description && <p className="mt-4 max-w-2xl text-graphite">{category.description}</p>}

                    <div className="no-scrollbar -mx-4 mt-8 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
                        <Link href={route('catalog.index')} className={cx('chip shrink-0', !category && 'chip-on')}>Tout</Link>
                        {nav.map((c) => (
                            <Link key={c.slug} href={route('catalog.category', c.slug)} className={cx('chip shrink-0', category?.slug === c.slug && 'chip-on')}>
                                <Icon name={c.icon} className="h-4 w-4" />{c.name}
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            <div className="container-als mt-8 grid gap-10 lg:grid-cols-[260px_1fr]">
                <aside className="hidden lg:block">
                    <div className="sticky top-24">{panel}</div>
                </aside>

                <div>
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-graphite">{products.total} appareil{products.total > 1 ? 's' : ''}</p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setDrawer(true)} className="chip lg:hidden"><Icon name="filter" className="h-4 w-4" /> Filtres{activeCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-als px-1 text-[11px] font-bold text-white">{activeCount}</span>}</button>
                            <label className="relative">
                                <span className="sr-only">Trier</span>
                                <select value={filters.sort} onChange={(e) => apply({ sort: e.target.value })} className="rounded-md border-bone-300 py-1.5 pl-3 pr-9 text-sm font-medium focus:border-ink focus:ring-0">
                                    {Object.entries(sorts).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                </select>
                            </label>
                        </div>
                    </div>

                    {activeCount > 0 && (
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            {[
                                filters.condition && [filters.condition === 'new' ? 'Neuf' : 'Reconditionné', { condition: '', grade: [] }],
                                ...(filters.grade ?? []).map((g) => [`Grade ${g}`, { grade: filters.grade.filter((x) => x !== g) }]),
                                ...(filters.brand ?? []).map((b) => [facets.brands.find((x) => x.slug === b)?.name ?? b, { brand: filters.brand.filter((x) => x !== b) }]),
                                ...(filters.storage ?? []).map((s) => [s, { storage: filters.storage.filter((x) => x !== s) }]),
                                (filters.min || filters.max) && [filters.max ? (filters.min ? `${money(filters.min)} à ${money(filters.max)}` : `Moins de ${money(filters.max)}`) : `Plus de ${money(filters.min)}`, { min: '', max: '' }],
                                filters.stock && ['En stock', { stock: '' }],
                            ].filter(Boolean).map(([label, next]) => (
                                <button key={label} onClick={() => apply(next)} className="inline-flex items-center gap-1.5 rounded-md bg-ink py-1.5 pl-3 pr-2 text-sm font-medium text-white hover:bg-als" aria-label={`Retirer le filtre ${label}`}>
                                    {label}<Icon name="close" className="h-3.5 w-3.5" />
                                </button>
                            ))}
                            <button onClick={() => router.get(baseUrl, filters.q ? { q: filters.q } : {})} className="px-1 text-sm font-semibold underline decoration-2 underline-offset-4 hover:text-als">Tout effacer</button>
                        </div>
                    )}

                    {products.data.length ? (
                        <div className="mt-6 grid grid-cols-2 gap-3 md:gap-5 xl:grid-cols-3">
                            {products.data.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 4} />)}
                        </div>
                    ) : (
                        <div className="mt-6 rounded-xl bg-bone px-6 py-16 text-center">
                            <p className="font-display text-4xl font-black leading-none tracking-tight">Aucun appareil ne correspond.</p>
                            <p className="mt-2 text-graphite">Retirez un filtre, ou demandez-nous sur WhatsApp : on peut souvent le trouver.</p>
                            <button onClick={() => router.get(baseUrl)} className="btn-ink mt-6">Voir tout le rayon</button>
                        </div>
                    )}
                    <Pagination links={products.links} />
                </div>
            </div>

            {/* Tiroir de filtres mobile */}
            <div className={cx('fixed inset-0 z-50 lg:hidden', drawer ? 'visible' : 'invisible')}>
                <div onClick={() => setDrawer(false)} className={cx('absolute inset-0 bg-ink/50 transition', drawer ? 'opacity-100' : 'opacity-0')} />
                <div className={cx('absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-xl bg-white p-5 transition-transform', drawer ? 'translate-y-0' : 'translate-y-full')}>
                    <div className="mb-6 flex items-center justify-between">
                        <p className="font-display text-3xl font-black leading-none tracking-tight">Filtres</p>
                        <button onClick={() => setDrawer(false)} className="grid h-10 w-10 place-items-center rounded-lg bg-bone" aria-label="Fermer les filtres"><Icon name="close" /></button>
                    </div>
                    {panel}
                    <button onClick={() => setDrawer(false)} className="btn-ink sticky bottom-0 mt-8 w-full py-4">Voir {products.total} résultat{products.total > 1 ? 's' : ''}</button>
                </div>
            </div>
        </ShopLayout>
    );
}

function Facet({ title, children }) {
    return (
        <div>
            <p className="eyebrow mb-3 text-graphite">{title}</p>
            {children}
        </div>
    );
}

function PriceRange({ min, max, ceiling, onApply, money }) {
    const [lo, setLo] = useState(min ?? '');
    const [hi, setHi] = useState(max ?? '');
    const presets = [[0, 50000], [50000, 150000], [150000, 300000], [300000, null]].filter(([a]) => a < (ceiling || Infinity));
    return (
        <div>
            <div className="flex flex-wrap gap-2">
                {presets.map(([a, b]) => (
                    <button key={a} onClick={() => { setLo(a || ''); setHi(b ?? ''); onApply(a || '', b ?? ''); }}
                        className={cx('chip text-[13px]', String(min ?? '') === String(a || '') && String(max ?? '') === String(b ?? '') && 'chip-on')}>
                        {b ? (a ? `${money(a).replace(/\s?FCFA|\s?€/, '')} – ${money(b)}` : `< ${money(b)}`) : `> ${money(a)}`}
                    </button>
                ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); onApply(lo, hi); }} className="mt-3 flex items-center gap-2">
                <input inputMode="numeric" value={lo} onChange={(e) => setLo(e.target.value.replace(/\D/g, ''))} placeholder="Min" aria-label="Prix minimum" className="field py-2 text-sm" />
                <span className="text-graphite">–</span>
                <input inputMode="numeric" value={hi} onChange={(e) => setHi(e.target.value.replace(/\D/g, ''))} placeholder="Max" aria-label="Prix maximum" className="field py-2 text-sm" />
                <button className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-ink text-white" aria-label="Appliquer le budget"><Icon name="arrow" className="h-4 w-4" /></button>
            </form>
        </div>
    );
}
