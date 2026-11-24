import { useEffect } from 'react';
import { useShop } from '@/lib/shop';

const DEFAULT_DESC = 'Smartphones, tablettes, ordinateurs et accessoires neufs et reconditionnés, testés et garantis. Paiement à la livraison, Wave et Orange Money.';

function setMeta(attr, key, content) {
    let el = document.head.querySelector(`meta[${attr}="${key}"]`);
    if (!content) { el?.remove(); return; }
    if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
    el.setAttribute('content', content);
}

/** Titre, description, balises Open Graph et données structurées de la page. */
export default function Seo({ title, description, image, type = 'website', jsonLd, noindex = false }) {
    const { shop } = useShop();

    useEffect(() => {
        const appName = shop?.name || 'ALS Devices';
        const fullTitle = title ? `${title} | ${appName}` : `${appName} — Smartphones, tablettes et ordinateurs neufs et reconditionnés`;
        const desc = description || DEFAULT_DESC;
        const url = window.location.origin + window.location.pathname;

        document.title = fullTitle;
        setMeta('name', 'description', desc);
        setMeta('name', 'robots', noindex ? 'noindex,nofollow' : null);
        setMeta('property', 'og:type', type);
        setMeta('property', 'og:site_name', appName);
        setMeta('property', 'og:title', title || appName);
        setMeta('property', 'og:description', desc);
        setMeta('property', 'og:url', url);
        setMeta('property', 'og:image', image);

        let canonical = document.head.querySelector('link[rel="canonical"]');
        if (!canonical) { canonical = Object.assign(document.createElement('link'), { rel: 'canonical' }); document.head.appendChild(canonical); }
        canonical.href = url;

        let ld = document.getElementById('jsonld');
        if (jsonLd) {
            if (!ld) { ld = Object.assign(document.createElement('script'), { id: 'jsonld', type: 'application/ld+json' }); document.head.appendChild(ld); }
            ld.textContent = JSON.stringify(jsonLd);
        } else {
            ld?.remove();
        }
    }, [title, description, image, type, noindex, JSON.stringify(jsonLd), shop?.name]);

    return null;
}
