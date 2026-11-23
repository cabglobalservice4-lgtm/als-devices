import { Link, usePage } from '@/lib/kit';
import ShopLayout from '@/Layouts/ShopLayout';
import Seo from '@/Components/Seo';
import ProductCard from '@/Components/ProductCard';
import DeviceArt from '@/Components/DeviceArt';
import Icon, { WhatsAppGlyph } from '@/Components/Icon';
import { BatteryMeter, GradeStamp } from '@/Components/Badges';
import { useMoney, waLink } from '@/lib/format';
import { route } from '@/lib/routes';

const checks = ['Écran & tactile', 'Batterie', 'Caméras', 'Réseau & Wi-Fi', 'Haut-parleurs', 'Face ID / empreinte'];

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

            {/* HERO */}
            <section className="relative overflow-hidden bg-ink text-white">
                <div className="tick-grid absolute inset-0" />
                <div className="absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-als/25 blur-[120px]" />
                <div className="container-als relative grid items-center gap-12 pb-16 pt-12 md:pb-24 md:pt-20 lg:grid-cols-12">
                    <div className="lg:col-span-7">
                        <p className="eyebrow flex items-center gap-2 text-white/60"><span className="h-2 w-2 bg-als" /> Neuf & reconditionné · Dakar</p>
                        <h1 className="h-display mt-6 text-[52px] sm:text-7xl lg:text-[88px]">
                            Le bon appareil.<br />
                            <span className="text-white/40">Contrôlé.</span> Garanti<span className="text-als">.</span>
                        </h1>
                        <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
                            Smartphones, tablettes et ordinateurs vérifiés par nos techniciens. État réel, santé de la batterie et garantie affichés sur chaque fiche — sans mauvaise surprise.
                        </p>
                        <div className="mt-9 flex flex-wrap gap-3">
                            <Link href={route('catalog.index')} className="btn-red px-7 py-4 text-base">Voir la boutique <Icon name="arrow" className="h-4 w-4" /></Link>
                            <Link href={route('catalog.index', { condition: 'refurbished' })} className="btn border border-white/20 px-7 py-4 text-base text-white hover:border-white">Reconditionnés</Link>
                        </div>
                        <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-6">
                            {[['40', 'points de contrôle'], ['12', 'mois de garantie max.'], ['24 h', 'livraison à Dakar']].map(([n, l]) => (
                                <div key={l}>
                                    <dt className="font-display text-3xl font-extrabold tracking-tight">{n}</dt>
                                    <dd className="mt-1 text-xs leading-snug text-white/50">{l}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>

                    {hero && (
                        <div className="lg:col-span-5">
                            <Link href={route('products.show', hero.slug)} className="group relative mx-auto block max-w-sm">
                                <div className="absolute -inset-4 rotate-[-4deg] rounded-[28px] border border-white/10" />
                                <div className="relative rounded-[24px] bg-white p-5 text-ink shadow-tag">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="eyebrow text-graphite">Fiche de contrôle</p>
                                            <p className="mt-1 font-display text-xl font-bold tracking-tight">{hero.name}</p>
                                        </div>
                                        <GradeStamp grade={hero.grade || 'N'} />
                                    </div>
                                    <div className="relative my-4 aspect-[5/4] rounded-2xl bg-bone">
                                        {hero.image ? <img src={hero.image} alt={hero.name} className="h-full w-full object-contain p-6 mix-blend-multiply" /> : <div className="h-full p-6 transition duration-500 group-hover:scale-105"><DeviceArt type={hero.category_icon} color={hero.colors?.[0]?.hex} /></div>}
                                    </div>
                                    <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                                        {checks.map((c) => (
                                            <li key={c} className="flex items-center gap-1.5 text-[13px]"><Icon name="check" className="h-3.5 w-3.5 text-ok" strokeWidth={3} />{c}</li>
                                        ))}
                                    </ul>
                                    <div className="mt-4 flex items-end justify-between border-t border-dashed border-bone-300 pt-4">
                                        {hero.battery_health ? <BatteryMeter value={hero.battery_health} /> : <span className="eyebrow text-graphite">Neuf scellé</span>}
                                        <span className="font-display text-2xl font-extrabold tracking-tight">{money(hero.price)}</span>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            {/* CATÉGORIES */}
            <section className="container-als mt-16">
                <div className="flex items-end justify-between">
                    <h2 className="h-display text-4xl md:text-5xl">Rayons</h2>
                    <Link href={route('catalog.index')} className="text-sm font-semibold underline-offset-4 hover:underline">Tout voir</Link>
                </div>
                <div className="no-scrollbar -mx-4 mt-6 flex snap-x gap-3 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-5 md:px-0">
                    {categories.map((c, i) => (
                        <Link key={c.slug} href={route('catalog.category', c.slug)}
                            className={`group relative flex aspect-[3/4] w-40 shrink-0 snap-start flex-col justify-between overflow-hidden rounded-2xl p-4 transition hover:-translate-y-1 md:w-auto ${i === 0 ? 'bg-als text-white' : 'bg-bone'}`}>
                            <span className="eyebrow opacity-70">{String(i + 1).padStart(2, '0')} · {c.products_count} réf.</span>
                            <div className="mx-auto h-28 w-28 transition duration-500 group-hover:scale-110 md:h-32 md:w-32">
                                <DeviceArt type={c.icon} color={i === 0 ? '#0B0B0C' : '#2A2A2F'} />
                            </div>
                            <span className="flex items-center justify-between font-display text-lg font-bold leading-tight tracking-tight">
                                {c.name}<Icon name="arrow" className="h-4 w-4 shrink-0 transition group-hover:translate-x-1" />
                            </span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* SÉLECTION */}
            {featured.length > 0 && (
                <section className="container-als mt-20">
                    <div className="flex items-end justify-between gap-4">
                        <div>
                            <p className="eyebrow text-als">Sélection du moment</p>
                            <h2 className="h-display mt-2 text-4xl md:text-5xl">Les plus demandés</h2>
                        </div>
                        <Link href={route('catalog.index')} className="btn-ghost hidden sm:inline-flex">Toute la boutique <Icon name="arrow" className="h-4 w-4" /></Link>
                    </div>
                    <div className="mt-8 grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
                        {featured.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 2} />)}
                    </div>
                </section>
            )}

            {/* GRADES */}
            <section className="mt-24 bg-bone py-20">
                <div className="container-als grid gap-12 lg:grid-cols-12">
                    <div className="lg:col-span-4">
                        <p className="eyebrow text-als">Reconditionné, expliqué</p>
                        <h2 className="h-display mt-3 text-4xl md:text-5xl">Un grade, c'est l'esthétique. Le fonctionnement, lui, est parfait.</h2>
                        <p className="mt-5 leading-relaxed text-graphite">Chaque appareil passe 40 contrôles avant la mise en vente. Le grade décrit seulement l'aspect extérieur ; la santé de la batterie est mesurée et affichée.</p>
                        <Link href={route('catalog.index', { condition: 'refurbished' })} className="btn-ink mt-8">Voir les reconditionnés <Icon name="arrow" className="h-4 w-4" /></Link>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3 lg:col-span-8">
                        {[
                            ['A', 'Comme neuf', 'Aucune trace visible à 30 cm. Le choix pour offrir.', 'bg-white'],
                            ['B', 'Très bon état', 'Micro-rayures légères, invisibles écran allumé.', 'bg-white'],
                            ['C', 'État correct', 'Traces d\'usage visibles. Le meilleur prix, même garantie.', 'bg-white'],
                        ].map(([g, t, d]) => (
                            <div key={g} className="flex flex-col rounded-2xl border border-bone-300 bg-white p-6">
                                <GradeStamp grade={g} size="lg" />
                                <h3 className="mt-6 font-display text-2xl font-bold tracking-tight">{t}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-graphite">{d}</p>
                                <Link href={route('catalog.index', { condition: 'refurbished', grade: [g] })} className="mt-auto pt-6 text-sm font-semibold text-als">Grade {g} →</Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* RECONDITIONNÉS */}
            {refurbished.length > 0 && (
                <section className="container-als mt-20">
                    <p className="eyebrow text-als">Pièces uniques</p>
                    <h2 className="h-display mt-2 text-4xl md:text-5xl">Reconditionnés disponibles</h2>
                    <div className="mt-8 grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
                        {refurbished.map((p) => <ProductCard key={p.id} product={p} />)}
                    </div>
                </section>
            )}

            {/* PROMESSES */}
            <section className="container-als mt-24">
                <div className="grid overflow-hidden rounded-3xl border border-bone-200 md:grid-cols-4">
                    {[
                        ['cash', 'Payez à la réception', 'Espèces, Wave ou Orange Money à la livraison.'],
                        ['truck', 'Livré en 24 h', 'Partout à Dakar, 48 h vers les régions.'],
                        ['shield', 'Garanti & facturé', 'Facture et garantie écrite à chaque achat.'],
                        ['chat', 'Un humain répond', 'Conseil avant et après l\'achat sur WhatsApp.'],
                    ].map(([icon, t, d], i) => (
                        <div key={t} className={`p-7 ${i > 0 ? 'border-t border-bone-200 md:border-l md:border-t-0' : ''}`}>
                            <span className="grid h-11 w-11 place-items-center rounded-xl bg-ink text-white"><Icon name={icon} /></span>
                            <h3 className="mt-5 font-display text-xl font-bold tracking-tight">{t}</h3>
                            <p className="mt-1.5 text-sm leading-relaxed text-graphite">{d}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* AVIS (affichés seulement s'il y a de vrais avis saisis dans le back-office) */}
            {reviews.length > 0 && (
                <section className="container-als mt-24">
                    <h2 className="h-display text-4xl md:text-5xl">Ils nous ont fait confiance</h2>
                    <div className="no-scrollbar -mx-4 mt-8 flex snap-x gap-4 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-3 md:px-0">
                        {reviews.map((r, i) => (
                            <figure key={i} className="w-[85%] shrink-0 snap-start rounded-2xl bg-bone p-6 md:w-auto">
                                <div className="flex gap-0.5 text-als">{Array.from({ length: r.rating }).map((_, k) => <Icon key={k} name="star" className="h-4 w-4 fill-current" />)}</div>
                                <blockquote className="mt-4 leading-relaxed">« {r.body} »</blockquote>
                                <figcaption className="eyebrow mt-5 text-graphite">{r.author}{r.city ? ` · ${r.city}` : ''}</figcaption>
                            </figure>
                        ))}
                    </div>
                </section>
            )}

            {/* MARQUES */}
            {brands.length > 0 && (
                <section className="container-als mt-20">
                    <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 border-y border-bone-200 py-8">
                        {brands.map((b) => <span key={b} className="font-display text-xl font-bold tracking-tight text-ink/35">{b}</span>)}
                    </div>
                </section>
            )}

            {/* CTA WHATSAPP */}
            <section className="container-als mt-20">
                <div className="relative overflow-hidden rounded-3xl bg-als p-8 text-white md:p-14">
                    <div className="absolute -bottom-24 -right-10 h-72 w-72 rotate-12 opacity-20"><DeviceArt type="phone" color="#000" /></div>
                    <h2 className="h-display relative max-w-2xl text-4xl md:text-6xl">Pas sûr du modèle ? Demandez-nous.</h2>
                    <p className="relative mt-4 max-w-xl text-white/85">Dites-nous votre budget et votre usage : on vous propose 2 ou 3 appareils adaptés, en stock.</p>
                    <a href={waLink(shop.whatsapp, 'Bonjour ALS Devices, je cherche un appareil. Mon budget : ')} target="_blank" rel="noopener" className="btn relative mt-8 bg-white px-7 py-4 text-base text-ink hover:bg-bone">
                        <WhatsAppGlyph className="h-5 w-5 text-[#25D366]" /> Conseil gratuit sur WhatsApp
                    </a>
                </div>
            </section>
        </ShopLayout>
    );
}
