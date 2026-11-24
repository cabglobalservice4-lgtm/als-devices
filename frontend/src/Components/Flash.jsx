import { useEffect } from 'react';
import { Link } from '@/lib/kit';
import { useShop } from '@/lib/shop';
import Icon from './Icon';

export default function Flash() {
    const { toast, notify } = useShop();

    useEffect(() => {
        if (!toast) return;
        // Plus de temps quand il y a une action à faire
        const t = setTimeout(() => notify(null), toast.action ? 6000 : 4000);
        return () => clearTimeout(t);
    }, [toast, notify]);

    if (!toast) return null;
    return (
        <div role="status" key={toast.id} className="fixed inset-x-4 bottom-24 z-[60] mx-auto flex max-w-md animate-rise items-center gap-3 rounded-xl bg-ink py-2.5 pl-3 pr-2.5 text-sm text-white shadow-tag md:bottom-8">
            <span className={toast.type === 'ok' ? 'grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ok' : 'grid h-6 w-6 shrink-0 place-items-center rounded-full bg-als'}>
                <Icon name={toast.type === 'ok' ? 'check' : 'close'} className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
            <span className="flex-1 py-1">{toast.text}</span>
            {toast.action && (
                <Link href={toast.action.href} onClick={() => notify(null)} className="shrink-0 rounded-md bg-white px-3 py-2 text-[13px] font-bold text-ink hover:bg-bone">
                    {toast.action.label}
                </Link>
            )}
            <button onClick={() => notify(null)} aria-label="Fermer" className="grid h-8 w-8 shrink-0 place-items-center text-white/60 hover:text-white"><Icon name="close" className="h-4 w-4" /></button>
        </div>
    );
}
