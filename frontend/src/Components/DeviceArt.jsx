/**
 * Illustration vectorielle d'appareil, affichée tant qu'un produit
 * n'a pas encore de vraie photo. Légère (aucune image à charger).
 */
export default function DeviceArt({ type = 'phone', color = '#1F2228', className = 'h-full w-full' }) {
    const body = color || '#1F2228';
    const common = { className, viewBox: '0 0 200 200', role: 'img', 'aria-hidden': true };

    switch (type) {
        case 'tablet':
            return (
                <svg {...common}>
                    <rect x="38" y="22" width="124" height="160" rx="14" fill={body} />
                    <rect x="45" y="29" width="110" height="146" rx="8" fill="#0B0B0C" />
                    <rect x="45" y="29" width="110" height="146" rx="8" fill="url(#gt)" />
                    <circle cx="100" cy="25.5" r="1.6" fill="#555" />
                    <defs><linearGradient id="gt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#4a4a52" /><stop offset=".55" stopColor="#111" /><stop offset="1" stopColor="#2c2c31" /></linearGradient></defs>
                </svg>
            );
        case 'laptop':
            return (
                <svg {...common}>
                    <rect x="34" y="48" width="132" height="88" rx="7" fill={body} />
                    <rect x="40" y="54" width="120" height="76" rx="3" fill="url(#gl)" />
                    <path d="M18 140h164l-8 12H26l-8-12Z" fill={body} />
                    <rect x="86" y="140" width="28" height="4" rx="2" fill="#000" opacity=".25" />
                    <defs><linearGradient id="gl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#4a4a52" /><stop offset=".6" stopColor="#0d0d0f" /><stop offset="1" stopColor="#2c2c31" /></linearGradient></defs>
                </svg>
            );
        case 'watch':
            return (
                <svg {...common}>
                    <path d="M78 20h44l-4 40H82l-4-40ZM82 140h36l4 40H78l4-40Z" fill={body} opacity=".85" />
                    <rect x="62" y="52" width="76" height="96" rx="24" fill={body} />
                    <rect x="69" y="59" width="62" height="82" rx="18" fill="#0B0B0C" />
                    <circle cx="100" cy="100" r="22" fill="none" stroke="#E10600" strokeWidth="5" strokeDasharray="100 140" strokeLinecap="round" />
                    <rect x="138" y="88" width="5" height="16" rx="2" fill={body} />
                </svg>
            );
        case 'accessory':
            return (
                <svg {...common}>
                    <path d="M62 60c0-22 76-22 76 0v56c0 18-10 30-24 30h-28c-14 0-24-12-24-30V60Z" fill={body} />
                    <rect x="88" y="146" width="24" height="10" rx="3" fill={body} />
                    <path d="M100 156v24" stroke={body} strokeWidth="6" strokeLinecap="round" />
                    <path d="M92 84h16l-10 18h12l-18 22 4-16H86l6-24Z" fill="#E10600" />
                </svg>
            );
        default:
            return (
                <svg {...common}>
                    <rect x="58" y="14" width="84" height="172" rx="18" fill={body} />
                    <rect x="63" y="19" width="74" height="162" rx="13" fill="url(#gp)" />
                    <rect x="88" y="25" width="24" height="7" rx="3.5" fill="#000" />
                    <defs><linearGradient id="gp" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#4a4a52" /><stop offset=".55" stopColor="#0e0e10" /><stop offset="1" stopColor="#2c2c31" /></linearGradient></defs>
                </svg>
            );
    }
}
