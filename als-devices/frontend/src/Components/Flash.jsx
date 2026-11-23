import { useEffect } from 'react';
import { useShop } from '@/lib/shop';
import Icon from './Icon';

export default function Flash() {
    const { toast, notify } = useShop();

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => notify(null), 4000);
        return () => clearTimeout(t);
    }, [toast, notify]);

    if (!toast) return null;
    return (
        <div role="status" key={toast.id} className="fixed inset-x-4 bottom-24 z-[60] mx-auto flex max-w-md animate-rise items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-sm text-white shadow-tag md:bottom-8">
            <span className={toast.type === 'ok' ? 'grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ok' : 'grid h-6 w-6 shrink-0 place-items-center rounded-full bg-als'}>
                <Icon name={toast.type === 'ok' ? 'check' : 'close'} className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
            <span className="flex-1">{toast.text}</span>
            <button onClick={() => notify(null)} aria-label="Fermer" className="text-white/60 hover:text-white"><Icon name="close" className="h-4 w-4" /></button>
        </div>
    );
}
