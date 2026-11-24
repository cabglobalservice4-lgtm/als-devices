import { useEffect } from 'react';
import { Link, usePage } from '@/lib/kit';
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
    const { nav } = usePage().props;
    const { cart } = useShop();
    const unavailable = lines.filter((l) => !l.available);
    const count = lines.filter((l) => l.available).reduce((n, l) => n + l.quantity, 0);
    const update = (id, quantity) => cart.setQuantity(id, quantity);
    const remove = (id) => cart.remove(id);
    const canOrder = subtotal > 0;

    // Aligne le panier local sur ce que l'API a validé (stock réel, articles retirés)
    useEffect(() => {
        const fix = lines.filter((l) => l.adjusted).map((l) => [l.variant_id, l.quantity]);
        fix.forEach(([id, q]) => cart.setQuantity(id, q));
        removed.forEach((id) => cart.remove(id));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lines, removed]);

    return (
        <ShopLayout hideWhatsApp={lines.length > 0}>
            <Seo title="Panier" noindex />
            <div className="container-als py-10 md:py-14">
                <h1 className="h-display text-6xl md:text-7xl">Panier</h1>
                {lines.length > 0 && <p className="mt-2 text-graphite">{count} article{count > 1 ? 's' : ''}</p>}

                {!lines.length ? (
                    <div className="mt-8 rounded-xl bg-bone px-6 py-14 md:px-12">
                        <p className="font-display text-4xl font-black leading-none tracking-tight">Votre panier est vide.</p>
                        <p className="mt-3 max-w-md text-graphite">Commencez par un rayon, ou demandez-nous conseil sur WhatsApp.</p>
                        <div className="mt-6 flex flex-wrap gap-2">
                            {nav.map((c) => (
                                <Link key={c.slug} href={route('catalog.category', c.slug)} className="chip bg-white py-2.5"><Icon name={c.icon} className="h-4 w-4" />{c.name}</Link>
                            ))}
                        </div>
                        <Link href={route('catalog.index')} className="btn-ink mt-8">Voir toute la boutique</Link>
                    </div>
                ) : (
                    <div className="mt-8 grid gap-10 lg:grid-cols-12">
                        <div className="lg:col-span-8">
                            {unavailable.length > 0 && (
                                <p className="mb-4 flex gap-2 rounded-lg bg-als-light px-4 py-3 text-sm text-als-dark">
                                    <Icon name="close" className="mt-0.5 h-4 w-4 shrink-0" />
                                    {unavailable.length > 1 ? `${unavailable.length} articles ne sont plus disponibles` : 'Un article n\'est plus disponible'} : il ne sera pas commandé. Retirez-le pour continuer.
                                </p>
                            )}
                            <ul className="divide-y divide-bone-200 border-y-2 border-ink">
                                {lines.map((l) => (
                                    <li key={l.variant_id} className={cx('flex gap-4 py-5', !l.available && 'opacity-50')}>
                                        <Link href={route('products.show', l.slug)} className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-bone md:h-28 md:w-28">
                                            {l.image ? <img src={l.image} alt="" className="h-full w-full object-contain p-2 mix-blend-multiply" /> : <div className="h-full p-3"><DeviceArt type={l.category_icon} /></div>}
                                        </Link>
                                        <div className="flex min-w-0 flex-1 flex-col">
                                            <div className="flex justify-between gap-3">
                                                <div className="min-w-0">
                                                    <Link href={route('products.show', l.slug)} className="text-[17px] font-bold leading-tight hover:underline">{l.name}</Link>
                                                    <p className="mt-0.5 text-sm text-graphite">{[l.variant_label, l.condition].filter(Boolean).join(', ')}</p>
                                                </div>
                                                <p className="shrink-0 font-display text-2xl font-black leading-none tracking-tight">{money(l.line_total)}</p>
                                            </div>
                                            <div className="mt-auto flex items-center justify-between pt-3">
                                                {l.available
                                                    ? (l.max > 1 ? <QtyStepper value={l.quantity} max={l.max} onChange={(q) => update(l.variant_id, q)} /> : <span className="text-[13px] text-graphite">Pièce unique, quantité 1</span>)
                                                    : <span className="text-[13px] font-semibold text-als">Plus disponible</span>}
                                                <button onClick={() => remove(l.variant_id)} className="-mr-2 flex items-center gap-1.5 rounded-md px-2 py-2 text-sm text-graphite hover:bg-bone hover:text-als"><Icon name="trash" className="h-4 w-4" /> Retirer</button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            <Link href={route('catalog.index')} className="mt-6 inline-flex items-center gap-2 text-[15px] font-bold underline decoration-2 underline-offset-4 hover:text-als">Continuer mes achats</Link>
                        </div>

                        <aside className="lg:col-span-4">
                            <div className="sticky top-24 rounded-xl bg-ink p-6 text-white">
                                <p className="font-display text-3xl font-black leading-none tracking-tight">Récapitulatif</p>
                                <div className="mt-5 flex justify-between text-white/80"><span>Sous-total</span><span className="font-mono">{money(subtotal)}</span></div>
                                <div className="mt-2 flex justify-between gap-4 text-sm text-white/60"><span>Livraison</span><span className="text-right">selon la zone, à l'étape suivante</span></div>
                                <div className="my-5 h-px bg-white/15" />
                                <div className="flex items-baseline justify-between"><span>Total</span><span className="font-display text-4xl font-black leading-none tracking-tight">{money(subtotal)}</span></div>
                                <Link href={route('checkout.create')} aria-disabled={!canOrder} className={cx('btn-red mt-6 w-full py-4 text-base', !canOrder && 'pointer-events-none opacity-50')}>Passer la commande</Link>
                                <ul className="mt-5 space-y-2 text-sm text-white/75">
                                    <li className="flex gap-2"><Icon name="cash" className="h-4 w-4 shrink-0 text-als" /> Vous payez à la livraison si vous le souhaitez</li>
                                    <li className="flex gap-2"><Icon name="shield" className="h-4 w-4 shrink-0 text-als" /> Garantie et facture incluses</li>
                                </ul>
                            </div>
                        </aside>
                    </div>
                )}
            </div>

            {/* Barre de commande mobile : le total et le bouton restent visibles */}
            {lines.length > 0 && (
                <>
                    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-bone-200 bg-white/95 p-3 backdrop-blur lg:hidden">
                        <div className="flex items-center gap-3">
                            <div className="min-w-0 flex-1 pl-1">
                                <p className="text-xs text-graphite">Total hors livraison</p>
                                <p className="font-display text-2xl font-black leading-none tracking-tight">{money(subtotal)}</p>
                            </div>
                            <Link href={route('checkout.create')} aria-disabled={!canOrder} className={cx('btn-red h-12 px-6', !canOrder && 'pointer-events-none opacity-50')}>Commander</Link>
                        </div>
                    </div>
                    <div className="h-16 lg:hidden" />
                </>
            )}
        </ShopLayout>
    );
}
