import { Navigate, useLocation } from 'react-router-dom';
import { Link } from '@/lib/kit';
import { useAuth } from '@/lib/auth';
import { useState } from 'react';
import Flash from '@/Components/Flash';
import Icon from '@/Components/Icon';
import Logo from '@/Components/Logo';
import Seo from '@/Components/Seo';
import { cx } from '@/lib/format';
import { route } from '@/lib/routes';

const links = [
    ['admin.dashboard', 'grid', 'Tableau de bord', 'admin'],
    ['admin.orders.index', 'receipt', 'Commandes', 'admin/commandes'],
    ['admin.products.index', 'box', 'Produits & stock', 'admin/produits'],
    ['admin.settings', 'settings', 'Réglages', 'admin/reglages'],
];

export default function AdminLayout({ title, actions, children }) {
    const auth = useAuth();
    const location = useLocation();
    const [open, setOpen] = useState(false);
    const path = location.pathname.replace(/^\//, '').replace(/\/$/, '');

    if (!auth.isLoggedIn) return <Navigate to={route('login')} replace state={{ from: location.pathname }} />;
    const isActive = (prefix) => (prefix === 'admin' ? path === 'admin' : path.startsWith(prefix));

    const nav = (
        <nav className="flex flex-1 flex-col gap-1 p-3">
            {links.map(([r, icon, label, prefix]) => (
                <Link key={r} href={route(r)} className={cx('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium', isActive(prefix) ? 'bg-white text-ink' : 'text-white/70 hover:bg-white/5 hover:text-white')}>
                    <Icon name={icon} className="h-[18px] w-[18px]" />{label}
                </Link>
            ))}
            <a href="/" target="_blank" className="mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/50 hover:text-white"><Icon name="external" className="h-[18px] w-[18px]" />Voir le site</a>
            <div className="mt-auto rounded-xl bg-white/5 p-3 text-sm">
                <p className="font-medium text-white">{auth.user?.name}</p>
                <p className="text-xs text-white/50">{auth.user?.role === 'owner' ? 'Propriétaire' : 'Employé'}</p>
                <button onClick={auth.signOut} className="mt-2 flex items-center gap-2 text-xs text-white/60 hover:text-white"><Icon name="logout" className="h-4 w-4" />Déconnexion</button>
            </div>
        </nav>
    );

    return (
        <div className="min-h-screen bg-bone">
            <Seo title={title ? `${title} · Admin` : 'Admin'} noindex />
            <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col bg-ink lg:flex">
                <div className="flex h-16 items-center px-5"><Logo dark /></div>
                {nav}
            </aside>
            <div className={cx('fixed inset-0 z-50 lg:hidden', open ? 'visible' : 'invisible')}>
                <div onClick={() => setOpen(false)} className="absolute inset-0 bg-ink/50" />
                <aside className={cx('absolute inset-y-0 left-0 flex w-64 flex-col bg-ink transition-transform', open ? 'translate-x-0' : '-translate-x-full')}>
                    <div className="flex h-16 items-center px-5"><Logo dark /></div>
                    {nav}
                </aside>
            </div>
            <div className="lg:pl-60">
                <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-bone-200 bg-white/90 px-4 backdrop-blur md:px-8">
                    <button onClick={() => setOpen(true)} className="-ml-1 grid h-10 w-10 place-items-center rounded-full hover:bg-bone lg:hidden" aria-label="Menu"><Icon name="menu" /></button>
                    <h1 className="font-display text-xl font-bold tracking-tight">{title}</h1>
                    <div className="ml-auto flex items-center gap-2">{actions}</div>
                </header>
                <main className="p-4 md:p-8">{children}</main>
            </div>
            <Flash />
        </div>
    );
}

export function StatusBadge({ status, label }) {
    const tone = { new: 'bg-als text-white', confirmed: 'bg-amber-100 text-amber-800', shipped: 'bg-sky-100 text-sky-800', delivered: 'bg-emerald-100 text-emerald-800', cancelled: 'bg-bone-200 text-graphite', paid: 'bg-emerald-100 text-emerald-800', pending: 'bg-amber-100 text-amber-800', refunded: 'bg-bone-200 text-graphite' }[status] ?? 'bg-bone-200';
    return <span className={cx('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', tone)}>{label ?? status}</span>;
}
