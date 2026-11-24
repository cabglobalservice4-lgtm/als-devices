import { Link } from '@/lib/kit';
import DeviceArt from './DeviceArt';
import { ConditionPill, StockLine } from './Badges';
import { useMoney } from '@/lib/format';
import { route } from '@/lib/routes';

export default function ProductCard({ product, priority = false }) {
    const money = useMoney();
    const discount = product.compare_at_price ? Math.round((1 - product.price / product.compare_at_price) * 100) : null;

    return (
        <Link
            href={route('products.show', product.slug)}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-bone-200 bg-white transition hover:-translate-y-0.5 hover:border-ink hover:shadow-tag"
        >
            <div className="relative aspect-[4/5] bg-bone">
                {product.image ? (
                    <img src={product.image} alt={product.name} loading={priority ? 'eager' : 'lazy'} decoding="async" className="h-full w-full object-contain p-6 mix-blend-multiply transition duration-500 group-hover:scale-[1.04]" />
                ) : (
                    <div className="h-full w-full p-8 transition duration-500 group-hover:scale-[1.04]">
                        <DeviceArt type={product.category_icon} color={product.colors?.[0]?.hex} />
                    </div>
                )}
                <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
                    <ConditionPill condition={product.condition} grade={product.grade} />
                    {discount > 0 && <span className="rounded-full bg-white px-2.5 py-1 font-mono text-[11px] font-semibold text-als">−{discount}%</span>}
                </div>
                {product.battery_health && (
                    <span className="absolute bottom-3 left-3 rounded-md bg-white/90 px-2 py-1 font-mono text-[11px] font-semibold backdrop-blur">
                        Batterie {product.battery_health}%
                    </span>
                )}
                {!product.in_stock && <div className="absolute inset-0 bg-white/60" />}
            </div>

            <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-center justify-between gap-2">
                    <span className="eyebrow text-graphite">{product.brand}</span>
                    {product.colors?.length > 0 && (
                        <span className="flex -space-x-1">
                            {product.colors.slice(0, 4).map((c) => (
                                <span key={c.hex} title={c.name} className="h-3.5 w-3.5 rounded-full border-2 border-white ring-1 ring-ink/15" style={{ background: c.hex }} />
                            ))}
                        </span>
                    )}
                </div>
                <h3 className="font-display text-[17px] font-bold leading-snug tracking-tight">{product.name}</h3>
                {product.storages?.length > 0 && <p className="font-mono text-xs text-graphite">{product.storages.join(' · ')}</p>}
                <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                    <div>
                        {product.has_options && <span className="block text-[11px] text-graphite">à partir de</span>}
                        <span className="font-display text-xl font-extrabold tracking-tight">{money(product.price)}</span>
                        {product.compare_at_price && <span className="ml-2 text-xs text-graphite line-through">{money(product.compare_at_price)}</span>}
                    </div>
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-white transition group-hover:bg-als">
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                    </span>
                </div>
                <StockLine inStock={product.in_stock} low={product.low_stock} unique={product.is_unique} />
            </div>
        </Link>
    );
}
