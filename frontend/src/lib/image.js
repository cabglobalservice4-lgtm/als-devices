/**
 * Réduit une photo avant l'envoi : 1600 px max, format WebP.
 * Une photo de téléphone (4–8 Mo) passe à ~200–400 Ko : pages plus rapides
 * en 3G/4G et stockage Supabase économisé. En cas d'échec, la photo d'origine est gardée.
 */
export async function compressImage(file, { maxSize = 1600, quality = 0.82 } = {}) {
    if (!file?.type?.startsWith('image/') || typeof createImageBitmap !== 'function') return file;
    try {
        const bitmap = await createImageBitmap(file);
        const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
        const width = Math.round(bitmap.width * scale);
        const height = Math.round(bitmap.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);
        bitmap.close?.();
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
        if (!blob || blob.size >= file.size) return file;
        return new File([blob], file.name.replace(/\.\w+$/, '') + '.webp', { type: 'image/webp' });
    } catch {
        return file;
    }
}
