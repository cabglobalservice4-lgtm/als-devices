import { waLink } from "../api.js";

export function Trust() {
  const items = [
    ["✓", "Produits authentiques", "Neufs et reconditionnés vérifiés"],
    ["⚡", "Livraison rapide", "Dakar et régions"],
    ["🛡", "Garantie", "Sur chaque appareil"],
    ["💬", "Conseil gratuit", "Par WhatsApp"],
  ];
  return (
    <section className="trust">
      <div className="container trust__grid">
        {items.map(([ico, title, sub]) => (
          <div key={title}>
            <span className="ico">{ico}</span>
            <b>{title}</b>
            <small>{sub}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Categories() {
  const cats = [
    ["a", "💻", "Laptops", "Travail, études, gaming"],
    ["b", "📱", "Smartphones", "Toutes les grandes marques"],
    ["c", "📲", "Tablettes", "Pour créer et se divertir"],
    ["d", "⌚", "Montres & accessoires", "Chargeurs, coques, écouteurs"],
  ];
  return (
    <section className="section" id="categories">
      <div className="container">
        <h2>Acheter par catégorie</h2>
        <div className="cats">
          {cats.map(([k, ico, title, sub]) => (
            <a key={k} className={`cat cat--${k}`} href="#best">
              <span>{ico}</span>
              <h3>{title}</h3>
              <small>{sub}</small>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Promo() {
  return (
    <section className="container">
      <div className="promo">
        <div>
          <span className="chip chip--light">Offre du moment</span>
          <h2>Reprise de votre ancien téléphone</h2>
          <p>Échangez votre ancien appareil et réduisez le prix de votre prochain achat.</p>
        </div>
        <a
          className="btn btn--white"
          href={waLink("Bonjour, je voudrais estimer mon ancien appareil pour une reprise.")}
          target="_blank"
          rel="noopener noreferrer"
        >
          Estimer mon appareil
        </a>
      </div>
    </section>
  );
}

export function Contact() {
  return (
    <section className="section" id="contact">
      <div className="container contact">
        <h2>Une question ? Parlons-en.</h2>
        <p>Écrivez-nous, on vous répond rapidement.</p>
        <div className="hero__cta">
          <a className="btn" href={waLink()} target="_blank" rel="noopener noreferrer">WhatsApp</a>
          <a className="btn btn--ghost" href="#">Facebook</a>
          <a className="btn btn--ghost" href="#">TikTok</a>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <>
      <footer className="footer">
        <div className="container footer__inner">
          <span>© 2026 ALS Devices · ALS Connect</span>
          <span>Dakar, Sénégal</span>
        </div>
      </footer>
      <a className="wa-float" href={waLink()} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
        💬
      </a>
    </>
  );
}
