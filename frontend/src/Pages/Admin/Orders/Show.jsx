import { useForm } from '@/lib/kit';
import AdminLayout, { StatusBadge } from '@/Layouts/AdminLayout';
import Icon, { WhatsAppGlyph } from '@/Components/Icon';
import { useMoney, waLink } from '@/lib/format';
import { route } from '@/lib/routes';

export default function OrderShow({ order, statuses, paymentStatuses }) {
    const money = useMoney();
    const { data, setData, patch, processing, isDirty } = useForm({
        status: order.status,
        payment_status: order.payment_status,
        payment_reference: order.payment_reference ?? '',
        tracking_number: order.tracking_number ?? '',
    });
    const save = (e) => {
        e.preventDefault();
        if (data.status === 'cancelled' && order.status !== 'cancelled' && !confirm('Annuler la commande ? Le stock sera remis en vente.')) return;
        patch(route('admin.orders.update', order.id), { preserveScroll: true });
    };

    return (
        <AdminLayout title={`Commande ${order.number}`} actions={<a href={order.invoice_url} className="btn-ghost py-2"><Icon name="download" className="h-4 w-4" /> Facture</a>}>
            <div className="grid gap-4 xl:grid-cols-3">
                <div className="space-y-4 xl:col-span-2">
                    <section className="card-admin p-5">
                        <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge status={order.status} label={statuses[order.status]} />
                            <StatusBadge status={order.payment_status} label={`Paiement ${paymentStatuses[order.payment_status].toLowerCase()}`} />
                            <span className="ml-auto text-sm text-graphite">{new Date(order.created_at).toLocaleString('fr-FR')}</span>
                        </div>
                        <table className="mt-5 w-full text-sm">
                            <tbody className="divide-y divide-bone-200">
                                {order.items.map((it) => (
                                    <tr key={it.id}>
                                        <td className="py-3"><span className="font-medium">{it.product_name}</span><span className="block text-xs text-graphite">{it.variant_label} · <span className="font-mono">{it.sku}</span></span></td>
                                        <td className="py-3 text-center font-mono">{it.quantity} × {money(it.unit_price)}</td>
                                        <td className="py-3 text-right font-semibold">{money(it.line_total)}</td>
                                    </tr>
                                ))}
                                <tr><td className="py-2 text-graphite" colSpan={2}>Livraison {order.zone_name && `· ${order.zone_name}`}</td><td className="py-2 text-right">{money(order.delivery_fee)}</td></tr>
                                <tr><td className="py-3 font-semibold" colSpan={2}>Total</td><td className="py-3 text-right font-display text-xl font-extrabold">{money(order.total)}</td></tr>
                            </tbody>
                        </table>
                    </section>

                    <form onSubmit={save} className="card-admin grid gap-4 p-5 sm:grid-cols-2">
                        <h2 className="font-display text-lg font-bold sm:col-span-2">Traitement</h2>
                        <label><span className="label">Statut</span>
                            <select className="field" value={data.status} onChange={(e) => setData('status', e.target.value)}>{Object.entries(statuses).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
                        </label>
                        <label><span className="label">Paiement · {order.payment_label}</span>
                            <select className="field" value={data.payment_status} onChange={(e) => setData('payment_status', e.target.value)}>{Object.entries(paymentStatuses).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
                        </label>
                        <label><span className="label">Référence de transaction</span><input className="field" value={data.payment_reference} onChange={(e) => setData('payment_reference', e.target.value)} placeholder="ID Wave / OM" /></label>
                        <label><span className="label">N° de suivi / livreur</span><input className="field" value={data.tracking_number} onChange={(e) => setData('tracking_number', e.target.value)} /></label>
                        <div className="sm:col-span-2"><button disabled={processing || !isDirty} className="btn-ink">Enregistrer</button></div>
                    </form>
                </div>

                <aside className="card-admin h-fit p-5">
                    <h2 className="font-display text-lg font-bold">Client</h2>
                    <p className="mt-3 font-medium">{order.customer_name}</p>
                    <a href={`tel:${order.customer_phone}`} className="block text-sm hover:underline">{order.customer_phone}</a>
                    {order.customer_email && <a href={`mailto:${order.customer_email}`} className="block text-sm text-graphite hover:underline">{order.customer_email}</a>}
                    <div className="mt-4 border-t border-bone-200 pt-4 text-sm">
                        <p className="eyebrow text-graphite">{order.delivery_method === 'pickup' ? 'Retrait' : 'Livraison'}</p>
                        <p className="mt-1">{order.address || '—'}</p>
                        {order.notes && <p className="mt-2 rounded-lg bg-bone p-2 text-graphite">{order.notes}</p>}
                        {order.source && <p className="mt-3 text-xs text-graphite">Origine : <span className="capitalize">{order.source}</span></p>}
                    </div>
                    <a href={waLink(((d) => (d.length === 9 ? '221' + d : d))(order.customer_phone.replace(/\D/g, '')), `Bonjour ${order.customer_name}, ALS Devices ici concernant votre commande ${order.number}.`)} target="_blank" rel="noopener" className="btn-wa mt-5 w-full"><WhatsAppGlyph /> Contacter</a>
                    <a href={order.track_url} target="_blank" className="mt-2 block text-center text-xs text-graphite underline">Page de suivi client</a>
                </aside>
            </div>
        </AdminLayout>
    );
}
