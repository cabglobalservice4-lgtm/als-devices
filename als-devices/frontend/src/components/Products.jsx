import { useEffect, useState } from "react";
import { fetchProducts, fmt, waLink } from "../api.js";

const FILTERS = [
  ["all", "Tout"],
  ["laptop", "Laptops"],
  ["phone", "Téléphones"],
  ["tablet", "Tablettes"],
];

export default function Products() {
  const [filter, setFilter] = useState("all");
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ok | error

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    fetchProducts(filter)
      .then((data) => {
        if (!cancelled) {
          setItems(data);
          setStatus("ok");
        }
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, [filter]);

  return (
    <section className="section" id="best">
      <div className="container">
        <div className="section__head">
          <h2>Meilleures ventes</h2>
          <div className="filters">
            {FILTERS.map(([key, label]) => (
              <button key={key} className={filter === key ? "on" : ""} onClick={() => setFilter(key)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {status === "loading" && <p className="note">Chargement des produits…</p>}
        {status === "error" && (
          <p className="note">Les produits sont momentanément indisponibles. Contactez-nous sur WhatsApp.</p>
        )}
        {status === "ok" && items.length === 0 && <p className="note">Aucun produit dans cette catégorie.</p>}

        <div className="grid">
          {items.map((p) => (
            <article className="product" key={p.id}>
              {p.badge && <span className="badge">{p.badge}</span>}
              <div className="product__img">{p.icon}</div>
              <h3>{p.name}</h3>
              <small>{p.note}</small>
              <div className="price">
                {fmt(p.price)}
                {p.old_price && <s>{fmt(p.old_price)}</s>}
              </div>
              <a
                className="btn"
                href={waLink(`Bonjour, je suis intéressé par : ${p.name}`)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Commander
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
