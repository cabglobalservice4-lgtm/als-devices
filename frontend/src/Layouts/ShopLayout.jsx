import { Link, useRouter, usePage } from '@/lib/kit';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Flash from '@/Components/Flash';
import Icon, { WhatsAppGlyph } from '@/Components/Icon';
import Logo from '@/Components/Logo';
import { cx, waLink } from '@/lib/format';
import { route } from '@/lib/routes';

const promises = ['Paiement à la livraison', 'Livré en 24 h à Dakar', 'Wave et Orange Money acceptés', 'Garantie jusqu\'à 12 mois'];

export default function ShopLayout({ children, hideWhatsApp = false }) {
    const { nav, cartCount, shop } = usePage().props;
    const router = useRouter();
    const { pathname: path } = useLocation();
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState('');

    useEffect(() => setOpen(false), [path]);

    const submit = (e) => {
        e.preventDefault();
        router.get(route('catalog.index'), q ? { q } : {});
    };

    return (
        <div className="flex min-h-screen flex-col bg-white">
            <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-white">Aller au contenu</a>

            {/* Bandeau promesses (fixe, sans défilement) */}
            <div className="bg-ink text-white">
                <ul className="container-als flex h-9 items-center justify-center gap-8 text-[13px] font-medium sm:justify-between">
                    {promises.map((p, i) => (
                        <li key={p} className={cx('items-center gap-2 whitespace-nowrap', i === 0 ? 'flex' : i < 3 ? 'hidden sm:flex' : 'hidden lg:flex')}>
                            <span className="h-1.5 w-1.5 rounded-full bg-als" />{p}
                        </li>
                    ))}
                </ul>
            </div>

            <header className="sticky top-0 z-40 border-b border-bone-200 bg-white/95 backdrop-blur">
                <div className="container-als flex h-16 items-center gap-4">
                    <button onClick={() => setOpen(true)} className="-ml-2 grid h-10 w-10 place-items-center rounded-lg hover:bg-bone lg:hidden" aria-label="Ouvrir le menu">
                        <Icon name="menu" />
                    </button>
                    <Link href={route('home')} aria-label="ALS Devices, accueil"><Logo /></Link>

                    <nav className="ml-6 hidden h-full items-stretch gap-1 lg:flex" aria-label="Catégories">
                        {nav.map((c) => {
                            const on = path.endsWith('/' + c.slug);
                            return (
                                <Link key={c.slug} href={route('catalog.category', c.slug)} aria-current={on ? 'page' : undefined}
                                    className={cx('flex items-center border-b-[3px] px-3 pt-[3px] text-[15px] font-semibold transition', on ? 'border-als text-ink' : 'border-transparent text-ink/70 hover:text-ink')}>
                                    {c.name}
                                </Link>
                            );
                        })}
                    </nav>

                    <form onSubmit={submit} className="ml-auto hidden md:block" role="search">
                        <label className="relative block">
                            <span className="sr-only">Rechercher</span>
                            <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite" />
                            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="iPhone 13, Galaxy, MacBook…" className="w-56 rounded-lg border-0 bg-bone py-2.5 pl-10 pr-4 text-sm placeholder:text-graphite/70 focus:bg-white focus:ring-2 focus:ring-ink xl:w-72" />
                        </label>
                    </form>

                    <Link href={route('cart.index')} className="relative ml-auto grid h-10 w-10 place-items-center rounded-lg hover:bg-bone md:ml-0" aria-label={`Panier, ${cartCount} article(s)`}>
                        <Icon name="bag" />
                        {cartCount > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-als px-1 text-[11px] font-bold text-white">{cartCount}</span>}
                    </Link>
                </div>

                <form onSubmit={submit} className="container-als pb-3 md:hidden" role="search">
                    <label className="relative block">
                        <span className="sr-only">Rechercher</span>
                        <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite" />
                        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un appareil…" className="w-full rounded-lg border-0 bg-bone py-2.5 pl-10 pr-4 text-sm placeholder:text-graphite/70 focus:bg-white focus:ring-2 focus:ring-ink" />
                    </label>
                </form>
            </header>

            {/* Menu mobile */}
            <div className={cx('fixed inset-0 z-50 lg:hidden', open ? 'visible' : 'invisible')} aria-hidden={!open}>
                <div onClick={() => setOpen(false)} className={cx('absolute inset-0 bg-ink/60 transition', open ? 'opacity-100' : 'opacity-0')} />
                <div className={cx('absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-white transition-transform', open ? 'translate-x-0' : '-translate-x-full')}>
                    <div className="flex h-16 items-center justify-between border-b border-bone-200 px-5">
                        <Logo />
                        <button onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-lg hover:bg-bone" aria-label="Fermer le menu"><Icon name="close" /></button>
                    </div>
                    <nav className="flex-1 overflow-y-auto px-3 py-4">
                        <Link href={route('catalog.index')} className="flex items-center justify-between rounded-lg px-3 py-3 font-display text-3xl font-black tracking-tight">Toute la boutique <Icon name="arrow" className="h-5 w-5 text-als" /></Link>
                        {nav.map((c) => (
                            <Link key={c.slug} href={route('catalog.category', c.slug)} className="flex items-center gap-3 rounded-lg px-3 py-3 text-lg font-semibold hover:bg-bone">
                                <Icon name={c.icon} className="h-5 w-5 text-graphite" /> {c.name}
                            </Link>
                        ))}
                        <div className="my-4 h-px bg-bone-200" />
                        <Link href={route('catalog.index', { condition: 'refurbished' })} className="block rounded-lg px-3 py-3 text-ink/80 hover:bg-bone">Reconditionnés</Link>
                        <Link href={route('pages.show', 'retours-et-garantie')} className="block rounded-lg px-3 py-3 text-ink/80 hover:bg-bone">Garantie et retours</Link>
                        <Link href={route('contact')} className="block rounded-lg px-3 py-3 text-ink/80 hover:bg-bone">Contact</Link>
                    </nav>
                    <a href={waLink(shop.whatsapp, 'Bonjour ALS Devices, j\'ai une question.')} target="_blank" rel="noopener" className="btn-wa m-5">
                        <WhatsAppGlyph /> Écrire sur WhatsApp
                    </a>
                </div>
            </div>

            <main id="contenu" className="flex-1">{children}</main>

            <Footer shop={shop} nav={nav} />

            {!hideWhatsApp && (
                <a href={waLink(shop.whatsapp, 'Bonjour ALS Devices, j\'ai une question.')} target="_blank" rel="noopener" aria-label="Nous écrire sur WhatsApp"
                    className="fixed bottom-5 right-5 z-30 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-ink shadow-tag transition hover:scale-105">
                    <WhatsAppGlyph className="h-7 w-7" />
                </a>
            )}
            <Flash />
        </div>
    );
}

function Footer({ shop, nav }) {
    const social = [['facebook', 'Facebook'], ['tiktok', 'TikTok'], ['instagram', 'Instagram']].filter(([k]) => shop.social?.[k]);
    return (
        <footer className="mt-24 bg-ink text-white">
            <div className="container-als grid gap-12 py-16 md:grid-cols-12">
                <div className="md:col-span-5">
                    <Logo dark />
                    <p className="h-display mt-6 max-w-sm text-5xl">On vous vend, on vous aide, on vous conseille.</p>
                    {social.length > 0 && (
                        <div className="mt-6 flex gap-2">
                            {social.map(([k, label]) => (
                                <a key={k} href={shop.social[k]} target="_blank" rel="noopener" aria-label={label} className="grid h-10 w-10 place-items-center rounded-lg border border-white/20 hover:border-white"><Icon name={k} className="h-4 w-4" /></a>
                            ))}
                        </div>
                    )}
                </div>
                <div className="md:col-span-2">
                    <p className="eyebrow text-white/50">Boutique</p>
                    <ul className="mt-4 space-y-2.5 text-sm text-white/80">
                        {nav.map((c) => <li key={c.slug}><Link href={route('catalog.category', c.slug)} className="hover:text-white">{c.name}</Link></li>)}
                    </ul>
                </div>
                <div className="md:col-span-2">
                    <p className="eyebrow text-white/50">Infos</p>
                    <ul className="mt-4 space-y-2.5 text-sm text-white/80">
                        <li><Link href={route('pages.show', 'a-propos')} className="hover:text-white">À propos</Link></li>
                        <li><Link href={route('pages.show', 'retours-et-garantie')} className="hover:text-white">Retours et garantie</Link></li>
                        <li><Link href={route('pages.show', 'cgv')} className="hover:text-white">CGV</Link></li>
                        <li><Link href={route('pages.show', 'mentions-legales')} className="hover:text-white">Mentions légales</Link></li>
                        <li><Link href={route('pages.show', 'confidentialite')} className="hover:text-white">Confidentialité</Link></li>
                    </ul>
                </div>
                <div className="md:col-span-3">
                    <p className="eyebrow text-white/50">Contact</p>
                    <ul className="mt-4 space-y-3 text-sm text-white/80">
                        <li className="flex gap-2.5"><Icon name="pin" className="h-4 w-4 shrink-0 text-als" />{shop.address}</li>
                        <li className="flex gap-2.5"><Icon name="clock" className="h-4 w-4 shrink-0 text-als" />{shop.hours}</li>
                        <li className="flex gap-2.5"><Icon name="phone" className="h-4 w-4 shrink-0 text-als" /><a href={`tel:${shop.phone}`} className="hover:text-white">{shop.phone}</a></li>
                        <li className="flex gap-2.5"><Icon name="mail" className="h-4 w-4 shrink-0 text-als" /><a href={`mailto:${shop.email}`} className="hover:text-white">{shop.email}</a></li>
                    </ul>
                </div>
            </div>
            <div className="border-t border-white/10">
                <div className="container-als flex flex-col justify-between gap-2 py-5 text-[13px] text-white/50 sm:flex-row">
                    <span>© {new Date().getFullYear()} ALS Devices</span>
                    <span>Paiement à la livraison, en espèces, Wave ou Orange Money</span>
                </div>
            </div>
        </footer>
    );
}
