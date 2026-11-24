import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from './api';

const ShopContext = createContext(null);
const CART_KEY = 'als.cart';

const read = (k, fallback) => { try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* stockage indisponible */ } };

export function ShopProvider({ children }) {
    const [config, setConfig] = useState(null);
    const [failed, setFailed] = useState(false);
    const [cart, setCart] = useState(() => read(CART_KEY, []));
    const [toast, setToast] = useState(null);
    const location = useLocation();

    useEffect(() => {
        api.get('/api/config').then(setConfig).catch(() => setFailed(true));
    }, []);

    // Mémorise l'origine du visiteur (Facebook, TikTok…) pour l'attacher à la commande
    useEffect(() => {
        const p = new URLSearchParams(location.search);
        const src = p.get('utm_source') || (p.get('fbclid') && 'facebook') || (p.get('ttclid') && 'tiktok');
        if (src && !sessionStorage.getItem('als.source')) sessionStorage.setItem('als.source', src.toLowerCase().slice(0, 40));
    }, [location.search]);

    useEffect(() => write(CART_KEY, cart), [cart]);

    // Synchronise le panier entre plusieurs onglets
    useEffect(() => {
        const onStorage = (e) => e.key === CART_KEY && setCart(read(CART_KEY, []));
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    usePixels(config?.shop?.tracking, location.pathname);

    // action facultative : { href, label } — un lien affiché dans la notification (ex. « Voir le panier »)
    const notify = useCallback((text, type = 'ok', action = null) => setToast(text ? { text, type, action, id: Date.now() } : null), []);

    const cartApi = useMemo(() => ({
        items: cart,
        count: cart.reduce((n, i) => n + i.quantity, 0),
        add(variantId, quantity = 1, max = 20) {
            setCart((c) => {
                const found = c.find((i) => i.variant_id === variantId);
                if (found) return c.map((i) => (i.variant_id === variantId ? { ...i, quantity: Math.min(i.quantity + quantity, max) } : i));
                return [...c, { variant_id: variantId, quantity: Math.min(quantity, max) }];
            });
        },
        setQuantity(variantId, quantity) {
            setCart((c) => (quantity < 1 ? c.filter((i) => i.variant_id !== variantId) : c.map((i) => (i.variant_id === variantId ? { ...i, quantity } : i))));
        },
        remove(variantId) { setCart((c) => c.filter((i) => i.variant_id !== variantId)); },
        replace(items) { setCart(items); },
        clear() { setCart([]); },
    }), [cart]);

    const value = useMemo(() => ({
        shop: config?.shop ?? fallbackShop,
        nav: config?.nav ?? [],
        ready: !!config,
        failed,
        cart: cartApi,
        toast,
        notify,
    }), [config, failed, cartApi, toast, notify]);

    return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export const useShop = () => useContext(ShopContext);

const fallbackShop = { name: import.meta.env.VITE_APP_NAME || 'ALS Devices', currency: 'XOF', currency_symbol: 'FCFA', decimals: 0, social: {}, tracking: {} };

/** Charge les pixels Meta et TikTok si leurs identifiants sont configurés côté backend. */
function usePixels(tracking, pathname) {
    useEffect(() => {
        if (!tracking || typeof window === 'undefined') return;
        if (tracking.meta_pixel && !window.fbq) {
            /* eslint-disable */
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
            window.fbq('init', tracking.meta_pixel);
        }
        if (tracking.tiktok_pixel && !window.ttq) {
            !function (w, d, t) {w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=d.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load(tracking.tiktok_pixel);}(window, document, 'ttq');
            /* eslint-enable */
        }
    }, [tracking]);

    // Une page vue à chaque changement de page (hors back-office)
    useEffect(() => {
        if (pathname.startsWith('/admin')) return;
        try { window.fbq?.('track', 'PageView'); window.ttq?.page(); } catch { /* ignore */ }
    }, [pathname]);
}
