import { Link, useRouter, useForm } from '@/lib/kit';
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import Icon from '@/Components/Icon';
import { cx, useMoney } from '@/lib/format';
import { route } from '@/lib/routes';

const icons = ['phone', 'tablet', 'laptop', 'watch', 'accessory'];

const schemas = {
    categories: {
        label: 'Catégories',
        title: (i) => i.name, sub: (i) => `${i.products_count} produit(s) · /${i.slug}`,
        fields: [['name', 'Nom'], ['icon', 'Icône', 'icon'], ['position', 'Ordre', 'number'], ['description', 'Description', 'textarea'], ['meta_title', 'Titre Google'], ['meta_description', 'Description Google', 'textarea']],
        empty: { name: '', icon: 'phone', position: 0, description: '', meta_title: '', meta_description: '' },
    },
    brands: {
        label: 'Marques', title: (i) => i.name, sub: (i) => `${i.products_count} produit(s)`,
        fields: [['name', 'Nom']], empty: { name: '' },
    },
    zones: {
        label: 'Zones de livraison', title: (i) => i.name, sub: (i, money) => `${money(i.fee)}${i.delay ? ' · ' + i.delay : ''}${i.is_active ? '' : ' · inactive'}`,
        fields: [['name', 'Zone'], ['fee', 'Frais', 'number'], ['delay', 'Délai'], ['position', 'Ordre', 'number'], ['is_active', 'Active', 'bool']],
        empty: { name: '', fee: 0, delay: '24 h', position: 0, is_active: true },
    },
    pages: {
        label: 'Pages', title: (i) => i.title, sub: (i) => `/page/${i.slug}${i.is_published ? '' : ' · brouillon'}`,
        fields: [['title', 'Titre'], ['slug', 'Adresse'], ['body', 'Contenu (Markdown : ## titre, **gras**, - liste)', 'textarea-lg'], ['meta_description', 'Description Google', 'textarea'], ['is_published', 'Publiée', 'bool']],
        empty: { title: '', slug: '', body: '', meta_description: '', is_published: true },
    },
    reviews: {
        label: 'Avis clients', title: (i) => `${'★'.repeat(i.rating)} ${i.author}`, sub: (i) => i.body.slice(0, 90),
        hint: 'Saisissez uniquement de vrais avis reçus (Facebook, WhatsApp, Google), avec l\'accord du client.',
        fields: [['author', 'Prénom / nom'], ['city', 'Ville'], ['rating', 'Note (1-5)', 'number'], ['body', 'Avis', 'textarea'], ['is_published', 'Publié', 'bool']],
        empty: { author: '', city: '', rating: 5, body: '', is_published: true },
    },
};

export default function Settings(props) {
    const [tab, setTab] = useState(props.tab in schemas || ['users', 'shop'].includes(props.tab) ? props.tab : 'shop');
    const money = useMoney();
    const tabs = [['shop', 'Boutique'], ...Object.entries(schemas).map(([k, s]) => [k, s.label]), ...(props.users ? [['users', 'Équipe']] : [])];

    return (
        <AdminLayout title="Réglages">
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
                {tabs.map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={cx('chip shrink-0', tab === k && 'chip-on')}>{l}</button>)}
            </div>
            <div className="mt-4 max-w-4xl">
                {tab === 'shop' ? <ShopSettings settings={props.shopSettings} /> : tab === 'users' ? <Users users={props.users} /> : <Resource key={tab} name={tab} schema={schemas[tab]} items={props[tab]} money={money} />}
            </div>
        </AdminLayout>
    );
}

