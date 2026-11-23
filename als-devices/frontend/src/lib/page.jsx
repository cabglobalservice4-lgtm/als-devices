import { useEffect, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { onReload } from './kit';
import { useShop } from './shop';

/**
 * Charge les données d'une page depuis l'API puis affiche le composant
 * avec ces données en props. Garde l'affichage précédent pendant un
 * rechargement (filtres) pour éviter les clignotements.
 */
export default function ApiPage({ load, component: Component, shell: Shell, deps = [], remount = false }) {
    const params = useParams();
    const location = useLocation();
    const shopCtx = useShop();
    const [state, setState] = useState({ status: 'loading', data: null, key: null, version: 0 });
    const [tick, setTick] = useState(0);
    const seq = useRef(0);
    const key = location.pathname;

    useEffect(() => onReload(() => setTick((t) => t + 1)), []);

    useEffect(() => {
        const id = ++seq.current;
        setState((s) => ({ ...s, status: s.key === key && s.data ? 'refreshing' : 'loading' }));
        load({ params, search: location.search, shop: shopCtx })
            .then((data) => id === seq.current && setState((s) => ({ status: 'ready', data, key, version: s.version + 1 })))
            .catch((e) => id === seq.current && setState({ status: e.status === 404 ? 'notfound' : 'error', data: null, key, error: e }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key, location.search, tick, ...deps]);

    if (state.status === 'notfound') return <Shell><Message title="Page introuvable" text="Ce produit n'existe plus ou l'adresse est incorrecte." /></Shell>;
    if (state.status === 'error') return <Shell><Message title="Connexion impossible" text={state.error?.message || 'Le serveur ne répond pas. Réessayez dans un instant.'} retry={() => setTick((t) => t + 1)} /></Shell>;
    if (!state.data || state.key !== key) return <Shell><Loading /></Shell>;

    return (
        <>
            {state.status === 'refreshing' && <div className="fixed inset-x-0 top-0 z-[80] h-0.5 animate-pulse bg-als" />}
            <Component key={remount ? state.version : undefined} {...state.data} />
        </>
    );
}

function Loading() {
    return (
        <div className="container-als grid min-h-[50vh] place-items-center" role="status" aria-label="Chargement">
            <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-bone-300 border-t-als" />
        </div>
    );
}

function Message({ title, text, retry }) {
    return (
        <div className="container-als grid min-h-[50vh] place-items-center text-center">
            <div>
                <p className="h-display text-5xl">{title}<span className="text-als">.</span></p>
                <p className="mt-3 text-graphite">{text}</p>
                {retry ? <button onClick={retry} className="btn-ink mt-6">Réessayer</button> : <a href="/" className="btn-ink mt-6">Retour à l'accueil</a>}
            </div>
        </div>
    );
}
