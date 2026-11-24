import { Link, reloadPage, useRouter, useForm } from '@/lib/kit';
import AdminLayout from '@/Layouts/AdminLayout';
import Icon from '@/Components/Icon';
import { cx } from '@/lib/format';
import { route } from '@/lib/routes';

const emptyVariant = { id: null, sku: '', color: '', color_hex: '', storage: '', price: '', compare_at_price: '', stock: 1, low_stock_threshold: 2, serial_number: '', is_active: true };

export default function ProductForm({ product, categories, brands, grades }) {
    const router = useRouter();
    const editing = !!product;
    const { data, setData, post, processing, errors, progress } = useForm({
        name: product?.name ?? '',
        slug: product?.slug ?? '',
        category_id: product?.category_id ?? categories[0]?.id ?? '',
        brand_id: product?.brand_id ?? '',
        short_description: product?.short_description ?? '',
        description: product?.description ?? '',
        condition: product?.condition ?? 'new',
        grade: product?.grade ?? '',
        battery_health: product?.battery_health ?? '',
        warranty_months: product?.warranty_months ?? 12,
        is_unique: product?.is_unique ?? false,
        is_featured: product?.is_featured ?? false,
        is_active: product?.is_active ?? true,
        specs: product?.specs ?? [],
        meta_title: product?.meta_title ?? '',
        meta_description: product?.meta_description ?? '',
        variants: product?.variants?.map((v) => ({ ...emptyVariant, ...v, color: v.color ?? '', color_hex: v.color_hex ?? '', storage: v.storage ?? '', compare_at_price: v.compare_at_price ?? '', serial_number: v.serial_number ?? '' })) ?? [{ ...emptyVariant }],
        images: [],
        ...(editing ? { _method: 'put' } : {}),
    });

    const setVariant = (i, key, value) => setData('variants', data.variants.map((v, k) => (k === i ? { ...v, [key]: value } : v)));
    const setSpec = (i, key, value) => setData('specs', data.specs.map((s, k) => (k === i ? { ...s, [key]: value } : s)));
    const submit = (e) => {
        e.preventDefault();
        post(editing ? route('admin.products.update', product.id) : route('admin.products.store'), {
            forceFormData: true,
            onSuccess: (res) => (editing ? reloadPage() : router.visit(route('admin.products.edit', res.id))),
        });
    };
    const err = (k) => errors[k] && <p className="error">{errors[k]}</p>;
    const refurb = data.condition === 'refurbished';

    return (
        <AdminLayout title={editing ? product.name : 'Nouveau produit'} actions={editing && <a href={route('products.show', product.slug)} target="_blank" className="btn-ghost py-2"><Icon name="external" className="h-4 w-4" /> Voir</a>}>
            <form onSubmit={submit} className="grid gap-4 xl:grid-cols-3">
                <div className="space-y-4 xl:col-span-2">
                    <Card title="Informations">
                        <label className="block"><span className="label">Nom du produit</span><input className="field" value={data.name} onChange={(e) => setData('name', e.target.value)} required />{err('name')}</label>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label><span className="label">Catégorie</span><select className="field" value={data.category_id} onChange={(e) => setData('category_id', e.target.value)}>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
                            <label><span className="label">Marque</span><select className="field" value={data.brand_id ?? ''} onChange={(e) => setData('brand_id', e.target.value)}><option value="">—</option>{brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
                        </div>
                        <label className="block"><span className="label">Accroche (affichée sous le titre)</span><input className="field" maxLength={280} value={data.short_description} onChange={(e) => setData('short_description', e.target.value)} /></label>
                        <label className="block"><span className="label">Description</span><textarea className="field" rows={6} value={data.description} onChange={(e) => setData('description', e.target.value)} /></label>
                    </Card>

                    <Card title="Variantes, prix & stock" hint="Une ligne par combinaison stockage / couleur. Le n° IMEI reste interne.">
                        {errors.variants && <p className="error">{errors.variants}</p>}
                        <div className="space-y-3">
                            {data.variants.map((v, i) => (
                                <div key={i} className={cx('grid grid-cols-2 gap-3 rounded-xl border border-bone-200 p-3 md:grid-cols-6', !v.is_active && 'opacity-60')}>
                                    <Mini label="SKU" error={errors[`variants.${i}.sku`]}><input className="field py-2 font-mono text-sm" value={v.sku} onChange={(e) => setVariant(i, 'sku', e.target.value)} required /></Mini>
                                    <Mini label="Stockage"><input className="field py-2 text-sm" placeholder="128 Go" value={v.storage} onChange={(e) => setVariant(i, 'storage', e.target.value)} /></Mini>
                                    <Mini label="Couleur">
                                        <div className="flex gap-1.5">
                                            <input type="color" aria-label="Teinte" value={v.color_hex || '#111111'} onChange={(e) => setVariant(i, 'color_hex', e.target.value)} className="h-[38px] w-10 shrink-0 cursor-pointer rounded-lg border border-bone-300 p-0.5" />
                                            <input className="field py-2 text-sm" placeholder="Noir" value={v.color} onChange={(e) => setVariant(i, 'color', e.target.value)} />
                                        </div>
                                    </Mini>
                                    <Mini label="Prix" error={errors[`variants.${i}.price`]}><input className="field py-2 text-sm" inputMode="decimal" value={v.price} onChange={(e) => setVariant(i, 'price', e.target.value)} required /></Mini>
                                    <Mini label="Prix barré" error={errors[`variants.${i}.compare_at_price`]}><input className="field py-2 text-sm" inputMode="decimal" value={v.compare_at_price} onChange={(e) => setVariant(i, 'compare_at_price', e.target.value)} /></Mini>
                                    <Mini label="Stock"><input className="field py-2 font-mono text-sm" type="number" min="0" value={v.stock} onChange={(e) => setVariant(i, 'stock', e.target.value)} /></Mini>
                                    <Mini label="IMEI / n° série" className="col-span-2 md:col-span-3"><input className="field py-2 font-mono text-sm" value={v.serial_number} onChange={(e) => setVariant(i, 'serial_number', e.target.value)} /></Mini>
                                    <Mini label="Alerte stock ≤"><input className="field py-2 font-mono text-sm" type="number" min="0" value={v.low_stock_threshold} onChange={(e) => setVariant(i, 'low_stock_threshold', e.target.value)} /></Mini>
                                    <div className="col-span-2 flex items-end justify-between gap-2">
                                        <label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" checked={v.is_active} onChange={(e) => setVariant(i, 'is_active', e.target.checked)} className="rounded border-bone-300 text-ink focus:ring-0" /> Active</label>
                                        {data.variants.length > 1 && <button type="button" onClick={() => setData('variants', data.variants.filter((_, k) => k !== i))} className="pb-2 text-sm text-graphite hover:text-als"><Icon name="trash" className="h-4 w-4" /></button>}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={() => setData('variants', [...data.variants, { ...emptyVariant, sku: data.variants[0]?.sku ? data.variants[0].sku + '-' + (data.variants.length + 1) : '' }])} className="btn-ghost py-2"><Icon name="plus" className="h-4 w-4" /> Ajouter une variante</button>
                    </Card>

                    <Card title="Photos" hint="Photos réelles de l'appareil, fond clair. JPG, PNG ou WebP, 5 Mo max.">
                        <div className="flex flex-wrap gap-3">
                            {product?.images?.map((im) => (
                                <div key={im.id} className="group relative h-24 w-24 overflow-hidden rounded-xl bg-bone">
                                    <img src={im.url} alt="" className="h-full w-full object-contain p-1 mix-blend-multiply" />
                                    <button type="button" onClick={() => confirm('Supprimer cette photo ?') && router.delete(route('admin.images.destroy', im.id), { preserveScroll: true })} className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-white/90 opacity-0 shadow group-hover:opacity-100" aria-label="Supprimer"><Icon name="trash" className="h-3.5 w-3.5" /></button>
                                </div>
                            ))}
                            <label className="grid h-24 w-24 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-bone-300 text-graphite hover:border-ink">
                                <Icon name="upload" />
                                <input type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => setData('images', [...e.target.files])} />
                            </label>
                        </div>
                        {data.images.length > 0 && <p className="text-sm text-graphite">{data.images.length} photo(s) prête(s) à envoyer.</p>}
                        {progress && <div className="h-1.5 overflow-hidden rounded-full bg-bone-200"><div className="h-full bg-als" style={{ width: `${progress.percentage}%` }} /></div>}
                        {Object.keys(errors).filter((k) => k.startsWith('images')).map((k) => <p key={k} className="error">{errors[k]}</p>)}
                    </Card>

                    <Card title="Caractéristiques">
                        {data.specs.map((s, i) => (
                            <div key={i} className="flex gap-2">
                                <input className="field py-2 text-sm" placeholder="Écran" value={s.label} onChange={(e) => setSpec(i, 'label', e.target.value)} />
                                <input className="field py-2 text-sm" placeholder='OLED 6,1"' value={s.value} onChange={(e) => setSpec(i, 'value', e.target.value)} />
                                <button type="button" onClick={() => setData('specs', data.specs.filter((_, k) => k !== i))} className="px-2 text-graphite hover:text-als" aria-label="Retirer"><Icon name="trash" className="h-4 w-4" /></button>
                            </div>
                        ))}
                        <button type="button" onClick={() => setData('specs', [...data.specs, { label: '', value: '' }])} className="btn-ghost py-2"><Icon name="plus" className="h-4 w-4" /> Ligne</button>
                    </Card>
                </div>

                <div className="space-y-4">
                    <Card title="État">
                        <div className="grid grid-cols-2 gap-2">
                            {[['new', 'Neuf'], ['refurbished', 'Reconditionné']].map(([v, l]) => (
                                <button type="button" key={v} onClick={() => { setData((d) => ({ ...d, condition: v, warranty_months: v === 'new' ? 12 : 6, is_unique: v === 'refurbished' })); }} className={cx('chip justify-center py-2.5', data.condition === v && 'chip-on')}>{l}</button>
                            ))}
                        </div>
                        {refurb && (
                            <>
                                <div>
                                    <span className="label">Grade</span>
                                    <div className="grid gap-2">
                                        {Object.entries(grades).map(([g, d]) => (
                                            <label key={g} className={cx('flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 text-sm', data.grade === g ? 'border-ink' : 'border-bone-200')}>
                                                <input type="radio" className="sr-only" checked={data.grade === g} onChange={() => setData('grade', g)} />
                                                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border-2 border-ink font-display font-extrabold">{g}</span>{d}
                                            </label>
                                        ))}
                                    </div>
                                    {err('grade')}
                                </div>
                                <label className="block"><span className="label">Santé batterie (%)</span><input className="field" type="number" min="0" max="100" value={data.battery_health} onChange={(e) => setData('battery_health', e.target.value)} /></label>
                            </>
                        )}
                        <label className="block"><span className="label">Garantie (mois)</span><input className="field" type="number" min="0" max="60" value={data.warranty_months} onChange={(e) => setData('warranty_months', e.target.value)} /></label>
                        <Toggle checked={data.is_unique} onChange={(v) => setData('is_unique', v)} label="Pièce unique" hint="Retiré du site dès qu'il est vendu" />
                    </Card>

                    <Card title="Publication">
                        <Toggle checked={data.is_active} onChange={(v) => setData('is_active', v)} label="Visible sur le site" />
                        <Toggle checked={data.is_featured} onChange={(v) => setData('is_featured', v)} label="Mis en avant sur l'accueil" />
                    </Card>

                    <Card title="Référencement Google">
                        <label className="block"><span className="label">Adresse (slug)</span><input className="field font-mono text-sm" placeholder="auto" value={data.slug} onChange={(e) => setData('slug', e.target.value)} />{err('slug')}</label>
                        <label className="block"><span className="label">Titre <span className="font-normal text-graphite">({data.meta_title.length}/70)</span></span><input className="field" maxLength={70} value={data.meta_title} onChange={(e) => setData('meta_title', e.target.value)} /></label>
                        <label className="block"><span className="label">Description <span className="font-normal text-graphite">({data.meta_description.length}/160 conseillé)</span></span><textarea className="field" rows={3} maxLength={320} value={data.meta_description} onChange={(e) => setData('meta_description', e.target.value)} /></label>
                    </Card>

                    <div className="sticky bottom-4 flex gap-2">
                        <button disabled={processing} className="btn-red flex-1 py-3.5">{editing ? 'Enregistrer' : 'Créer le produit'}</button>
                        {editing && <button type="button" onClick={() => confirm('Supprimer ce produit ? S\'il a déjà été commandé, il sera seulement masqué.') && router.delete(route('admin.products.destroy', product.id), { onSuccess: () => router.visit(route('admin.products.index')) })} className="btn-ghost px-4" aria-label="Supprimer"><Icon name="trash" className="h-4 w-4" /></button>}
                    </div>
                    <Link href={route('admin.products.index')} className="block text-center text-sm text-graphite">← Retour à la liste</Link>
                </div>
            </form>
        </AdminLayout>
    );
}

function Card({ title, hint, children }) {
    return (
        <section className="card-admin space-y-4 p-5">
            <div><h2 className="font-display text-lg font-bold">{title}</h2>{hint && <p className="text-sm text-graphite">{hint}</p>}</div>
            {children}
        </section>
    );
}
function Mini({ label, error, className = '', children }) {
    return <label className={cx('block', className)}><span className="mb-1 block text-xs font-medium text-graphite">{label}</span>{children}{error && <span className="error block text-xs">{error}</span>}</label>;
}
function Toggle({ checked, onChange, label, hint }) {
    return (
        <label className="flex cursor-pointer items-center justify-between gap-4">
            <span><span className="block text-sm font-medium">{label}</span>{hint && <span className="text-xs text-graphite">{hint}</span>}</span>
            <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <span className={cx('relative h-6 w-11 shrink-0 rounded-full transition', checked ? 'bg-als' : 'bg-bone-300')}><span className={cx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition', checked ? 'left-[22px]' : 'left-0.5')} /></span>
        </label>
    );
}
