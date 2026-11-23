import { Link, usePage } from '@/lib/kit';
import ShopLayout from '@/Layouts/ShopLayout';
import Seo from '@/Components/Seo';
import Icon, { WhatsAppGlyph } from '@/Components/Icon';
import { cx, useMoney, waLink } from '@/lib/format';
import { route } from '@/lib/routes';

const flow = ['new', 'confirmed', 'shipped', 'delivered'];

export default function OrderConfirmation({ order, instructions, statuses }) {
    const { shop } = usePage().props;
    const money = useMoney();
    const step = flow.indexOf(order.status);
    const cancelled = order.status === 'cancelled';

    return (
        <ShopLayout>
            <Seo title={`Commande ${order.number}`} noindex />
            <section className="bg-ink text-white">
                <div className="container-als py-14 md:py-20">
                    <span className="grid h-14 w-14 place-items-center rounded-full bg-als"><Icon name="check" className="h-7 w-7" strokeWidth={3} /></span>
                    <h1 className="h-display mt-6 text-5xl md:text-7xl">Merci, {order.customer_name.split(' ')[0]}<span className="text-als">.</span></h1>
                    <p className="mt-4 text-lg text-white/70">Commande <span className="font-mono font-semibold text-white">{order.number}</span> enregistrée le {order.created_at}.</p>
                    <p className="mt-1 text-white/70">Nous vous appelons au {order.customer_phone} pour confirmer.</p>
                </div>
            </section>

            <div className="container-als mt-10 grid gap-10 lg:grid-cols-12">
                <div className="space-y-8 lg:col-span-7">
                    {!cancelled ? (
                        <ol className="grid grid-cols-4 gap-2">
                            {flow.map((s, i) => (
                                <li key={s}>
                                    <div className={cx('h-1.5 rounded-full', i <= step ? 'bg-als' : 'bg-bone-200')} />
                                    <p className={cx('mt-2 text-xs md:text-sm', i <= step ? 'font-semibold' : 'text-graphite')}>{statuses[s]}</p>
                                </li>
                            ))}
                        </ol>
                    ) : <p className="rounded-xl bg-als-light px-4 py-3 text-als-dark">Cette commande a été annulée.</p>}

                    {instructions && (
                        <div className="rounded-2xl border-2 border-ink p-5">
                            <p className="eyebrow text-graphite">Paiement · {order.payment_label}</p>
                            <p className="mt-2 leading-relaxed">{instructions}</p>
                        </div>
                    )}

                    {order.tracking_number && <p className="rounded-xl bg-bone px-4 py-3">Suivi du colis : <span className="font-mono font-semibold">{order.tracking_number}</span></p>}

                    <div className="flex flex-wrap gap-3">
                        <a href={waLink(shop.whatsapp, `Bonjour ALS Devices, je viens de passer la commande ${order.number}.`)} target="_blank" rel="noopener" className="btn-wa"><WhatsAppGlyph /> Nous écrire</a>
                        <Link href={route('orders.invoice', order.token)} className="btn-ghost"><Icon name="download" className="h-4 w-4" /> Facture</Link>
                        <Link href={route('catalog.index')} className="btn-ghost">Continuer mes achats</Link>
                    </div>
                    <p className="text-sm text-graphite">Gardez cette page : son adresse vous permet de suivre votre commande.</p>
                </div>

                <aside className="lg:col-span-5">
                    <div className="rounded-3xl bg-bone p-6">
                        <p className="eyebrow text-graphite">Détail</p>
                        <ul className="mt-4 space-y-3">
                            {order.items.map((it, i) => (
                                <li key={i} className="flex justify-between gap-3">
                                    <span><span className="font-mono text-sm text-graphite">{it.quantity}×</span> {it.product_name}<span className="block text-sm text-graphite">{it.variant_label}</span></span>
                                    <span className="font-semibold">{money(it.line_total)}</span>
                                </li>
                            ))}
                        </ul>
                        <dl className="mt-5 space-y-2 border-t border-bone-300 pt-4 text-sm">
                            <div className="flex justify-between"><dt className="text-graphite">Sous-total</dt><dd>{money(order.subtotal)}</dd></div>
                            <div className="flex justify-between"><dt className="text-graphite">{order.delivery_method === 'pickup' ? 'Retrait' : `Livraison · ${order.zone}`}</dt><dd>{order.delivery_fee ? money(order.delivery_fee) : 'Gratuit'}</dd></div>
                            <div className="flex items-baseline justify-between pt-2"><dt className="font-semibold">Total</dt><dd className="font-display text-2xl font-extrabold">{money(order.total)}</dd></div>
                        </dl>
                        {order.address && <p className="mt-4 text-sm text-graphite">Adresse : {order.address}</p>}
                    </div>
                </aside>
            </div>
        </ShopLayout>
    );
}
