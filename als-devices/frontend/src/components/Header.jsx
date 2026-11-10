import { useState } from "react";
import { waLink } from "../api.js";

export default function Header() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <div className="announce">
        Livraison rapide à Dakar · Garantie incluse · Commandez aussi sur WhatsApp
      </div>
      <header className="nav">
        <div className="container nav__inner">
          <a href="#" className="logo">
            <span className="logo__mark">A</span> ALS <b>Devices</b>
          </a>
          <nav className={`menu ${open ? "open" : ""}`} onClick={close}>
            <a href="#categories">Catégories</a>
            <a href="#best">Meilleures ventes</a>
            <a href="#pro">Entreprises</a>
            <a href="#contact">Contact</a>
          </nav>
          <a className="btn btn--small" href={waLink()} target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>
          <button className="burger" aria-label="Menu" onClick={() => setOpen(!open)}>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>
    </>
  );
}
