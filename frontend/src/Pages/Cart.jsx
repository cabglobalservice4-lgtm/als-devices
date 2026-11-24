import { useEffect } from 'react';
import { Link } from '@/lib/kit';
import { useShop } from '@/lib/shop';
import ShopLayout from '@/Layouts/ShopLayout';
import Seo from '@/Components/Seo';
import DeviceArt from '@/Components/DeviceArt';
import QtyStepper from '@/Components/QtyStepper';
import Icon from '@/Components/Icon';
import { cx, useMoney } from '@/lib/format';
import { route } from '@/lib/routes';

export default function Cart({ lines, subtotal, removed = [] }) {
    const money = useMoney();
    const { cart } = useShop();
    const unavailable = lines.filter((l) => !l.available);
    const update = (id, quantity) => cart.setQuantity(id, quantity);
    const remove = (id) => cart.remove(id);

    // Aligne le panier local sur ce que l'API a validé (stock réel, articles retirés)
    useEffect(() => {
        const fix = lines.filter((l) => l.adjusted).map((l) => [l.variant_id, l.quantity]);
        fix.forEach(([id, q]) => cart.setQuantity(id, q));
        removed.forEach((id) => cart.remove(id));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lines, removed]);

    return (
        <ShopLayout>
            <Seo title="Panier" noindex />
            <div className="container-als py-10 md:py-14">
                <h1 className="h-display text-5xl md:text-6xl">Panier<span className="text-als">.</span></h1>

                {!lines.length ? (
                    <div className="mt-10 rounded-3xl bg-bone px-6 py-20 text-center">
                        <Icon name="bag" className="mx-auto h-12 w-12 text-graphite" strokeWidth={1.3} />
                        <p className="mt-4 font-display text-3xl font-bold tracking-tight">Votre panier est vide.</p>
                        <Link href={route('catalog.index')} className="btn-ink mt-6">Découvrir la boutique <Icon name="arrow" className="h-4 w-4" /></Link>
                    </div>
                ) : (
                    <div className="mt-10 grid gap-10 lg:grid-cols-12">
                        <div className="lg:col-span-8">
                            {unavailable.length > 0 && (
                                <p className="mb-4 rounded-xl bg-als-light px-4 py-3 text-sm text-als-dark">
                                    {unavailable.length} article(s) ne sont plus disponibles et ne seront pas commandés.
                                </p>
                            )}
                            <ul className="divide-y divide-bone-200 border-y border-bone-200">
                                {lines.map((l) => (
                                    <li key={l.variant_id} className={cx('flex gap-4 py-5', !l.available && 'opacity-50')}>
                                        <Link href={route('products.show', l.slug)} className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-bone md:h-28 md:w-28">
                                            {l.image ? <img src={l.image} alt="" className="h-full w-full object-contain p-2 mix-blend-multiply" /> : <div className="h-full p-3"><DeviceArt type={l.category_icon} /></div>}
                                        </Link>
                                        <div className="flex min-w-0 flex-1 flex-col">
                                            <div className="flex justify-between gap-3">
                                                <div className="min-w-0">
                                                    <Link href={route('products.show', l.slug)} className="font-display text-lg font-bold leading-tight tracking-tight hover:underline">{l.name}</Link>
                                                    <p className="mt-0.5 text-sm text-graphite">{[l.variant_label, l.condition].filter(Boolean).join(' · ')}</p>
                                                </div>
                                                <p className="shrink-0 font-display text-lg font-extrabold tracking-tight">{money(l.line_total)}</p>
                                            </div>
                                            <div className="mt-auto flex items-center justify-between pt-3">
                                                {l.available ? (l.max > 1 ? <QtyStepper value={l.quantity} max={l.max} onChange={(q) => update(l.variant_id, q)} /> : <span className="font-mono text-xs text-graphite">Qté 1 · pièce unique</span>) : <span className="font-mono text-xs text-als">Indisponible</span>}
                                                <button onClick={() => remove(l.variant_id)} className="flex items-center gap-1.5 text-sm text-graphite hover:text-als"><Icon name="trash" className="h-4 w-4" /> Retirer</button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            <Link href={route('catalog.index')} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold">← Continuer mes achats</Link>
                        </div>

                        <aside className="lg:col-span-4">
                            <div className="sticky top-24 rounded-3xl bg-ink p-6 text-white">
                                <p className="eyebrow text-white/50">Récapitulatif</p>
                                <div className="mt-5 flex justify-between text-white/80"><span>Sous-total</span><span>{money(subtotal)}</span></div>
                                <div className="mt-2 flex justify-between text-sm text-white/60"><span>Livraison</span><span>calculée à l'étape suivante</span></div>
                                <div className="my-5 h-px bg-white/10" />
                                <div className="flex items-baseline justify-between"><span>Total</span><span className="font-display text-3xl font-extrabold tracking-tight">{money(subtotal)}</span></div>
                                <Link href={route('checkout.create')} className={cx('btn-red mt-6 w-full py-4 text-base', subtotal <= 0 && 'pointer-events-none opacity-50')}>Commander <Icon name="arrow" className="h-4 w-4" /></Link>
                                <ul className="mt-5 space-y-2 text-sm text-white/70">
                                    <li className="flex gap-2"><Icon name="cash" className="h-4 w-4 text-als" /> Paiement à la livraison possible</li>
                                    <li className="flex gap-2"><Icon name="shield" className="h-4 w-4 text-als" /> Garantie et facture incluses</li>
                                </ul>
                            </div>
                        </aside>
                    </div>
                )}
            </div>
        </ShopLayout>
    );
}
