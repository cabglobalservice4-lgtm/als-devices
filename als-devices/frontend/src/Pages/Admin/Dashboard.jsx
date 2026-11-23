import { Link } from '@/lib/kit';
import AdminLayout, { StatusBadge } from '@/Layouts/AdminLayout';
import { useMoney } from '@/lib/format';
import { route } from '@/lib/routes';

const statusLabels = { new: 'Nouvelle', confirmed: 'Confirmée', shipped: 'En livraison', delivered: 'Livrée', cancelled: 'Annulée' };

export default function Dashboard({ kpis, series, recentOrders, lowStock, sources }) {
    const money = useMoney();
    const max = Math.max(...series.map((s) => s.total), 1);
    const progress = Math.min(100, Math.round((kpis.revenue_month / kpis.break_even) * 100));

    return (
        <AdminLayout title="Tableau de bord">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Kpi label="CA du mois" value={money(kpis.revenue_month)}>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-bone-200"><div className="h-full bg-als" style={{ width: `${progress}%` }} /></div>
                    <p className="mt-1.5 text-xs text-graphite">{progress}% du seuil de rentabilité ({money(kpis.break_even)})</p>
                </Kpi>
                <Kpi label="Commandes du mois" value={kpis.orders_month} />
                <Kpi label="À traiter" value={kpis.orders_to_handle} href={route('admin.orders.index', { status: 'new' })} accent />
                <Kpi label="Paiements mobiles à vérifier" value={kpis.pending_payments} href={route('admin.orders.index')} />
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-3">
                <section className="card-admin p-5 xl:col-span-2">
                    <div className="flex items-baseline justify-between">
                        <h2 className="font-display text-lg font-bold">Ventes · 30 jours</h2>
                        <span className="font-mono text-xs text-graphite">{money(series.reduce((a, s) => a + s.total, 0))}</span>
                    </div>
                    <div className="mt-6 flex h-40 items-end gap-[3px]" role="img" aria-label="Ventes par jour sur 30 jours">
                        {series.map((s) => (
                            <div key={s.day} className="group relative flex-1">
                                <div className="w-full rounded-t-[3px] bg-ink transition group-hover:bg-als" style={{ height: `${Math.max(2, (s.total / max) * 150)}px` }} />
                                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2 py-1 text-xs text-white group-hover:block">
                                    {new Date(s.day).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} · {money(s.total)} · {s.orders} cde
                                </div>
                            </div>
                        ))}
                    </div>
                    {Object.keys(sources).length > 0 && (
                        <div className="mt-6 flex flex-wrap gap-2 border-t border-bone-200 pt-4">
                            <span className="eyebrow mr-2 self-center text-graphite">Origine (30 j)</span>
                            {Object.entries(sources).map(([k, n]) => <span key={k} className="rounded-full bg-bone px-3 py-1 text-sm"><span className="capitalize">{k}</span> · <b>{n}</b></span>)}
                        </div>
                    )}
                </section>

                <section className="card-admin p-5">
                    <h2 className="font-display text-lg font-bold">Stock bas</h2>
                    {lowStock.length ? (
                        <ul className="mt-3 divide-y divide-bone-200">
                            {lowStock.map((v) => (
                                <li key={v.sku} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                                    <Link href={route('admin.products.edit', v.id)} className="min-w-0 hover:underline">
                                        <span className="block truncate font-medium">{v.name}</span>
                                        <span className="font-mono text-xs text-graphite">{v.label || v.sku}</span>
                                    </Link>
                                    <span className={`font-mono font-bold ${v.stock === 0 ? 'text-als' : 'text-amber-600'}`}>{v.stock}</span>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="mt-3 text-sm text-graphite">Rien à signaler.</p>}
                </section>
            </div>

            <section className="card-admin mt-4 overflow-hidden">
                <div className="flex items-center justify-between p-5">
                    <h2 className="font-display text-lg font-bold">Dernières commandes</h2>
                    <Link href={route('admin.orders.index')} className="text-sm font-semibold text-als">Tout voir</Link>
                </div>
                <OrdersTable orders={recentOrders} money={money} />
            </section>
        </AdminLayout>
    );
}

function Kpi({ label, value, href, accent, children }) {
    const Comp = href ? Link : 'div';
    return (
        <Comp href={href} className={`card-admin block p-5 ${accent && value > 0 ? 'border-als' : ''}`}>
            <p className="eyebrow text-graphite">{label}</p>
            <p className={`mt-2 font-display text-3xl font-extrabold tracking-tight ${accent && value > 0 ? 'text-als' : ''}`}>{value}</p>
            {children}
        </Comp>
    );
}

export function OrdersTable({ orders, money }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="border-y border-bone-200 bg-bone/60 text-left"><tr className="eyebrow text-graphite">
                    <th className="px-5 py-2.5 font-medium">N°</th><th className="px-5 py-2.5 font-medium">Client</th><th className="px-5 py-2.5 font-medium">Statut</th><th className="px-5 py-2.5 font-medium">Paiement</th><th className="px-5 py-2.5 text-right font-medium">Total</th>
                </tr></thead>
                <tbody className="divide-y divide-bone-200">
                    {orders.map((o) => (
                        <tr key={o.id} className="hover:bg-bone/50">
                            <td className="px-5 py-3"><Link href={route('admin.orders.show', o.id)} className="font-mono font-semibold hover:underline">{o.number}</Link><span className="block text-xs text-graphite">{new Date(o.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</span></td>
                            <td className="px-5 py-3">{o.customer_name}{o.customer_phone && <span className="block text-xs text-graphite">{o.customer_phone}</span>}</td>
                            <td className="px-5 py-3"><StatusBadge status={o.status} label={statusLabels[o.status]} /></td>
                            <td className="px-5 py-3"><StatusBadge status={o.payment_status} label={{ pending: 'En attente', paid: 'Payée', refunded: 'Remboursée' }[o.payment_status]} /></td>
                            <td className="px-5 py-3 text-right font-semibold">{money(o.total)}</td>
                        </tr>
                    ))}
                    {!orders.length && <tr><td colSpan={5} className="px-5 py-10 text-center text-graphite">Aucune commande pour le moment.</td></tr>}
                </tbody>
            </table>
        </div>
    );
}
