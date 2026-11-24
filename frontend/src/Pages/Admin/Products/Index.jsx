import { Link, useRouter } from '@/lib/kit';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import Pagination from '@/Components/Pagination';
import DeviceArt from '@/Components/DeviceArt';
import Icon from '@/Components/Icon';
import { cx, useMoney } from '@/lib/format';
import { route } from '@/lib/routes';

export default function ProductsIndex({ products, categories, filters }) {
    const router = useRouter();
    const money = useMoney();
    const [q, setQ] = useState(filters.q ?? '');
    const go = (p) => router.get(route('admin.products.index'), { ...filters, ...p }, { preserveState: true, replace: true });

    return (
        <AdminLayout title="Produits & stock" actions={<>
            <Link href={route('admin.import.create')} className="btn-ghost hidden py-2 sm:inline-flex"><Icon name="upload" className="h-4 w-4" /> Importer</Link>
            <Link href={route('admin.products.create')} className="btn-red py-2"><Icon name="plus" className="h-4 w-4" /> Produit</Link>
        </>}>
            <div className="flex flex-wrap items-center gap-2">
                <select value={filters.category ?? ''} onChange={(e) => go({ category: e.target.value })} className="rounded-full border-bone-300 py-2 text-sm focus:border-ink focus:ring-0">
                    <option value="">Toutes catégories</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button onClick={() => go({ stock: filters.stock === 'low' ? '' : 'low' })} className={cx('chip', filters.stock === 'low' && 'chip-on')}>Stock bas</button>
                <form onSubmit={(e) => { e.preventDefault(); go({ q }); }} className="ml-auto w-full sm:w-72">
                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un produit" className="field py-2 text-sm" />
                </form>
            </div>

            <div className="card-admin mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="border-b border-bone-200 bg-bone/60 text-left"><tr className="eyebrow text-graphite">
                        <th className="px-5 py-2.5 font-medium">Produit</th><th className="px-5 py-2.5 font-medium">État</th><th className="px-5 py-2.5 text-right font-medium">Prix dès</th><th className="px-5 py-2.5 text-right font-medium">Stock</th><th className="px-5 py-2.5 font-medium">En ligne</th>
                    </tr></thead>
                    <tbody className="divide-y divide-bone-200">
                        {products.data.map((p) => (
                            <tr key={p.id} className="hover:bg-bone/50">
                                <td className="px-5 py-3">
                                    <Link href={route('admin.products.edit', p.id)} className="flex items-center gap-3">
                                        <span className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-bone">{p.image ? <img src={p.image} alt="" className="h-full w-full object-contain p-1 mix-blend-multiply" /> : <span className="block h-full p-1.5"><DeviceArt /></span>}</span>
                                        <span><span className="block font-medium hover:underline">{p.name}</span><span className="text-xs text-graphite">{[p.brand, p.category, `${p.variants} variante(s)`].filter(Boolean).join(' · ')}</span></span>
                                    </Link>
                                </td>
                                <td className="px-5 py-3 text-graphite">{p.condition}</td>
                                <td className="px-5 py-3 text-right font-medium">{money(p.price)}</td>
                                <td className={cx('px-5 py-3 text-right font-mono font-bold', p.stock === 0 ? 'text-als' : p.stock <= 2 ? 'text-amber-600' : '')}>{p.stock}</td>
                                <td className="px-5 py-3">{p.is_active ? <span className="text-ok">● Oui</span> : <span className="text-graphite">○ Masqué</span>}</td>
                            </tr>
                        ))}
                        {!products.data.length && <tr><td colSpan={5} className="px-5 py-12 text-center text-graphite">Aucun produit. <Link href={route('admin.import.create')} className="font-semibold text-als">Importer un tableur</Link></td></tr>}
                    </tbody>
                </table>
            </div>
            <Pagination links={products.links} />
        </AdminLayout>
    );
}
