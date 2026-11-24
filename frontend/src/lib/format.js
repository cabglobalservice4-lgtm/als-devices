import { useShop } from './shop';

export function formatMoney(amount, shop) {
    const decimals = shop?.decimals ?? 0;
    const n = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(Number(amount || 0));
    return `${n.replace(/\u202F/g, '\u00A0')}\u00A0${shop?.currency_symbol ?? 'FCFA'}`;
}

export function useMoney() {
    const { shop } = useShop();
    return (amount) => formatMoney(amount, shop);
}

export function waLink(number, text) {
    const n = String(number || '').replace(/\D/g, '');
    return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}

export const cx = (...c) => c.filter(Boolean).join(' ');

export function track(event, data = {}) {
    if (typeof window === 'undefined') return;
    try {
        window.fbq?.('track', event, data);
        const tt = { AddToCart: 'AddToCart', InitiateCheckout: 'InitiateCheckout', Purchase: 'CompletePayment', ViewContent: 'ViewContent' }[event];
        if (tt) window.ttq?.track(tt, data);
    } catch {
        /* le suivi ne doit jamais casser la page */
    }
}