function Resource({ name, schema, items, money }) {
    const router = useRouter();
    const [editing, setEditing] = useState(null);
    return (
        <div className="space-y-4">
            {schema.hint && <p className="rounded-xl bg-white px-4 py-3 text-sm text-graphite">{schema.hint}</p>}
            <div className="card-admin divide-y divide-bone-200">
                {items.map((item) => (
                    <div key={item.id} className="p-4">
                        {editing === item.id ? (
                            <ItemForm name={name} schema={schema} item={item} onDone={() => setEditing(null)} />
                        ) : (
                            <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0"><p className="font-medium">{schema.title(item)}</p><p className="truncate text-sm text-graphite">{schema.sub(item, money)}</p></div>
                                <div className="flex shrink-0 gap-1">
                                    {name === 'pages' && <a href={route('pages.show', item.slug)} target="_blank" className="grid h-9 w-9 place-items-center rounded-full hover:bg-bone" aria-label="Voir"><Icon name="external" className="h-4 w-4" /></a>}
                                    <button onClick={() => setEditing(item.id)} className="rounded-full px-3 py-1.5 text-sm font-medium hover:bg-bone">Modifier</button>
                                    <button onClick={() => confirm('Supprimer ?') && router.delete(route('admin.settings.destroy', [name, item.id]), { preserveScroll: true })} className="grid h-9 w-9 place-items-center rounded-full text-graphite hover:bg-bone hover:text-als" aria-label="Supprimer"><Icon name="trash" className="h-4 w-4" /></button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                {!items.length && <p className="p-6 text-center text-sm text-graphite">Rien pour l'instant.</p>}
            </div>
            <div className="card-admin p-4">
                <p className="mb-3 font-display font-bold">Ajouter</p>
                <ItemForm name={name} schema={schema} item={null} />
            </div>
        </div>
    );
}

function ItemForm({ name, schema, item, onDone }) {
    const initial = Object.fromEntries(schema.fields.map(([k]) => [k, item?.[k] ?? schema.empty[k] ?? '']));
    const { data, setData, post, patch, processing, errors, reset } = useForm(initial);
    const submit = (e) => {
        e.preventDefault();
        const opts = { preserveScroll: true, onSuccess: () => (item ? onDone?.() : reset()) };
        item ? patch(route('admin.settings.update', [name, item.id]), opts) : post(route('admin.settings.store', name), opts);
    };
    return (
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
            {schema.fields.map(([k, label, type]) => (
                <label key={k} className={cx('block', (type?.startsWith('textarea') || k === 'name' || k === 'title') && 'sm:col-span-2', type === 'bool' && 'flex items-center gap-2 self-end pb-2')}>
                    {type === 'bool' ? (
                        <><input type="checkbox" checked={!!data[k]} onChange={(e) => setData(k, e.target.checked)} className="rounded border-bone-300 text-als focus:ring-0" /><span className="text-sm">{label}</span></>
                    ) : (
                        <>
                            <span className="mb-1 block text-xs font-medium text-graphite">{label}</span>
                            {type === 'icon' ? (
                                <div className="flex gap-1.5">{icons.map((ic) => <button type="button" key={ic} onClick={() => setData(k, ic)} className={cx('grid h-10 w-10 place-items-center rounded-xl border-2', data[k] === ic ? 'border-ink bg-bone' : 'border-bone-200')}><Icon name={ic} /></button>)}</div>
                            ) : type?.startsWith('textarea') ? (
                                <textarea className="field text-sm" rows={type === 'textarea-lg' ? 12 : 3} value={data[k] ?? ''} onChange={(e) => setData(k, e.target.value)} />
                            ) : (
                                <input className="field py-2 text-sm" type={type === 'number' ? 'number' : 'text'} value={data[k] ?? ''} onChange={(e) => setData(k, e.target.value)} />
                            )}
                        </>
                    )}
                    {errors[k] && <span className="error block text-xs">{errors[k]}</span>}
                </label>
            ))}
            <div className="flex gap-2 sm:col-span-2">
                <button disabled={processing} className="btn-ink py-2">{item ? 'Enregistrer' : 'Ajouter'}</button>
                {item && <button type="button" onClick={onDone} className="btn-ghost py-2">Annuler</button>}
            </div>
        </form>
    );
}

function Users({ users }) {
    const router = useRouter();
    const { data, setData, post, processing, errors, reset } = useForm({ name: '', email: '', role: 'employee' });
    return (
        <div className="space-y-4">
            <div className="card-admin divide-y divide-bone-200">
                {users.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-4">
                        <div><p className="font-medium">{u.name}</p><p className="text-sm text-graphite">{u.email} · {u.role === 'owner' ? 'Propriétaire' : 'Employé'}</p></div>
                        <button onClick={() => confirm(`Supprimer le compte de ${u.name} ?`) && router.delete(route('admin.users.destroy', u.id), { preserveScroll: true })} className="grid h-9 w-9 place-items-center rounded-full text-graphite hover:bg-bone hover:text-als" aria-label="Supprimer"><Icon name="trash" className="h-4 w-4" /></button>
                    </div>
                ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); post(route('admin.users.store'), { preserveScroll: true, onSuccess: () => reset() }); }} className="card-admin grid gap-3 p-4 sm:grid-cols-2">
                <p className="font-display font-bold sm:col-span-2">Ajouter un membre</p>
                <p className="text-sm text-graphite sm:col-span-2">1. Créez d'abord son compte dans Supabase › <b>Authentication › Users › Add user</b> (e-mail + mot de passe). 2. Ajoutez ici le même e-mail pour lui ouvrir le back-office.</p>
                {[['name', 'Nom', 'text'], ['email', 'E-mail du compte Supabase', 'email']].map(([k, l, t]) => (
                    <label key={k}><span className="mb-1 block text-xs font-medium text-graphite">{l}</span><input type={t} className="field py-2 text-sm" value={data[k]} onChange={(e) => setData(k, e.target.value)} />{errors[k] && <span className="error block text-xs">{errors[k]}</span>}</label>
                ))}
                <label><span className="mb-1 block text-xs font-medium text-graphite">Rôle</span><select className="field py-2 text-sm" value={data.role} onChange={(e) => setData('role', e.target.value)}><option value="employee">Employé</option><option value="owner">Propriétaire</option></select></label>
                <div className="sm:col-span-2"><button disabled={processing} className="btn-ink py-2">Donner l'accès</button></div>
            </form>
        </div>
    );
}

function ShopSettings({ settings }) {
    const pm = (v) => (settings.payment_methods || []).find((m) => m.value === v);
    const { data, setData, post, processing, errors } = useForm({
        name: settings.name ?? 'ALS Devices',
        whatsapp: settings.whatsapp ?? '',
        phone: settings.phone ?? '',
        email: settings.email ?? '',
        address: settings.address ?? '',
        hours: settings.hours ?? '',
        pickup_enabled: settings.pickup_enabled !== false,
        wave_number: settings.wave_number ?? '',
        om_number: settings.om_number ?? '',
        pay_cod: !!pm('cod'), pay_wave: !!pm('wave'), pay_om: !!pm('orange_money'),
        facebook: settings.social?.facebook ?? '', tiktok: settings.social?.tiktok ?? '', instagram: settings.social?.instagram ?? '',
        meta_pixel: settings.tracking?.meta_pixel ?? '', tiktok_pixel: settings.tracking?.tiktok_pixel ?? '',
        break_even_monthly: settings.break_even_monthly ?? 0,
    });
    const submit = (e) => {
        e.preventDefault();
        post(route('admin.settings.store', 'shop'), {
            transform: (d) => ({
                name: d.name, whatsapp: d.whatsapp, phone: d.phone, email: d.email, address: d.address, hours: d.hours,
                pickup_enabled: d.pickup_enabled, wave_number: d.wave_number, om_number: d.om_number, break_even_monthly: d.break_even_monthly,
                payment_methods: [
                    d.pay_cod && { value: 'cod', label: 'Paiement à la livraison', hint: 'Espèces ou mobile money à la réception' },
                    d.pay_wave && { value: 'wave', label: 'Wave', hint: `Transfert Wave au ${d.wave_number}` },
                    d.pay_om && { value: 'orange_money', label: 'Orange Money', hint: `Transfert Orange Money au ${d.om_number}` },
                ].filter(Boolean),
                social: { facebook: d.facebook, tiktok: d.tiktok, instagram: d.instagram },
                tracking: { meta_pixel: d.meta_pixel.trim(), tiktok_pixel: d.tiktok_pixel.trim() },
            }),
            onSuccess: () => window.location.reload(),
        });
    };
    const field = (k, label, props = {}) => (
        <label className="block"><span className="mb-1 block text-xs font-medium text-graphite">{label}</span>
            <input className="field py-2 text-sm" value={data[k]} onChange={(e) => setData(k, e.target.value)} {...props} />
            {errors[k] && <span className="error block text-xs">{errors[k]}</span>}
        </label>
    );
    const check = (k, label) => (
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={data[k]} onChange={(e) => setData(k, e.target.checked)} className="rounded border-bone-300 text-als focus:ring-0" />{label}</label>
    );
    return (
        <form onSubmit={submit} className="space-y-4">
            <section className="card-admin grid gap-3 p-5 sm:grid-cols-2">
                <h2 className="font-display text-lg font-bold sm:col-span-2">Coordonnées</h2>
                {field('name', 'Nom de la boutique')}
                {field('whatsapp', 'WhatsApp (format international, ex. 221771234567)', { inputMode: 'numeric' })}
                {field('phone', 'Téléphone affiché')}
                {field('email', 'E-mail')}
                {field('address', 'Adresse')}
                {field('hours', 'Horaires')}
            </section>
            <section className="card-admin grid gap-3 p-5 sm:grid-cols-2">
                <h2 className="font-display text-lg font-bold sm:col-span-2">Paiement & réception</h2>
                <div className="space-y-2 sm:col-span-2">{check('pay_cod', 'Paiement à la livraison')}{check('pay_wave', 'Wave')}{check('pay_om', 'Orange Money')}{check('pickup_enabled', 'Retrait / remise en main propre possible')}</div>
                {field('wave_number', 'Numéro Wave affiché au client')}
                {field('om_number', 'Numéro Orange Money affiché au client')}
            </section>
            <section className="card-admin grid gap-3 p-5 sm:grid-cols-2">
                <h2 className="font-display text-lg font-bold sm:col-span-2">Réseaux & publicité</h2>
                {field('facebook', 'Page Facebook (lien)')}
                {field('tiktok', 'Compte TikTok (lien)')}
                {field('instagram', 'Instagram (lien)')}
                {field('meta_pixel', 'ID Pixel Meta (Facebook)')}
                {field('tiktok_pixel', 'ID Pixel TikTok')}
                {field('break_even_monthly', 'Seuil de rentabilité mensuel (tableau de bord)', { inputMode: 'numeric' })}
            </section>
            <button disabled={processing} className="btn-red">Enregistrer les réglages</button>
        </form>
    );
}
