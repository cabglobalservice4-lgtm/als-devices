export default function Hero() {
  return (
    <section className="hero">
      <div className="container hero__inner">
        <div className="hero__text">
          <span className="chip">Nouveautés 2026</span>
          <h1>
            Le bon appareil,
            <br />
            <span className="grad">au bon prix.</span>
          </h1>
          <p>
            Laptops, smartphones, tablettes et montres connectées sélectionnés avec soin. Un conseil
            honnête, une garantie claire, une livraison rapide.
          </p>
          <div className="hero__cta">
            <a className="btn" href="#best">Voir les produits</a>
            <a className="btn btn--ghost" href="#pro">Offres entreprises</a>
          </div>
          <ul className="stats">
            <li><b>100%</b> produits testés</li>
            <li><b>48 h</b> livraison</li>
            <li><b>SAV</b> après-vente</li>
          </ul>
        </div>

        <div className="hero__visual" aria-hidden="true">
          <div className="blob"></div>
          <svg className="dev dev--laptop" viewBox="0 0 260 170">
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#6c5ce7" />
                <stop offset="1" stopColor="#00d4ff" />
              </linearGradient>
            </defs>
            <rect x="30" y="8" width="200" height="125" rx="10" fill="#10172e" stroke="#8b9cff" strokeWidth="3" />
            <rect x="40" y="18" width="180" height="105" rx="5" fill="url(#g1)" />
            <path d="M8 142h244l-14 18H22z" fill="#c7cdf5" />
          </svg>
          <svg className="dev dev--phone" viewBox="0 0 90 170">
            <defs>
              <linearGradient id="g2" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0" stopColor="#ff7a59" />
                <stop offset="1" stopColor="#6c5ce7" />
              </linearGradient>
            </defs>
            <rect x="4" y="4" width="82" height="162" rx="16" fill="#10172e" stroke="#8b9cff" strokeWidth="3" />
            <rect x="12" y="16" width="66" height="138" rx="8" fill="url(#g2)" />
          </svg>
          <svg className="dev dev--watch" viewBox="0 0 80 110">
            <rect x="24" y="0" width="32" height="110" rx="10" fill="#c7cdf5" />
            <rect x="8" y="26" width="64" height="58" rx="16" fill="#10172e" stroke="#8b9cff" strokeWidth="3" />
            <circle cx="40" cy="55" r="16" fill="none" stroke="#00d4ff" strokeWidth="4" />
          </svg>
        </div>
      </div>
    </section>
  );
}
