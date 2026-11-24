import { Link } from '@/lib/kit';
import DeviceArt from './DeviceArt';
import { ConditionPill, StockLine } from './Badges';
import { cx, useMoney } from '@/lib/format';
import { route } from '@/lib/routes';

/**
 * Carte produit : la photo posée sur le « comptoir » gris, puis les infos en texte libre.
 * `feature` = grande carte (mise en avant sur l'accueil).
 */
export default function ProductCard({ product, priority = false, feature = false, className = '' }) {
    const money = useMoney();
    const discount = product.compare_at_price ? Math.round((1 - product.price / product.compare_at_price) * 100) : null;

    return (
        <Link href={route('products.show', product.slug)} className={cx('group flex flex-col', className)}>
            <div className={cx('relative overflow-hidden rounded-xl bg-bone transition-colors group-hover:bg-bone-200', feature ? 'aspect-square lg:aspect-auto lg:flex-1' : 'aspect-[4/5]')}>
                {product.image ? (
                    <img src={product.image} alt={product.name} loading={priority ? 'eager' : 'lazy'} decoding="async"
                        className={cx('absolute inset-0 h-full w-full object-contain mix-blend-multiply transition duration-500 group-hover:scale-[1.03]', feature ? 'p-10 lg:p-16' : 'p-6')} />
                ) : (
                    <div className={cx('absolute inset-0 transition duration-500 group-hover:scale-[1.03]', feature ? 'p-12 lg:p-20' : 'p-8')}>
                        <DeviceArt type={product.category_icon} color={product.colors?.[0]?.hex} />
                    </div>
                )}

                <div className="absolute left-3 top-3"><ConditionPill condition={product.condition} grade={product.grade} /></div>

                {discount > 0 && (
                    <span className="tag-hole absolute right-0 top-4 rounded-l-md bg-als py-1.5 pl-7 pr-3 font-display text-lg font-black leading-none text-white">
                        −{discount}%
                    </span>
                )}

                {product.battery_health && (
                    <span className="absolute bottom-3 left-3 rounded-[4px] bg-white px-2 py-1 text-xs font-semibold">
                        Batterie {product.battery_health}%
                    </span>
                )}
                {!product.in_stock && <div className="absolute inset-0 bg-white/60" />}
            </div>

            <div className="flex flex-col gap-1 pt-3">
                <p className="flex items-center justify-between gap-2 text-[13px] text-graphite">
                    <span className="truncate">{[product.brand, product.storages?.join(', ')].filter(Boolean).join(' – ')}</span>
                    {product.colors?.length > 0 && (
                        <span className="flex shrink-0 -space-x-1">
                            {product.colors.slice(0, 4).map((c) => (
                                <span key={c.hex} title={c.name} className="h-3.5 w-3.5 rounded-full border-2 border-white ring-1 ring-ink/15" style={{ background: c.hex }} />
                            ))}
                        </span>
                    )}
                </p>
                <h3 className={cx('font-bold leading-snug tracking-tight group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4', feature ? 'text-xl md:text-2xl' : 'text-[16px]')}>
                    {product.name}
                </h3>
                <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
                    {product.has_options && <span className="text-xs text-graphite">dès</span>}
                    <span className={cx('font-display font-black leading-none tracking-tight', feature ? 'text-4xl md:text-5xl' : 'text-[26px]')}>{money(product.price)}</span>
                    {product.compare_at_price && <span className="text-sm text-graphite line-through">{money(product.compare_at_price)}</span>}
                </p>
                <div className="mt-1"><StockLine inStock={product.in_stock} low={product.low_stock} unique={product.is_unique} /></div>
            </div>
        </Link>
    );
}
