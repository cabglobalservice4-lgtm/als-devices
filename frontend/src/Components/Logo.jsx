import { cx } from '@/lib/format';

/** Wordmark provisoire — remplacer par le logo officiel ALS Devices (SVG) si disponible. */
export default function Logo({ dark = false, className = '' }) {
    return (
        <span className={cx('inline-flex items-center gap-2 leading-none', className)}>
            <span className="grid h-8 place-items-center rounded-[5px] bg-als px-1.5 font-display text-[22px] font-black tracking-tight text-white" style={{ fontVariationSettings: "'wdth' 62" }}>
                ALS
            </span>
            <span className={cx('text-[15px] font-bold tracking-tight', dark ? 'text-white' : 'text-ink')}>
                Devices
            </span>
        </span>
    );
}
