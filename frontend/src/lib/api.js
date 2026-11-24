// Point d'entrée unique des données : tout passe par Supabase (voir backend.js).
import { ApiError, supabaseRequest } from './backend';

export { ApiError };

const TOKEN_KEY = 'als.admin.token';
export const token = {
    get: () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } },
    set: (t) => { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* navigation privée */ } },
};

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

/** Sérialise un objet en query string (tableaux : brand[]=a&brand[]=b). */
export function toQuery(params = {}) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length)) return;
        if (Array.isArray(v)) v.forEach((x) => q.append(`${k}[]`, x));
        else q.append(k, v === true ? 1 : v === false ? 0 : v);
    });
    const s = q.toString();
    return s ? `?${s}` : '';
}

export async function request(method, path, { data, onProgress } = {}) {
    try {
        onProgress?.({ percentage: 10 });
        const res = await supabaseRequest(method, path, data);
        onProgress?.({ percentage: 100 });
        return res;
    } catch (e) {
        if (e instanceof ApiError) {
            if (e.status === 401 && path.startsWith('/api/admin') && !path.endsWith('/login')) onUnauthorized();
            throw e;
        }
        // Réseau coupé ou Supabase injoignable
        throw new ApiError(0, { message: /fetch/i.test(e?.message || '') ? 'Connexion impossible. Vérifiez votre réseau puis réessayez.' : e?.message || 'Erreur inattendue.' });
    }
}

export const api = {
    get: (path, params) => request('GET', path + toQuery(params)),
    post: (path, data, opts) => request('POST', path, { data, ...opts }),
    put: (path, data, opts) => request('PUT', path, { data, ...opts }),
    patch: (path, data, opts) => request('PATCH', path, { data, ...opts }),
    delete: (path) => request('DELETE', path),
};

/** Téléchargement d'un fichier généré dans le navigateur (export CSV, modèle d'import). */
export async function download(path, filename) {
    const blob = await request('GET', path);
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: filename });
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
