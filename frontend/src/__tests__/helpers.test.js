import { describe, expect, it } from 'vitest';
import { route } from '@/lib/routes';
import { markdown } from '@/lib/markdown';
import { formatMoney, waLink } from '@/lib/format';
import { toQuery } from '@/lib/api';
import { card, parseCsv, paymentInstructions, slugify } from '@/lib/backend';

describe('route()', () => {
    it('construit les adresses du site', () => {
        expect(route('products.show', 'iphone-13')).toBe('/produit/iphone-13');
        expect(route('admin.settings.update', ['zones', 4])).toBe('/api/admin/settings/zones/4');
        expect(route('catalog.index', { condition: 'refurbished', grade: ['A', 'B'] })).toBe('/boutique?condition=refurbished&grade%5B%5D=A&grade%5B%5D=B');
    });
    it('refuse une route inconnue', () => {
        expect(() => route('nimporte')).toThrow();
    });
});

describe('markdown()', () => {
    it('convertit titres, gras et listes', () => {
        const html = markdown('## Garantie\n- **Neuf** : 12 mois\n- Reconditionné\n\nTexte');
        expect(html).toContain('<h2>Garantie</h2>');
        expect(html).toContain('<li><strong>Neuf</strong> : 12 mois</li>');
        expect(html).toContain('<p>Texte</p>');
    });
    it('neutralise le HTML saisi dans le back-office', () => {
        expect(markdown('<script>alert(1)</script>')).not.toContain('<script>');
        expect(markdown('[x](javascript:alert(1))')).not.toContain('href="javascript');
    });
});

describe('formatage', () => {
    it('affiche les prix en FCFA sans décimales', () => {
        expect(formatMoney(285000, { decimals: 0, currency_symbol: 'FCFA' })).toBe('285 000 FCFA');
    });
    it('affiche les prix en euros avec décimales', () => {
        expect(formatMoney(12.5, { decimals: 2, currency_symbol: '€' })).toBe('12,50 €');
    });
    it('construit un lien WhatsApp propre', () => {
        expect(waLink('+221 77 000 00 00', 'Salut & merci')).toBe('https://wa.me/221770000000?text=Salut%20%26%20merci');
    });
    it('slugify retire accents et symboles', () => {
        expect(slugify('Écouteurs JBL « Wave » 2e gén.')).toBe('ecouteurs-jbl-wave-2e-gen');
    });
    it('toQuery suit le format des filtres', () => {
        expect(toQuery({ brand: ['apple', 'samsung'], stock: true, q: '' })).toBe('?brand%5B%5D=apple&brand%5B%5D=samsung&stock=1');
    });
});

describe('parseCsv()', () => {
    it('lit un export Excel (point-virgule, guillemets, BOM)', () => {
        const rows = parseCsv('﻿nom;prix;description\n"iPhone 13";285000;"Écran 6,1"" ; OLED"\r\nCoque;7500;\n');
        expect(rows).toEqual([['nom', 'prix', 'description'], ['iPhone 13', '285000', 'Écran 6,1" ; OLED'], ['Coque', '7500', '']]);
    });
    it('lit un export Google Sheets (virgule)', () => {
        expect(parseCsv('nom,prix\nA,1')).toEqual([['nom', 'prix'], ['A', '1']]);
    });
});

describe('card()', () => {
    const p = {
        id: 1, name: 'iPhone 13', slug: 'iphone-13', condition: 'refurbished', grade: 'A', battery_health: 91, warranty_months: 6,
        is_unique: true, min_price: '285000.00', total_stock: 2, brand: { name: 'Apple' }, category: { name: 'Smartphones', icon: 'phone' }, images: [],
        variants: [
            { color: 'Minuit', color_hex: '#1F2228', storage: '256 Go', price: 325000, compare_at_price: null, is_active: true },
            { color: 'Minuit', color_hex: '#1F2228', storage: '128 Go', price: 285000, compare_at_price: 340000, is_active: true },
            { color: 'Rouge', color_hex: '#C00000', storage: '512 Go', price: 400000, is_active: false },
        ],
    };
    it('ignore les variantes désactivées et prend le prix le plus bas', () => {
        const c = card(p);
        expect(c.price).toBe(285000);
        expect(c.compare_at_price).toBe(340000);
        expect(c.storages).toEqual(['128 Go', '256 Go']);
        expect(c.colors).toEqual([{ name: 'Minuit', hex: '#1F2228' }]);
        expect(c.low_stock).toBe(true);
        expect(c.has_options).toBe(true);
    });
});

describe('paymentInstructions()', () => {
    const s = { currency_symbol: 'FCFA', wave_number: '77 111 22 33', om_number: '77 444 55 66' };
    it('donne le numéro Wave et la référence', () => {
        const t = paymentInstructions({ payment_method: 'wave', total: 287500, number: 'ALS-2611-0002' }, s);
        expect(t).toContain('77 111 22 33');
        expect(t).toContain('ALS-2611-0002');
        expect(t).toContain('287 500');
    });
    it('paiement à la livraison', () => {
        expect(paymentInstructions({ payment_method: 'cod' }, s)).toMatch(/à la réception/);
    });
});
