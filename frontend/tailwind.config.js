import forms from '@tailwindcss/forms';

/**
 * Charte ALS : noir, rouge, blanc.
 * Une seule famille (Archivo, axe de largeur) : condensée pour les titres
 * et les prix, comme une enseigne de boutique ; largeur normale pour le texte.
 */
const archivo = ['"Archivo Variable"', 'system-ui', 'sans-serif'];

export default {
    content: [
        './index.html',
        './src/**/*.{js,jsx}',
    ],
    theme: {
        extend: {
            colors: {
                ink: { DEFAULT: '#000000', 800: '#141414', 700: '#262626', 600: '#3D3D3D' },
                als: { DEFAULT: '#E10600', dark: '#B00500', light: '#FFE8E6' },
                // Gris neutre du « comptoir » : fond des photos produit
                bone: { DEFAULT: '#F1F1EF', 200: '#E5E5E2', 300: '#D2D2CE' },
                graphite: '#5C5C5C',
                ok: '#0E8A47',
            },
            fontFamily: {
                display: archivo,
                sans: archivo,
                mono: archivo,
            },
            letterSpacing: { tightest: '-0.015em' },
            boxShadow: {
                tag: '0 1px 2px rgba(0,0,0,.08), 0 18px 40px -18px rgba(0,0,0,.35)',
            },
            keyframes: {
                swing: { '0%': { transform: 'rotate(7deg)' }, '60%': { transform: 'rotate(1deg)' }, '100%': { transform: 'rotate(3deg)' } },
                rise: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'none' } },
            },
            animation: {
                rise: 'rise .35s cubic-bezier(.2,.7,.2,1) both',
                swing:'swing .9s cubic-bezier(.2,.7,.2,1) .15s both',
            },
        },
    },
    plugins: [forms],
};
