import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Vrai si les variables Supabase ont bien été fournies au moment du build. */
export const isConfigured = Boolean(url && key && /^https:\/\/.+\.supabase\.co/.test(url));

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
