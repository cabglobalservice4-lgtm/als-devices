import { Link, useForm, usePage, useRouter } from '@/lib/kit';
import { useShop } from '@/lib/shop';
import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import ShopLayout from '@/Layouts/ShopLayout';
import Seo from '@/Components/Seo';
import DeviceArt from '@/Components/DeviceArt';
import Icon from '@/Components/Icon';
import { cx, track, useMoney } from '@/lib/format';
import { route } from '@/lib/routes';

export default function Checkout({ lines, subtotal, zones, pickupEnabled, paymentMethods }) {
    const { shop } = usePage().props;
    const { cart } = useShop();
    const router = useRouter();
    const money = useMoney();
    const { data, setData, post, processing, errors } = useForm({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        delivery_method: 'delivery',
        delivery_zone_id: zones[0]?.id ?? '',
        address: '',
        notes: '',
        payment_method: paymentMethods[0]?.value ?? 'cod',
        accept_terms: false,
    });

    useEffect(() => { track('InitiateCheckout', { value: subtotal, currency: shop.currency, num_items: lines.length }); }, []);

    if (!lines.length) return <Navigate to={route('cart.index')} replace />;

    const zone = zones.find((z) => z.id === Number(data.delivery_zone_id));
    const fee = data.delivery_method === 'delivery' ? Number(zone?.fee ?? 0) : 0;
    const total = subtotal + fee;

    const submit = (e) => {
        e.preventDefault();
        post(route('checkout.store'), {
            silent: true,
            transform: (d) => ({ ...d, items: cart.items, source: sessionStorage.getItem('als.source') || null }),
            onSuccess: (res) => {
                track('Purchase', { value: res.total, currency: shop.currency });
                cart.clear();
                if (res.redirect) window.location.href = res.redirect;
                else router.visit(route('orders.show', res.token));
            },
        });
    };

    return (
        <ShopLayout hideWhatsApp>
            <Seo title="Commande" noindex />
            <form onSubmit={submit} className="container-als grid gap-10 py-10 md:py-14 lg:grid-cols-12">
                <div className="lg:col-span-7">
                    <Link href={route('cart.index')} className="text-sm font-semibold text-graphite hover:text-ink">← Retour au panier</Link>
                    <h1 className="h-display mt-3 text-5xl">Commande<span className="text-als">.</span></h1>
                    <p className="mt-2 text-graphite">Pas besoin de compte. Trois infos et c'est réglé.</p>

                    {errors.cart && <p className="mt-6 rounded-xl bg-als-light px-4 py-3 text-sm text-als-dark">{errors.cart}</p>}

                    <Step n="1" title="Vos coordonnées">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Nom complet" error={errors.customer_name} className="sm:col-span-2">
                                <input className="field" autoComplete="name" required value={data.customer_name} onChange={(e) => setData('customer_name', e.target.value)} />
                            </Field>
                            <Field label="Téléphone (WhatsApp de préférence)" error={errors.customer_phone}>
                                <input className="field" type="tel" inputMode="tel" autoComplete="tel" placeholder="77 123 45 67" required value={data.customer_phone} onChange={(e) => setData('customer_phone', e.target.value)} />
                            </Field>
                            <Field label="E-mail (pour la facture)" hint="facultatif" error={errors.customer_email}>
                                <input className="field" type="email" autoComplete="email" value={data.customer_email} onChange={(e) => setData('customer_email', e.target.value)} />
                            </Field>
                        </div>
                    </Step>

                    <Step n="2" title="Réception">
                        {pickupEnabled && (
                            <div className="mb-4 grid grid-cols-2 gap-3">
                                {[['delivery', 'truck', 'Livraison'], ['pickup', 'pin', 'Retrait / remise en main propre']].map(([v, icon, l]) => (
                                    <Choice key={v} checked={data.delivery_method === v} onChange={() => setData('delivery_method', v)} name="delivery_method">
                                        <Icon name={icon} className="h-5 w-5" /><span className="font-semibold">{l}</span>
                                        {v === 'pickup' && <span className="text-sm text-graphite">Gratuit</span>}
                                    </Choice>
                                ))}
                            </div>
                        )}
                        {data.delivery_method === 'delivery' ? (
                            <div className="grid gap-4">
                                <Field label="Zone de livraison" error={errors.delivery_zone_id}>
                                    <select className="field" value={data.delivery_zone_id} onChange={(e) => setData('delivery_zone_id', Number(e.target.value))}>
                                        {zones.map((z) => <option key={z.id} value={z.id}>{z.name} — {money(z.fee)}{z.delay ? ` · ${z.delay}` : ''}</option>)}
                                    </select>
                                </Field>
                                <Field label="Adresse précise" error={errors.address}>
                                    <input className="field" autoComplete="street-address" placeholder="Quartier, rue, repère…" value={data.address} onChange={(e) => setData('address', e.target.value)} />
                                </Field>
                            </div>
                        ) : (
                            <p className="rounded-xl bg-bone px-4 py-3 text-sm">Nous vous appelons pour convenir du lieu et de l'heure. {shop.address} · {shop.hours}</p>
                        )}
                        <Field label="Précision pour le livreur" hint="facultatif" error={errors.notes} className="mt-4">
                            <textarea className="field" rows={2} value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                        </Field>
                    </Step>

                    <Step n="3" title="Paiement">
                        <div className="grid gap-3">
                            {paymentMethods.map((m) => (
                                <Choice key={m.value} checked={data.payment_method === m.value} onChange={() => setData('payment_method', m.value)} name="payment_method" row>
                                    <PayLogo method={m.value} />
                                    <span className="flex-1"><span className="block font-semibold">{m.label}</span><span className="text-sm text-graphite">{m.hint}</span></span>
                                </Choice>
                            ))}
                        </div>
                        {errors.payment_method && <p className="error">{errors.payment_method}</p>}
                    </Step>
                </div>

                <aside className="lg:col-span-5">
                    <div className="sticky top-24 rounded-3xl border border-bone-200 p-6">
                        <p className="eyebrow text-graphite">Votre commande</p>
                        <ul className="mt-4 space-y-4">
                            {lines.map((l) => (
                                <li key={l.variant_id} className="flex gap-3">
                                    <div className="relative h-16 w-16 shrink-0 rounded-xl bg-bone">
                                        {l.image ? <img src={l.image} alt="" className="h-full w-full object-contain p-1.5 mix-blend-multiply" /> : <div className="h-full p-2"><DeviceArt type={l.category_icon} /></div>}
                                        <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-ink font-mono text-[11px] text-white">{l.quantity}</span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-semibold">{l.name}</p>
                                        <p className="text-sm text-graphite">{l.variant_label}</p>
                                    </div>
                                    <p className="font-semibold">{money(l.line_total)}</p>
                                </li>
                            ))}
                        </ul>
                        <dl className="mt-6 space-y-2 border-t border-bone-200 pt-4 text-sm">
                            <div className="flex justify-between"><dt className="text-graphite">Sous-total</dt><dd>{money(subtotal)}</dd></div>
                            <div className="flex justify-between"><dt className="text-graphite">Livraison</dt><dd>{fee ? money(fee) : 'Gratuit'}</dd></div>
                            <div className="flex items-baseline justify-between border-t border-bone-200 pt-3"><dt className="font-semibold">Total</dt><dd className="font-display text-3xl font-extrabold tracking-tight">{money(total)}</dd></div>
                        </dl>
                        <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm">
                            <input type="checkbox" checked={data.accept_terms} onChange={(e) => setData('accept_terms', e.target.checked)} className="mt-0.5 h-5 w-5 rounded border-bone-300 text-als focus:ring-0" />
                            <span>J'accepte les <a href={route('pages.show', 'cgv')} target="_blank" className="underline">conditions générales de vente</a> et la <a href={route('pages.show', 'confidentialite')} target="_blank" className="underline">politique de confidentialité</a>.</span>
                        </label>
                        {errors.accept_terms && <p className="error">{errors.accept_terms}</p>}
                        <button disabled={processing} className="btn-red mt-6 w-full py-4 text-base">
                            {processing ? 'Envoi…' : `Confirmer la commande · ${money(total)}`}
                        </button>
                        <p className="mt-3 text-center text-xs text-graphite">Vous recevez votre numéro de commande immédiatement. Nous vous appelons pour confirmer.</p>
                    </div>
                </aside>
            </form>
        </ShopLayout>
    );
}

