import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
    // Message visible dans la console du navigateur si Vercel n'a pas les variables
    console.error('VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY doivent être définies.');
}

export const supabase = createClient(url || 'https://invalid.supabase.co', key || 'invalid', {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: 'als.auth' },
});

export const BUCKET = 'als-devices';

/** Adresse publique d'une photo du bucket (ou lien externe tel quel). */
export function imageUrl(path) {
    if (!path) return null;
    if (/^https?:\/\//.test(path) || path.startsWith('/')) return path;
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
