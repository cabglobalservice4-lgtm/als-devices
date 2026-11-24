/** Affiché à la place du site quand Vercel n'a pas reçu les variables Supabase. */
export default function SetupScreen() {
    const rows = [
        ['VITE_SUPABASE_URL', 'https://<votre-projet>.supabase.co'],
        ['VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_… (Supabase › Project Settings › API Keys)'],
    ];
    return (
        <div className="grid min-h-screen place-items-center bg-ink p-6 text-white">
            <div className="w-full max-w-xl">
                <p className="eyebrow text-als">Configuration incomplète</p>
                <h1 className="h-display mt-3 text-4xl md:text-5xl">Le site n'est pas encore relié à Supabase<span className="text-als">.</span></h1>
                <p className="mt-4 text-white/70">Ajoutez ces deux variables dans <b>Vercel › Settings › Environment Variables</b>, puis lancez <b>Redeploy</b> (sans le cache) :</p>
                <dl className="mt-6 space-y-3">
                    {rows.map(([k, v]) => (
                        <div key={k} className="rounded-xl bg-white/5 p-4">
                            <dt className="font-mono text-sm font-semibold">{k}</dt>
                            <dd className="mt-1 text-sm text-white/60">{v}</dd>
                        </div>
                    ))}
                </dl>
                <p className="mt-6 text-sm text-white/50">En local : copiez <code className="font-mono">frontend/.env.example</code> vers <code className="font-mono">frontend/.env</code>.</p>
            </div>
        </div>
    );
}
