import { cx } from '@/lib/format';

export function GradeStamp({ grade, size = 'md' }) {
    if (!grade) return null;
    const s = size === 'lg' ? 'h-16 w-16 text-5xl' : 'h-9 w-9 text-2xl';
    return (
        <span className={cx('inline-grid shrink-0 place-items-center rounded-md border-2 border-current font-display font-black leading-none', s)} style={{ fontVariationSettings: "'wdth' 62" }} title={`Grade ${grade}`}>
            {grade}
        </span>
    );
}

export function ConditionPill({ condition, grade, className = '' }) {
    const refurb = condition === 'refurbished';
    return (
        <span className={cx('inline-flex items-center rounded-[4px] px-2 py-1 text-xs font-bold leading-none', refurb ? 'bg-ink text-white' : 'bg-als text-white', className)}>
            {refurb ? `Reconditionné${grade ? ' grade ' + grade : ''}` : 'Neuf'}
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
            <span className="font-mono text-sm font-bold">{value}%</span>
        </div>
    );
}

export function StockLine({ inStock, low, unique }) {
    const base = 'inline-flex items-center gap-1.5 text-[13px] font-semibold';
    const dot = (c) => <span className={cx('h-2 w-2 rounded-full', c)} />;
    if (!inStock) return <span className={cx(base, 'text-graphite')}>{dot('bg-bone-300')}Épuisé</span>;
    if (unique) return <span className={cx(base, 'text-als')}>{dot('bg-als')}Pièce unique</span>;
    if (low) return <span className={cx(base, 'text-amber-700')}>{dot('bg-amber-500')}Derniers exemplaires</span>;
    return <span className={cx(base, 'text-ok')}>{dot('bg-ok')}En stock</span>;
}
