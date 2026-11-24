import { usePage } from '@/lib/kit';
import ShopLayout from '@/Layouts/ShopLayout';
import Seo from '@/Components/Seo';
import Icon, { WhatsAppGlyph } from '@/Components/Icon';
import { waLink } from '@/lib/format';

export default function Contact() {
    const { shop } = usePage().props;
    const items = [
        ['phone', 'Téléphone', shop.phone, `tel:${shop.phone}`],
        ['mail', 'E-mail', shop.email, `mailto:${shop.email}`],
        ['pin', 'Adresse', shop.address, `https://maps.google.com/?q=${encodeURIComponent(shop.address)}`],
        ['clock', 'Horaires', shop.hours, null],
    ];
    return (
        <ShopLayout>
            <Seo title="Contact" description={`Contactez ALS Devices : ${shop.phone}, WhatsApp, ${shop.address}.`} />
            <div className="container-als grid gap-12 py-14 lg:grid-cols-2">
                <div>
                    <h1 className="h-display text-7xl md:text-8xl">Parlons</h1>
                    <p className="mt-5 max-w-md text-lg text-graphite">Le plus rapide : WhatsApp. Envoyez le modèle qui vous intéresse, on vous répond avec photos réelles et disponibilité.</p>
                    <a href={waLink(shop.whatsapp, 'Bonjour ALS Devices !')} target="_blank" rel="noopener" className="btn-wa mt-8 px-7 py-4 text-base"><WhatsAppGlyph /> Ouvrir WhatsApp</a>
                </div>
                <ul className="grid gap-3 sm:grid-cols-2">
                    {items.map(([icon, label, value, href]) => (
                        <li key={label} className="rounded-xl bg-bone p-6">
                            <Icon name={icon} className="h-6 w-6 text-als" />
                            <p className="mt-5 text-[13px] font-semibold text-graphite">{label}</p>
                            {href ? <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener" className="mt-1 block font-display text-2xl font-black leading-tight tracking-tight hover:underline">{value}</a> : <p className="mt-1 font-display text-2xl font-black leading-tight tracking-tight">{value}</p>}
                        </li>
                    ))}
                </ul>
            </div>
        </ShopLayout>
    );
}
