import { cx } from '@/lib/format';

/** Wordmark provisoire — remplacer par le logo officiel ALS Devices (SVG) si disponible. */
export default function Logo({ dark = false, className = '' }) {
    return (
        <span className={cx('inline-flex items-end gap-2 leading-none', className)}>
            <span className={cx('font-display text-[26px] font-extrabold tracking-tightest', dark ? 'text-white' : 'text-ink')}>
                ALS
                <span className="ml-[2px] inline-block h-[7px] w-[7px] translate-y-[-1px] bg-als" />
            </span>
            <span className={cx('pb-[3px] font-mono text-[10px] font-semibold uppercase tracking-[0.28em]', dark ? 'text-white/70' : 'text-graphite')}>
                Devices
            </span>
        </span>
    );
}
