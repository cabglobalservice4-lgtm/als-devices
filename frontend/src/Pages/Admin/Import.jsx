import { useForm, useRouter } from '@/lib/kit';
import { download } from '@/lib/api';
import AdminLayout from '@/Layouts/AdminLayout';
import Icon from '@/Components/Icon';
import { route } from '@/lib/routes';

export default function Import({ columns }) {
    const router = useRouter();
    const { data, setData, post, processing, errors } = useForm({ file: null });
    return (
        <AdminLayout title="Importer des produits">
            <div className="grid max-w-5xl gap-4 lg:grid-cols-2">
                <section className="card-admin p-6">
                    <h2 className="font-display text-xl font-bold">1. Préparer le tableur</h2>
                    <p className="mt-2 text-sm leading-relaxed text-graphite">Une ligne par variante. Les lignes qui ont le même <b>nom</b> deviennent un seul produit avec plusieurs variantes. Un SKU déjà existant est mis à jour (prix, stock), jamais dupliqué.</p>
                    <button type="button" onClick={() => download(route('admin.import.template'), 'modele-import-als.csv')} className="btn-ghost mt-5"><Icon name="download" className="h-4 w-4" /> Télécharger le modèle</button>
                    <div className="mt-6 flex flex-wrap gap-1.5">{columns.map((c) => <code key={c} className="rounded-md bg-bone px-2 py-1 font-mono text-xs">{c}</code>)}</div>
                    <ul className="mt-5 space-y-1.5 text-sm text-graphite">
                        <li><b className="text-ink">etat</b> : neuf ou reconditionne</li>
                        <li><b className="text-ink">grade</b> : A, B ou C (reconditionnés)</li>
                        <li><b className="text-ink">piece_unique</b> : oui / non</li>
                        <li><b className="text-ink">image_url</b> : lien d'une photo (facultatif)</li>
                    </ul>
                </section>
                <form onSubmit={(e) => { e.preventDefault(); post(route('admin.import.store'), { forceFormData: true, onSuccess: () => router.visit(route('admin.products.index')) }); }} className="card-admin p-6">
                    <h2 className="font-display text-xl font-bold">2. Envoyer le fichier</h2>
                    <p className="mt-2 text-sm text-graphite">Dans Excel ou Google Sheets : Fichier › Télécharger › CSV.</p>
                    <label className="mt-5 grid cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-bone-300 px-6 py-12 text-center hover:border-ink">
                        <Icon name="upload" className="h-8 w-8 text-graphite" />
                        <span className="mt-3 font-medium">{data.file ? data.file.name : 'Choisir un fichier .csv'}</span>
                        <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => setData('file', e.target.files[0])} />
                    </label>
                    {errors.file && <p className="error">{errors.file}</p>}
                    <button disabled={!data.file || processing} className="btn-red mt-5 w-full">Importer</button>
                </form>
            </div>
        </AdminLayout>
    );
}
