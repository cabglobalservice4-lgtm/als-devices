import { useRouter } from '@/lib/kit';
import { download } from '@/lib/api';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import Pagination from '@/Components/Pagination';
import Icon from '@/Components/Icon';
import { OrdersTable } from '@/Pages/Admin/Dashboard';
import { cx, useMoney } from '@/lib/format';
import { route } from '@/lib/routes';

export default function OrdersIndex({ orders, filters, statuses }) {
    const router = useRouter();
    const money = useMoney();
    const [q, setQ] = useState(filters.q ?? '');
    const go = (p) => router.get(route('admin.orders.index'), { ...filters, ...p }, { preserveState: true, replace: true });

    return (
        <AdminLayout title="Commandes" actions={<button onClick={() => download(route('admin.orders.export'), 'ventes.csv')} className="btn-ghost py-2"><Icon name="download" className="h-4 w-4" /> Export CSV</button>}>
            <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => go({ status: '' })} className={cx('chip', !filters.status && 'chip-on')}>Toutes</button>
                {Object.entries(statuses).map(([k, l]) => <button key={k} onClick={() => go({ status: k })} className={cx('chip', filters.status === k && 'chip-on')}>{l}</button>)}
                <form onSubmit={(e) => { e.preventDefault(); go({ q }); }} className="ml-auto w-full sm:w-72">
                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="N°, nom ou téléphone" className="field py-2 text-sm" />
                </form>
            </div>
            <div className="card-admin mt-4 overflow-hidden">
                <OrdersTable orders={orders.data} money={money} />
            </div>
            <Pagination links={orders.links} />
        </AdminLayout>
    );
}
