import { Link, usePage } from '@/lib/kit';
import ShopLayout from '@/Layouts/ShopLayout';
import Seo from '@/Components/Seo';
import ProductCard from '@/Components/ProductCard';
import DeviceArt from '@/Components/DeviceArt';
import Icon, { WhatsAppGlyph } from '@/Components/Icon';
import { BatteryMeter, GradeStamp } from '@/Components/Badges';
import { cx, useMoney, waLink } from '@/lib/format';
import { route } from '@/lib/routes';

const checks = ['Écran et tactile', 'Batterie', 'Caméras', 'Réseau et Wi-Fi', 'Haut-parleurs', 'Face ID / empreinte'];

const grades = [
    ['A', 'Comme neuf', 'Aucune trace visible à 30 cm. Le bon choix pour offrir.'],
    ['B', 'Très bon état', 'Micro-rayures légères, invisibles écran allumé.'],
    ['C', 'État correct', 'Traces d\'usage visibles. Le meilleur prix, même garantie.'],
];

export default function Home({ featured, refurbished, categories, brands, reviews }) {
    const { shop } = usePage().props;
    const money = useMoney();
    const hero = refurbished[0] ?? featured[0];

    return (
        <ShopLayout>
            <Seo
                description="ALS Devices : smartphones, tablettes, ordinateurs et objets connectés neufs et reconditionnés à Dakar. Testés, garantis, livrés en 24 h, paiement à la livraison."
                jsonLd={{
                    '@context': 'https://schema.org',
                    '@type': 'Store',
                    name: shop.name,
                    url: shop.url,
                    telephone: shop.phone,
                    email: shop.email,
                    address: shop.address,
                    openingHours: shop.hours,
                }}
            />

            {/* HERO : aplat rouge ALS + fiche de contrôle accrochée comme une étiquette */}
            <section className="overflow-hidden bg-als text-white">
                <div className="container-als grid items-center gap-y-14 pb-20 pt-12 md:pt-16 lg:grid-cols-12 lg:gap-x-10 lg:pb-24">
                    <div className="lg:col-span-7">
                        <h1 className="h-display text-[72px] sm:text-[104px] lg:text-[124px]">
                            Le bon appareil. Contrôlé. Garanti.
                        </h1>
                        <p className="mt-7 max-w-lg text-lg leading-relaxed text-white/90">
                            Smartphones, tablettes et ordinateurs vérifiés par nos techniciens à Dakar. L'état réel, la santé de la batterie et la garantie sont écrits sur chaque fiche.
                        </p>
                        <div className="mt-9 flex flex-wrap gap-3">
                            <Link href={route('catalog.index')} className="btn bg-white px-7 py-4 text-base text-ink hover:bg-ink hover:text-white">Voir la boutique</Link>
                            <Link href={route('catalog.index', { condition: 'refurbished' })} className="btn border-2 border-white px-7 py-4 text-base text-white hover:bg-white hover:text-ink">Voir les reconditionnés</Link>
                        </div>
                    </div>

                    {hero && (
                        <div className="lg:col-span-5">
                            <Link href={route('products.show', hero.slug)} className="group relative mx-auto block max-w-[360px] pt-16">
                                {/* Ficelle */}
                                <span className="absolute left-1/2 top-0 h-[78px] w-px origin-bottom -translate-x-1/2 bg-white/70" aria-hidden />
                                <div className="relative origin-top rotate-[3deg] animate-swing rounded-xl bg-white p-5 text-ink shadow-tag transition-transform duration-300 group-hover:rotate-0">
                                    {/* Œillet */}
                                    <span className="absolute left-1/2 top-3 h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-als ring-[5px] ring-bone-200" aria-hidden />
                                    <div className="mt-6 flex items-start justify-between gap-3 border-b-2 border-ink pb-3">
                                        <div>
                                            <p className="text-[13px] font-semibold text-graphite">Fiche de contrôle ALS</p>
                                            <p className="mt-0.5 font-display text-3xl font-black leading-none tracking-tight">{hero.name}</p>
                                        </div>
                                        <GradeStamp grade={hero.grade || 'N'} />
                                    </div>
                                    <div className="relative my-4 aspect-[5/3] rounded-lg bg-bone">
                                        {hero.image
                                            ? <img src={hero.image} alt={hero.name} className="h-full w-full object-contain p-4 mix-blend-multiply" />
                                            : <div className="h-full p-4"><DeviceArt type={hero.category_icon} color={hero.colors?.[0]?.hex} /></div>}
                                    </div>
                                    <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                                        {checks.map((c) => (
                                            <li key={c} className="flex items-center gap-1.5 text-[13px]"><Icon name="check" className="h-3.5 w-3.5 text-ok" strokeWidth={3} />{c}</li>
                                        ))}
                                    </ul>
                                    <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-dashed border-bone-300 pt-4">
                                        {hero.battery_health ? <BatteryMeter value={hero.battery_health} /> : <span className="text-[13px] font-semibold text-graphite">Neuf, scellé</span>}
                                        <span className="font-display text-3xl font-black leading-none tracking-tight">{money(hero.price)}</span>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            {/* RAYONS */}
            <section className="container-als mt-14">
                <div className="flex items-end justify-between">
                    <h2 className="h-display text-5xl md:text-6xl">Rayons</h2>
                    <Link href={route('catalog.index')} className="text-[15px] font-bold underline decoration-2 underline-offset-4 hover:text-als">Tout voir</Link>
                </div>
                <div className="no-scrollbar -mx-4 mt-6 flex snap-x gap-3 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-5 md:px-0">
                    {categories.map((c) => (
                        <Link key={c.slug} href={route('catalog.category', c.slug)}
                            className="group flex w-40 shrink-0 snap-start flex-col rounded-xl bg-bone p-4 transition-colors hover:bg-bone-200 md:w-auto">
                            <div className="mx-auto h-28 w-28 transition duration-500 group-hover:-translate-y-1 md:h-32 md:w-32">
                                <DeviceArt type={c.icon} color="#26262A" />
                            </div>
                            <span className="mt-4 font-display text-2xl font-black leading-none tracking-tight">{c.name}</span>
                            <span className="mt-1 text-[13px] text-graphite">{c.products_count} référence{c.products_count > 1 ? 's' : ''}</span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* LES PLUS DEMANDÉS */}
            {featured.length > 0 && (
                <section className="container-als mt-20">
                    <div className="flex items-end justify-between gap-4">
                        <h2 className="h-display text-5xl md:text-6xl">Les plus demandés</h2>
                        <Link href={route('catalog.index')} className="hidden text-[15px] font-bold underline decoration-2 underline-offset-4 hover:text-als sm:inline">Toute la boutique</Link>
                    </div>
                    <ProductGrid products={featured} />
                </section>
            )}

            {/* GRADES */}
            <section className="mt-24 bg-bone py-16 md:py-20">
                <div className="container-als grid gap-10 lg:grid-cols-12">
                    <div className="lg:col-span-5">
                        <h2 className="h-display text-5xl md:text-6xl">Le grade décrit l'aspect. Le fonctionnement, lui, est parfait.</h2>
                        <p className="mt-5 max-w-md leading-relaxed text-ink/75">Chaque reconditionné passe 40 contrôles avant d'être mis en vente. La santé de la batterie est mesurée et affichée sur la fiche.</p>
                    </div>
                    <ul className="border-t-2 border-ink lg:col-span-7">
                        {grades.map(([g, t, d]) => (
                            <li key={g} className="border-b border-bone-300">
                                <Link href={route('catalog.index', { condition: 'refurbished', grade: [g] })} className="group grid grid-cols-[auto_1fr_auto] items-center gap-5 py-5 md:gap-8 md:py-6">
                                    <span className="transition-colors group-hover:text-als"><GradeStamp grade={g} size="lg" /></span>
                                    <span>
                                        <span className="block font-display text-3xl font-black leading-none tracking-tight">{t}</span>
                                        <span className="mt-1.5 block text-[15px] text-graphite">{d}</span>
                                    </span>
                                    <Icon name="arrow" className="h-5 w-5 transition group-hover:translate-x-1 group-hover:text-als" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* RECONDITIONNÉS */}
            {refurbished.length > 0 && (
                <section className="container-als mt-20">
                    <div className="flex items-end justify-between gap-4">
                        <div>
                            <h2 className="h-display text-5xl md:text-6xl">Reconditionnés disponibles</h2>
                            <p className="mt-3 text-graphite">Pièces uniques : une fois vendues, elles ne reviennent pas.</p>
                        </div>
                        <Link href={route('catalog.index', { condition: 'refurbished' })} className="hidden text-[15px] font-bold underline decoration-2 underline-offset-4 hover:text-als sm:inline">Tout voir</Link>
                    </div>
                    <ProductGrid products={refurbished} />
                </section>
            )}

            {/* PROMESSES */}
            <section className="container-als mt-24">
                <div className="grid gap-x-8 gap-y-10 border-t-2 border-ink pt-10 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                        ['cash', 'Payez à la réception', 'En espèces, par Wave ou Orange Money, au moment de la livraison.'],
                        ['truck', 'Livré en 24 h', 'Partout à Dakar. Comptez 48 h pour les régions.'],
                        ['shield', 'Garanti et facturé', 'Une facture et une garantie écrite à chaque achat.'],
                        ['chat', 'Un humain répond', 'Conseil avant et après l\'achat, sur WhatsApp.'],
                    ].map(([icon, t, d]) => (
                        <div key={t}>
                            <Icon name={icon} className="h-7 w-7 text-als" />
                            <h3 className="mt-4 font-display text-2xl font-black leading-none tracking-tight">{t}</h3>
                            <p className="mt-2 text-[15px] leading-relaxed text-graphite">{d}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* AVIS (affichés seulement s'il y a de vrais avis saisis dans le back-office) */}
            {reviews.length > 0 && (
                <section className="container-als mt-24">
                    <h2 className="h-display text-5xl md:text-6xl">Ils nous ont fait confiance</h2>
                    <div className="no-scrollbar -mx-4 mt-8 flex snap-x gap-4 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-3 md:px-0">
                        {reviews.map((r, i) => (
                            <figure key={i} className="w-[85%] shrink-0 snap-start border-l-4 border-als bg-bone p-6 md:w-auto">
                                <div className="flex gap-0.5 text-als" aria-label={`${r.rating} sur 5`}>{Array.from({ length: r.rating }).map((_, k) => <Icon key={k} name="star" className="h-4 w-4 fill-current" />)}</div>
                                <blockquote className="mt-4 text-[17px] leading-relaxed">« {r.body} »</blockquote>
                                <figcaption className="mt-5 text-sm font-semibold">{r.author}{r.city && <span className="font-normal text-graphite">, {r.city}</span>}</figcaption>
                            </figure>
                        ))}
                    </div>
                </section>
            )}

            {/* MARQUES */}
            {brands.length > 0 && (
                <section className="container-als mt-20">
                    <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 border-y border-bone-200 py-8">
                        {brands.map((b) => <span key={b} className="font-display text-3xl font-black tracking-tight text-ink/30">{b}</span>)}
                    </div>
                </section>
            )}

            {/* CONSEIL WHATSAPP */}
            <section className="container-als mt-20">
                <div className="grid items-end gap-8 rounded-xl bg-ink p-8 text-white md:grid-cols-[1fr_auto] md:p-14">
                    <div>
                        <h2 className="h-display max-w-2xl text-5xl md:text-7xl">Pas sûr du modèle ? Demandez-nous.</h2>
                        <p className="mt-4 max-w-xl text-white/75">Donnez-nous votre budget et votre usage : on vous propose deux ou trois appareils adaptés, en stock.</p>
                    </div>
                    <a href={waLink(shop.whatsapp, 'Bonjour ALS Devices, je cherche un appareil. Mon budget : ')} target="_blank" rel="noopener" className="btn-wa px-7 py-4 text-base">
                        <WhatsAppGlyph className="h-5 w-5" /> Demander conseil sur WhatsApp
                    </a>
                </div>
            </section>
        </ShopLayout>
    );
}

/**
 * Grille produits. Avec 5 ou 9 articles, le premier passe en grand format
 * pour que la grille tombe juste (pas d'article orphelin en fin de ligne).
 */
function ProductGrid({ products }) {
    const big = products.length === 5 || products.length === 9;
    return (
        <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 md:gap-x-5 lg:grid-cols-4">
            {products.map((p, i) => (
                <ProductCard key={p.id} product={p} priority={i < 2} feature={big && i === 0}
                    className={cx(big && i === 0 && 'col-span-2 lg:row-span-2')} />
            ))}
        </div>
    );
}
