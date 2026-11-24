import { useEffect } from 'react';
import Seo from '@/Components/Seo';
import Logo from '@/Components/Logo';
import { Link } from '@/lib/kit';
import { route } from '@/lib/routes';
import { useMoney } from '@/lib/format';

/** Facture imprimable : bouton « Imprimer / PDF » du navigateur. */
export default function Invoice({ order, shopInfo, paymentStatuses }) {
    const money = useMoney();
    useEffect(() => { document.body.classList.add('print-page'); return () => document.body.classList.remove('print-page'); }, []);

    return (
        <div className="min-h-screen bg-bone py-8 print:bg-white print:py-0">
            <Seo title={`Facture ${order.number}`} noindex />
            <div className="mx-auto mb-4 flex max-w-3xl justify-between px-4 print:hidden">
                <Link href={route('orders.show', order.token)} className="text-sm font-semibold">← Retour à la commande</Link>
                <button onClick={() => window.print()} className="btn-ink py-2">Imprimer / Enregistrer en PDF</button>
            </div>
            <article className="mx-auto max-w-3xl overflow-hidden rounded-2xl bg-white shadow-tag print:rounded-none print:shadow-none">
                <header className="flex items-start justify-between bg-ink px-8 py-6 text-white print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]">
                    <div>
                        <Logo dark />
                        <p className="mt-3 text-sm text-white/70">{shopInfo.address} · {shopInfo.phone}</p>
                        <p className="text-sm text-white/70">{shopInfo.email}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-display text-2xl font-extrabold">FACTURE</p>
                        <p className="font-mono text-sm">{order.number}</p>
                        <p className="text-sm text-white/70">{new Date(order.created_at_raw).toLocaleDateString('fr-FR')}</p>
                    </div>
                </header>
                <div className="px-8 py-6">
                    <p className="eyebrow text-graphite">Client</p>
                    <p className="mt-1 font-semibold">{order.customer_name}</p>
                    <p className="text-sm">{order.customer_phone}{order.customer_email && ` · ${order.customer_email}`}</p>
                    {order.address && <p className="text-sm">{order.address}</p>}

                    <table className="mt-6 w-full text-sm">
                        <thead><tr className="eyebrow border-b-2 border-ink text-left text-graphite">
                            <th className="py-2 font-medium">Article</th><th className="py-2 font-medium">Réf.</th><th className="py-2 text-right font-medium">Prix</th><th className="py-2 text-right font-medium">Qté</th><th className="py-2 text-right font-medium">Total</th>
                        </tr></thead>
                        <tbody className="divide-y divide-bone-200">
                            {order.items.map((it, i) => (
                                <tr key={i}>
                                    <td className="py-2.5">{it.product_name}<span className="block text-xs text-graphite">{it.variant_label}</span></td>
                                    <td className="py-2.5 font-mono text-xs text-graphite">{it.sku}</td>
                                    <td className="py-2.5 text-right">{money(it.unit_price)}</td>
                                    <td className="py-2.5 text-right">{it.quantity}</td>
                                    <td className="py-2.5 text-right font-medium">{money(it.line_total)}</td>
                                </tr>
                            ))}
                            <tr><td colSpan={4} className="py-2 text-right text-graphite">Sous-total</td><td className="py-2 text-right">{money(order.subtotal)}</td></tr>
                            <tr><td colSpan={4} className="py-2 text-right text-graphite">Livraison</td><td className="py-2 text-right">{money(order.delivery_fee)}</td></tr>
                            <tr><td colSpan={4} className="py-3 text-right font-semibold">Total</td><td className="py-3 text-right font-display text-xl font-extrabold text-als">{money(order.total)}</td></tr>
                        </tbody>
                    </table>
                    <p className="mt-6 text-sm text-graphite">Paiement : {order.payment_label} — {paymentStatuses[order.payment_status]}</p>
                    <p className="mt-1 text-sm text-graphite">Garantie selon la fiche produit. Conservez cette facture : elle sert de justificatif de garantie.</p>
                </div>
            </article>
        </div>
    );
}
