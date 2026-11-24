import { Link, usePage, useRouter } from '@/lib/kit';
import { useShop } from '@/lib/shop';
import { useEffect, useMemo, useState } from 'react';
import ShopLayout from '@/Layouts/ShopLayout';
import Seo from '@/Components/Seo';
import ProductCard from '@/Components/ProductCard';
import DeviceArt from '@/Components/DeviceArt';
import QtyStepper from '@/Components/QtyStepper';
import Icon, { WhatsAppGlyph } from '@/Components/Icon';
import { BatteryMeter, ConditionPill, GradeStamp, StockLine } from '@/Components/Badges';
import { cx, track, useMoney, waLink } from '@/lib/format';
import { route } from '@/lib/routes';

export default function ProductShow({ product, reviews, related, grades }) {
    const { shop, current } = usePage().props;
    const { cart, notify } = useShop();
    const router = useRouter();
    const money = useMoney();
    const variants = product.variants;
    const storages = [...new Set(variants.map((v) => v.storage).filter(Boolean))];
    const colors = [...new Map(variants.filter((v) => v.color).map((v) => [v.color, { name: v.color, hex: v.color_hex }])).values()];

    const firstAvailable = variants.find((v) => v.stock > 0) ?? variants[0];
    const [storage, setStorage] = useState(firstAvailable?.storage ?? null);
    const [color, setColor] = useState(firstAvailable?.color ?? null);
    const [qty, setQty] = useState(1);
    const [img, setImg] = useState(0);
    const busy = false;

    const variant = useMemo(
        () => variants.find((v) => (v.storage ?? null) === storage && (v.color ?? null) === color)
            ?? variants.find((v) => (v.storage ?? null) === storage)
            ?? variants[0],
        [storage, color, variants],
    );
    const exists = (s, c) => variants.some((v) => (v.storage ?? null) === s && (v.color ?? null) === c);
    const inStockFor = (s, c) => variants.some((v) => (v.storage ?? null) === s && (c === undefined || (v.color ?? null) === c) && v.stock > 0);

    useEffect(() => { setQty(1); }, [variant?.id]);
    useEffect(() => { track('ViewContent', { content_ids: [variant?.sku], content_type: 'product', value: variant?.price, currency: shop.currency }); }, []);

    const soldOut = !variant || variant.stock < 1;
    const add = (buyNow = false) => {
        if (soldOut) return;
        track('AddToCart', { content_ids: [variant.sku], value: variant.price * qty, currency: shop.currency });
        cart.add(variant.id, qty, product.is_unique ? 1 : Math.min(variant.stock, 20));
        if (buyNow) router.visit(route('checkout.create'));
        else notify(`${product.name} ajouté au panier.`);
    };

    const label = [variant?.storage, variant?.color].filter(Boolean).join(' · ');
    const shareUrl = current.location;
    const waText = `Bonjour ALS Devices, je suis intéressé(e) par : ${product.name}${label ? ' (' + label + ')' : ''} à ${money(variant?.price)}.\n${shareUrl}`;
    const discount = variant?.compare_at_price ? Math.round((1 - variant.price / variant.compare_at_price) * 100) : null;
    const images = product.images.length ? product.images : null;

    return (
        <ShopLayout hideWhatsApp>
            <Seo
                title={product.meta_title || `${product.name}${product.condition === 'refurbished' ? ' reconditionné' : ''}`}
                description={product.meta_description}
                image={images?.[0]?.url}
                type="product"
                jsonLd={{
                    '@context': 'https://schema.org',
                    '@type': 'Product',
                    name: product.name,
                    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
                    description: product.short_description,
                    image: images?.map((i) => i.url),
                    sku: variant?.sku,
                    itemCondition: product.condition === 'new' ? 'https://schema.org/NewCondition' : 'https://schema.org/RefurbishedCondition',
                    offers: variants.map((v) => ({
                        '@type': 'Offer',
                        sku: v.sku,
                        price: v.price,
                        priceCurrency: shop.currency,
                        availability: v.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                        url: current.location,
                    })),
                }}
            />

            <div className="container-als pt-6">
                <nav className="eyebrow flex flex-wrap items-center gap-2 text-graphite" aria-label="Fil d'Ariane">
                    <Link href={route('home')} className="hover:text-ink">Accueil</Link><span>/</span>
                    {product.category_slug && <><Link href={route('catalog.category', product.category_slug)} className="hover:text-ink">{product.category}</Link><span>/</span></>}
                    <span className="text-ink">{product.name}</span>
                </nav>
            </div>

            <div className="container-als mt-6 grid gap-8 lg:grid-cols-12 lg:gap-14">
                {/* GALERIE */}
                <div className="lg:col-span-7">
                    <div className="lg:sticky lg:top-24">
                        <div className="relative aspect-square overflow-hidden rounded-xl bg-bone">
                            {images ? (
                                <img src={images[img].url} alt={images[img].alt} className="h-full w-full object-contain p-8 mix-blend-multiply" />
                            ) : (
                                <div className="h-full p-16"><DeviceArt type={product.category_icon} color={variant?.color_hex} /></div>
                            )}
                            <div className="absolute left-4 top-4"><ConditionPill condition={product.condition} grade={product.grade} /></div>
                            {discount > 0 && <span className="tag-hole absolute right-0 top-5 rounded-l-md bg-als py-2 pl-8 pr-4 font-display text-2xl font-black leading-none text-white">−{discount}%</span>}
                        </div>
                        {images && images.length > 1 && (
                            <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
                                {images.map((im, i) => (
                                    <button key={i} onClick={() => setImg(i)} aria-label={`Photo ${i + 1}`} className={cx('h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-bone', i === img ? 'border-ink' : 'border-transparent')}>
                                        <img src={im.url} alt="" className="h-full w-full object-contain p-1.5 mix-blend-multiply" loading="lazy" />
                                    </button>
                                ))}
                            </div>
                        )}
                        {!images && <p className="mt-3 text-center font-mono text-xs text-graphite">Photos réelles de l'appareil disponibles sur WhatsApp</p>}
                    </div>
                </div>

                {/* ACHAT */}
                <div className="lg:col-span-5">
                    <p className="eyebrow text-graphite">{product.brand}</p>
                    <h1 className="h-display mt-2 text-6xl md:text-7xl">{product.name}</h1>
                    {product.short_description && <p className="mt-4 leading-relaxed text-graphite">{product.short_description}</p>}

                    <div className="mt-6 flex items-baseline gap-3">
                        <span className="font-display text-5xl font-black leading-none tracking-tight">{money(variant?.price)}</span>
                        {variant?.compare_at_price && <span className="text-lg text-graphite line-through">{money(variant.compare_at_price)}</span>}
                    </div>
                    <div className="mt-2"><StockLine inStock={!soldOut} low={variant?.low_stock} unique={product.is_unique} /></div>

                    {storages.length > 0 && (
                        <fieldset className="mt-8">
                            <legend className="eyebrow mb-3 text-graphite">Stockage</legend>
                            <div className="flex flex-wrap gap-2">
                                {storages.map((s) => {
                                    const available = inStockFor(s);
                                    return (
                                        <button key={s} type="button" onClick={() => { setStorage(s); if (!exists(s, color)) setColor(variants.find((v) => v.storage === s)?.color ?? null); }}
                                            className={cx('rounded-lg border-2 px-4 py-2.5 text-sm font-bold transition', storage === s ? 'border-ink bg-ink text-white' : 'border-bone-300 hover:border-ink', !available && 'opacity-40 line-through')}>
                                            {s}
                                        </button>
                                    );
                                })}
                            </div>
                        </fieldset>
                    )}

                    {colors.length > 0 && (
                        <fieldset className="mt-6">
                            <legend className="eyebrow mb-3 text-graphite">Couleur · <span className="text-ink">{color}</span></legend>
                            <div className="flex flex-wrap gap-3">
                                {colors.map((c) => {
                                    const possible = exists(storage, c.name) || !storages.length;
                                    return (
                                        <button key={c.name} type="button" disabled={!possible} onClick={() => setColor(c.name)} title={c.name} aria-label={c.name}
                                            className={cx('h-10 w-10 rounded-full border-[3px] border-white ring-2 transition disabled:opacity-25', color === c.name ? 'ring-ink' : 'ring-bone-300 hover:ring-graphite')}
                                            style={{ background: c.hex || '#ccc' }} />
                                    );
                                })}
                            </div>
                        </fieldset>
                    )}

                    <div className="mt-8 flex items-center gap-3">
                        {!product.is_unique && !soldOut && <QtyStepper value={qty} max={Math.min(variant.stock, 20)} onChange={setQty} />}
                        <button onClick={() => add(false)} disabled={soldOut || busy} className="btn-ink flex-1 py-4 text-base">
                            <Icon name="bag" className="h-5 w-5" /> {soldOut ? 'Épuisé' : 'Ajouter au panier'}
                        </button>
                    </div>
                    {!soldOut && <button onClick={() => add(true)} disabled={busy} className="btn-red mt-3 w-full py-4 text-base">Acheter maintenant</button>}
                    <a href={waLink(shop.whatsapp, waText)} target="_blank" rel="noopener" className="btn-wa mt-3 w-full py-4 text-base">
                        <WhatsAppGlyph /> {soldOut ? 'Être prévenu du retour en stock' : 'Commander sur WhatsApp'}
                    </a>

                    {/* FICHE DE CONTRÔLE */}
                    <div className="mt-8 overflow-hidden rounded-xl border-2 border-ink">
                        <div className="flex items-center justify-between bg-ink px-5 py-3 text-white">
                            <span className="eyebrow">Fiche de contrôle ALS</span>
                            <span className="font-mono text-xs text-white/60">{variant?.sku}</span>
                        </div>
                        <dl className="divide-y divide-bone-200">
                            <Row label="État">
                                <div className="flex items-center gap-3">
                                    {product.grade && <GradeStamp grade={product.grade} />}
                                    <div>
                                        <p className="font-semibold">{product.condition === 'new' ? 'Neuf, scellé' : `Reconditionné grade ${product.grade}`}</p>
                                        {product.grade && <p className="text-sm text-graphite">{grades[product.grade]}</p>}
                                    </div>
                                </div>
                            </Row>
                            {product.battery_health != null && <Row label="Santé batterie"><BatteryMeter value={product.battery_health} /></Row>}
                            <Row label="Garantie"><span className="font-semibold">{product.warranty_months} mois</span> <span className="text-sm text-graphite">· facture incluse</span></Row>
                            {product.condition === 'refurbished' && <Row label="Contrôles"><span className="font-semibold">40 points vérifiés</span> <span className="text-sm text-graphite">· débloqué tous opérateurs</span></Row>}
                        </dl>
                    </div>

                    <ul className="mt-6 grid grid-cols-2 gap-3 text-sm">
                        {[['truck', 'Livraison 24 h à Dakar'], ['cash', 'Paiement à la livraison'], ['shield', '7 jours pour changer d\'avis'], ['chat', 'Conseil sur WhatsApp']].map(([i, t]) => (
                            <li key={t} className="flex items-center gap-2.5 rounded-lg bg-bone px-3 py-3"><Icon name={i} className="h-5 w-5 shrink-0 text-als" />{t}</li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* DÉTAILS */}
            <div className="container-als mt-20 grid gap-12 lg:grid-cols-12">
                <section className="lg:col-span-7">
                    <h2 className="h-display text-3xl">Description</h2>
                    <div className="mt-4 whitespace-pre-line leading-relaxed text-ink/80">{product.description || product.short_description}</div>
                </section>
                {product.specs?.length > 0 && (
                    <section className="lg:col-span-5">
                        <h2 className="h-display text-3xl">Caractéristiques</h2>
                        <dl className="mt-4 divide-y divide-bone-200 border-y border-bone-200">
                            {product.specs.map((s) => (
                                <div key={s.label} className="flex justify-between gap-6 py-3 text-sm">
                                    <dt className="text-graphite">{s.label}</dt><dd className="text-right font-medium">{s.value}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>
                )}
            </div>

            {reviews.length > 0 && (
                <section className="container-als mt-16">
                    <h2 className="h-display text-3xl">Avis clients</h2>
                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                        {reviews.map((r, i) => (
                            <figure key={i} className="rounded-2xl bg-bone p-5">
                                <div className="flex gap-0.5 text-als">{Array.from({ length: r.rating }).map((_, k) => <Icon key={k} name="star" className="h-4 w-4 fill-current" />)}</div>
                                <blockquote className="mt-3 text-sm leading-relaxed">« {r.body} »</blockquote>
                                <figcaption className="eyebrow mt-4 text-graphite">{r.author}</figcaption>
                            </figure>
                        ))}
                    </div>
                </section>
            )}

            {related.length > 0 && (
                <section className="container-als mt-20">
                    <h2 className="h-display text-3xl md:text-4xl">Dans le même rayon</h2>
                    <div className="mt-6 grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
                        {related.map((p) => <ProductCard key={p.id} product={p} />)}
                    </div>
                </section>
            )}

            {/* Barre d'achat mobile */}
            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-bone-200 bg-white/95 p-3 backdrop-blur lg:hidden">
                <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1 pl-1">
                        <p className="truncate text-xs text-graphite">{label || product.name}</p>
                        <p className="font-display text-lg font-extrabold leading-tight tracking-tight">{money(variant?.price)}</p>
                    </div>
                    <a href={waLink(shop.whatsapp, waText)} target="_blank" rel="noopener" aria-label="Commander sur WhatsApp" className="grid h-12 w-12 place-items-center rounded-full bg-[#25D366]"><WhatsAppGlyph className="h-6 w-6" /></a>
                    <button onClick={() => add(true)} disabled={soldOut || busy} className="btn-red h-12 px-6">{soldOut ? 'Épuisé' : 'Acheter'}</button>
                </div>
            </div>
            <div className="h-20 lg:hidden" />
        </ShopLayout>
    );
}

function Row({ label, children }) {
    return (
        <div className="grid grid-cols-[88px_1fr] items-center gap-3 px-4 sm:grid-cols-[110px_1fr] sm:gap-4 sm:px-5 py-4">
            <dt className="eyebrow text-graphite">{label}</dt>
            <dd>{children}</dd>
        </div>
    );
}