function Step({ n, title, children }) {
    return (
        <section className="mt-10">
            <h2 className="mb-5 flex items-center gap-3 font-display text-2xl font-bold tracking-tight">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-ink font-mono text-sm text-white">{n}</span>{title}
            </h2>
            {children}
        </section>
    );
}

function Field({ label, hint, error, className = '', children }) {
    return (
        <label className={cx('block', className)}>
            <span className="label">{label}{hint && <span className="ml-1 font-normal text-graphite">({hint})</span>}</span>
            {children}
            {error && <span className="error block">{error}</span>}
        </label>
    );
}

function Choice({ checked, onChange, name, row = false, children }) {
    return (
        <label className={cx('relative flex cursor-pointer gap-2 rounded-2xl border-2 p-4 transition', row ? 'items-center gap-4' : 'flex-col', checked ? 'border-ink bg-bone' : 'border-bone-200 hover:border-bone-300')}>
            <input type="radio" name={name} checked={checked} onChange={onChange} className="sr-only" />
            {children}
            <span className={cx('absolute right-4 top-4 grid h-5 w-5 place-items-center rounded-full border-2', checked ? 'border-als bg-als' : 'border-bone-300', row && 'static')}>
                {checked && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
            </span>
        </label>
    );
}

function PayLogo({ method }) {
    if (method === 'wave') return <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#1DC8FF] font-display text-sm font-extrabold text-white">W</span>;
    if (method === 'orange_money') return <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#FF7900] font-display text-sm font-extrabold text-white">OM</span>;
    return <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ink text-white"><Icon name="cash" /></span>;
}
