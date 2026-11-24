/**
 * Petits outils partagés par toutes les pages : liens, navigation,
 * formulaires reliés à l'API, rechargement des données de la page.
 */
import { forwardRef, useCallback, useRef, useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { api, ApiError } from './api';
import { useShop } from './shop';
import { useAuth } from './auth';

// --- Rechargement des données de la page courante -----------------------
const listeners = new Set();
export const onReload = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export const reloadPage = () => listeners.forEach((fn) => fn());

// --- Liens -----------------------------------------------------------------
export const Link = forwardRef(function Link({ href, children, preserveScroll, ...props }, ref) {
    if (href?.startsWith('http')) return <a ref={ref} href={href} {...props}>{children}</a>;
    return <RouterLink ref={ref} to={href} state={preserveScroll ? { keepScroll: true } : undefined} {...props}>{children}</RouterLink>;
});

// --- Navigation et actions directes ---------------------------------------
export function useRouter() {
    const navigate = useNavigate();
    const { notify } = useShop();

    return {
        /** Change d'adresse (filtres, recherche). Les paramètres deviennent la query string. */
        get(url, params = {}, { replace = false, preserveScroll = false } = {}) {
            const q = new URLSearchParams();
            Object.entries(params).forEach(([k, v]) => {
                if (v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length)) return;
                Array.isArray(v) ? v.forEach((x) => q.append(`${k}[]`, x)) : q.append(k, v === true ? 1 : v);
            });
            const qs = q.toString();
            navigate(qs ? `${url}?${qs}` : url, { replace, state: preserveScroll ? { keepScroll: true } : undefined });
        },
        visit: (url) => navigate(url),
        async delete(url, { onSuccess } = {}) {
            try {
                const res = await api.delete(url);
                if (res?.message && res.message !== 'OK') notify(res.message);
                onSuccess ? onSuccess(res) : reloadPage();
            } catch (e) {
                notify(e.message, 'err');
            }
        },
    };
}

// --- Données globales (boutique, utilisateur, adresse courante) -------------
export function usePage() {
    const shopCtx = useShop();
    const auth = useAuth?.();
    const location = useLocation();
    return {
        props: {
            shop: shopCtx.shop,
            nav: shopCtx.nav,
            cartCount: shopCtx.cart.count,
            auth: { user: auth?.user ?? null },
            current: { location: typeof window !== 'undefined' ? window.location.origin + location.pathname + location.search : '' },
        },
    };
}

// --- Formulaires ------------------------------------------------------------
export function useForm(initial) {
    const initialRef = useRef(initial);
    const firstRef = useRef(initial);
    const [data, setDataState] = useState(initial);
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(null);
    const { notify } = useShop();

    const setData = useCallback((key, value) => {
        setDataState((d) => (typeof key === 'function' ? key(d) : typeof key === 'object' ? key : { ...d, [key]: value }));
    }, []);

    const submit = async (method, url, { onSuccess, onError, transform, forceFormData, silent } = {}) => {
        setProcessing(true);
        setErrors({});
        try {
            const payload = transform ? transform(data) : data;
            const res = await api[method](url, payload, { formData: forceFormData, onProgress: forceFormData ? setProgress : undefined });
            if (res?.message && !silent) notify(res.message);
            initialRef.current = data;
            if (onSuccess) onSuccess(res);
            else reloadPage();
            return res;
        } catch (e) {
            if (e instanceof ApiError && e.status === 422) {
                setErrors(e.errors);
                if (!Object.keys(e.errors).length) notify(e.message, 'err');
                else if (e.errors.cart) notify(e.errors.cart, 'err');
            } else {
                notify(e.message || 'Une erreur est survenue.', 'err');
            }
            onError?.(e);
        } finally {
            setProcessing(false);
            setProgress(null);
        }
    };

    return {
        data,
        setData,
        errors,
        processing,
        progress,
        isDirty: JSON.stringify(data) !== JSON.stringify(initialRef.current),
        reset: () => { initialRef.current = firstRef.current; setDataState(firstRef.current); },
        post: (url, opts) => submit('post', url, opts),
        put: (url, opts) => submit('put', url, opts),
        patch: (url, opts) => submit('patch', url, opts),
    };
}
