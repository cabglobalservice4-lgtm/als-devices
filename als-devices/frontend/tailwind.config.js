import forms from '@tailwindcss/forms';

/** Charte ALS : noir, rouge, blanc. */
export default {
    content: [
        './index.html',
        './src/**/*.{js,jsx}',
    ],
    theme: {
        extend: {
            colors: {
                ink: { DEFAULT: '#0B0B0C', 800: '#161618', 700: '#232326', 600: '#3A3A3F' },
                als: { DEFAULT: '#E10600', dark: '#B30500', light: '#FFE9E8' },
                bone: { DEFAULT: '#F5F3EF', 200: '#ECE9E3', 300: '#DEDAD2' },
                graphite: '#5E5E64',
                ok: '#1F9D55',
            },
            fontFamily: {
                display: ['"Bricolage Grotesque Variable"', 'system-ui', 'sans-serif'],
                sans: ['"Geist Variable"', 'system-ui', 'sans-serif'],
                mono: ['"Geist Mono Variable"', 'ui-monospace', 'monospace'],
            },
            letterSpacing: { tightest: '-0.045em' },
            boxShadow: {
                tag: '0 1px 0 rgba(11,11,12,.06), 0 12px 32px -12px rgba(11,11,12,.25)',
            },
            keyframes: {
                marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
                rise: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'none' } },
            },
            animation: {
                marquee: 'marquee 40s linear infinite',
                rise: 'rise .5s cubic-bezier(.2,.7,.2,1) both',
            },
        },
    },
    plugins: [forms],
};
