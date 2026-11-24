import { cx } from '@/lib/format';

export function GradeStamp({ grade, size = 'md' }) {
    if (!grade) return null;
    const s = size === 'lg' ? 'h-14 w-14 text-3xl' : 'h-9 w-9 text-lg';
    return (
        <span className={cx('inline-flex items-center justify-center rounded-md border-2 border-ink bg-white font-display font-extrabold leading-none text-ink', s)} title={`Grade ${grade}`}>
            {grade}
        </span>
    );
}

export function ConditionPill({ condition, grade, className = '' }) {
    const refurb = condition === 'refurbished';
    return (
        <span className={cx('eyebrow inline-flex items-center gap-1.5 rounded-full px-2.5 py-1', refurb ? 'bg-ink text-white' : 'bg-als text-white', className)}>
            <span className={cx('h-1.5 w-1.5 rounded-full', refurb ? 'bg-als' : 'bg-white')} />
            {refurb ? `Reconditionné${grade ? ' · ' + grade : ''}` : 'Neuf'}
        </span>
    );
}

export function BatteryMeter({ value, dark = false }) {
    if (value == null) return null;
    const color = value >= 85 ? 'bg-ok' : value >= 75 ? 'bg-amber-500' : 'bg-als';
    return (
        <div className="flex items-center gap-3">
            <div className={cx('relative h-3.5 w-24 rounded-[4px] border p-[2px]', dark ? 'border-white/40' : 'border-ink/40')}>
                <div className={cx('h-full rounded-[2px]', color)} style={{ width: `${value}%` }} />
                <span className={cx('absolute -right-[4px] top-1/2 h-1.5 w-[3px] -translate-y-1/2 rounded-r-sm', dark ? 'bg-white/40' : 'bg-ink/40')} />
            </div>
            <span className="font-mono text-sm font-semibold">{value}%</span>
        </div>
    );
}

export function StockLine({ inStock, low, unique }) {
    if (!inStock) return <span className="font-mono text-xs uppercase tracking-wider text-graphite">Épuisé</span>;
    if (unique) return <span className="font-mono text-xs uppercase tracking-wider text-als">● Pièce unique</span>;
    if (low) return <span className="font-mono text-xs uppercase tracking-wider text-amber-600">● Derniers exemplaires</span>;
    return <span className="font-mono text-xs uppercase tracking-wider text-ok">● En stock</span>;
}
