import { useLocation } from 'react-router-dom';
import { Link } from '@/lib/kit';
import { cx } from '@/lib/format';

/** Les liens de pagination de Laravel pointent vers l'API : on garde leur query string sur l'adresse du site. */
export default function Pagination({ links }) {
    const { pathname } = useLocation();
    if (!links || links.length <= 3) return null;
    const toFront = (url) => pathname + new URL(url, 'http://x').search;

    return (
        <nav className="mt-10 flex flex-wrap items-center justify-center gap-1.5" aria-label="Pagination">
            {links.map((l, i) => {
                const label = l.label.replace('&laquo; Previous', '←').replace('Next &raquo;', '→').replace('&laquo;', '←').replace('&raquo;', '→');
                return l.url ? (
                    <Link key={i} href={toFront(l.url)} className={cx('min-w-10 rounded-full px-3.5 py-2 text-center text-sm font-medium', l.active ? 'bg-ink text-white' : 'hover:bg-bone')} dangerouslySetInnerHTML={{ __html: label }} />
                ) : (
                    <span key={i} className="min-w-10 px-3.5 py-2 text-center text-sm text-graphite/50" dangerouslySetInnerHTML={{ __html: label }} />
                );
            })}
        </nav>
    );
}
