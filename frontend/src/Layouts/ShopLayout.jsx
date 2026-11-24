import { Link, useRouter, usePage } from '@/lib/kit';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Flash from '@/Components/Flash';
import Icon, { WhatsAppGlyph } from '@/Components/Icon';
import Logo from '@/Components/Logo';
import { cx, waLink } from '@/lib/format';
import { route } from '@/lib/routes';

const promises = ['Paiement à la livraison', 'Livraison Dakar en 24 h', 'Wave & Orange Money', 'Reconditionnés testés sur 40 points', 'Garantie jusqu\'à 12 mois', 'Facture à chaque achat'];

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
            <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white">Aller au contenu</a>

            {/* Bandeau promesses */}
            <div className="overflow-hidden bg-als text-white">
                <div className="flex w-max animate-marquee gap-10 py-2 pr-10">
                    {[...promises, ...promises].map((p, i) => (
                        <span key={i} className="eyebrow flex items-center gap-10 whitespace-nowrap">{p}<span className="h-1 w-1 bg-white" /></span>
                    ))}
                </div>
            </div>

            <header className="sticky top-0 z-40 border-b border-white/10 bg-ink text-white">
                <div className="container-als flex h-16 items-center gap-4">
                    <button onClick={() => setOpen(true)} className="-ml-2 grid h-10 w-10 place-items-center rounded-full hover:bg-white/10 lg:hidden" aria-label="Ouvrir le menu">
                        <Icon name="menu" />
                    </button>
                    <Link href={route('home')} aria-label="ALS Devices — accueil"><Logo dark /></Link>

                    <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Catégories">
                        {nav.map((c) => (
                            <Link key={c.slug} href={route('catalog.category', c.slug)} className={cx('rounded-full px-3 py-2 text-sm text-white/75 transition hover:text-white', path.endsWith('/' + c.slug) && 'bg-white/10 text-white')}>
                                {c.name}
                            </Link>
                        ))}
                    </nav>

                    <form onSubmit={submit} className="ml-auto hidden md:block" role="search">
                        <label className="relative block">
                            <span className="sr-only">Rechercher</span>
                            <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="iPhone 13, Galaxy, MacBook…" className="w-56 rounded-full border-0 bg-white/10 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:w-72 focus:bg-white/15 focus:ring-1 focus:ring-white/30 xl:w-64" />
                        </label>
                    </form>

                    <Link href={route('cart.index')} className="relative ml-auto grid h-10 w-10 place-items-center rounded-full hover:bg-white/10 md:ml-0" aria-label={`Panier, ${cartCount} article(s)`}>
                        <Icon name="bag" />
                        {cartCount > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-als px-1 font-mono text-[11px] font-bold">{cartCount}</span>}
                    </Link>
                </div>

                <form onSubmit={submit} className="container-als pb-3 md:hidden" role="search">
                    <label className="relative block">
                        <span className="sr-only">Rechercher</span>
                        <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un appareil…" className="w-full rounded-full border-0 bg-white/10 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:ring-1 focus:ring-white/30" />
                    </label>
                </form>
            </header>

            {/* Menu mobile */}
            <div className={cx('fixed inset-0 z-50 lg:hidden', open ? 'visible' : 'invisible')} aria-hidden={!open}>
                <div onClick={() => setOpen(false)} className={cx('absolute inset-0 bg-ink/60 transition', open ? 'opacity-100' : 'opacity-0')} />
                <div className={cx('absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-ink text-white transition-transform', open ? 'translate-x-0' : '-translate-x-full')}>
                    <div className="flex h-16 items-center justify-between px-5">
                        <Logo dark />
                        <button onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/10" aria-label="Fermer le menu"><Icon name="close" /></button>
                    </div>
                    <nav className="flex-1 overflow-y-auto px-3 py-4">
                        <Link href={route('catalog.index')} className="flex items-center justify-between rounded-xl px-3 py-3.5 font-display text-2xl font-bold">Toute la boutique <Icon name="arrow" className="h-5 w-5 text-als" /></Link>
                        {nav.map((c) => (
                            <Link key={c.slug} href={route('catalog.category', c.slug)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-lg text-white/85 hover:bg-white/5">
                                <Icon name={c.icon} className="h-5 w-5 text-white/50" /> {c.name}
                            </Link>
                        ))}
                        <div className="my-4 h-px bg-white/10" />
                        <Link href={route('catalog.index', { condition: 'refurbished' })} className="block rounded-xl px-3 py-3 text-white/85">Reconditionnés</Link>
                        <Link href={route('pages.show', 'retours-et-garantie')} className="block rounded-xl px-3 py-3 text-white/85">Garantie & retours</Link>
                        <Link href={route('contact')} className="block rounded-xl px-3 py-3 text-white/85">Contact</Link>
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
    return (
        <footer className="mt-24 bg-ink text-white">
            <div className="container-als grid gap-12 py-16 md:grid-cols-12">
                <div className="md:col-span-5">
                    <Logo dark />
                    <p className="mt-5 max-w-sm font-display text-3xl font-bold leading-tight tracking-tight">
                        On vous vend, on vous aide,<br /><span className="text-als">on vous conseille.</span>
                    </p>
                    <div className="mt-6 flex gap-2">
                        {shop.social?.facebook && <a href={shop.social.facebook} target="_blank" rel="noopener" aria-label="Facebook" className="grid h-10 w-10 place-items-center rounded-full border border-white/15 hover:border-white"><Icon name="facebook" className="h-4 w-4" /></a>}
                        {shop.social?.tiktok && <a href={shop.social.tiktok} target="_blank" rel="noopener" aria-label="TikTok" className="grid h-10 w-10 place-items-center rounded-full border border-white/15 hover:border-white"><Icon name="tiktok" className="h-4 w-4" /></a>}
                        {shop.social?.instagram && <a href={shop.social.instagram} target="_blank" rel="noopener" aria-label="Instagram" className="grid h-10 w-10 place-items-center rounded-full border border-white/15 hover:border-white"><Icon name="instagram" className="h-4 w-4" /></a>}
                    </div>
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
                        <li><Link href={route('pages.show', 'retours-et-garantie')} className="hover:text-white">Retours & garantie</Link></li>
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
                <div className="container-als flex flex-col justify-between gap-2 py-5 font-mono text-[11px] uppercase tracking-wider text-white/40 sm:flex-row">
                    <span>© {new Date().getFullYear()} ALS Devices</span>
                    <span>Paiement à la livraison · Wave · Orange Money</span>
                </div>
            </div>
        </footer>
    );
}
