import { Component } from 'react';

/** Évite la page blanche : en cas de bug d'affichage, propose de recharger. */
export default class ErrorBoundary extends Component {
    state = { error: null };

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        console.error('Erreur d\'affichage', error, info?.componentStack);
    }

    render() {
        if (!this.state.error) return this.props.children;
        return (
            <div className="grid min-h-screen place-items-center bg-white p-6 text-center">
                <div>
                    <p className="h-display text-5xl">Oups</p>
                    <p className="mt-3 text-graphite">Un problème d'affichage est survenu sur cette page.</p>
                    <div className="mt-6 flex justify-center gap-3">
                        <button onClick={() => window.location.reload()} className="btn-ink">Recharger</button>
                        <a href="/" className="btn-ghost">Accueil</a>
                    </div>
                </div>
            </div>
        );
    }
}
