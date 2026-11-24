import ShopLayout from '@/Layouts/ShopLayout';
import Seo from '@/Components/Seo';

export default function Page({ page }) {
    return (
        <ShopLayout>
            <Seo title={page.title} description={page.meta_description} />
            <article className="container-als max-w-3xl py-14">
                <h1 className="h-display text-5xl md:text-6xl">{page.title}</h1>
                <p className="eyebrow mt-4 text-graphite">Mis à jour le {page.updated_at}</p>
                <div className="prose-als mt-8" dangerouslySetInnerHTML={{ __html: page.html }} />
            </article>
        </ShopLayout>
    );
}
