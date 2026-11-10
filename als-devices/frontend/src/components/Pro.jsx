import { useState } from "react";
import { sendQuote, waLink } from "../api.js";

export default function Pro() {
  const [form, setForm] = useState({ name: "", phone: "", need: "Laptops", quantity: 5 });
  const [state, setState] = useState({ status: "idle", message: "" });

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setState({ status: "sending", message: "" });
    try {
      await sendQuote({ ...form, quantity: Number(form.quantity) });
      setState({ status: "ok", message: "Demande envoyée. Nous vous répondons sous 24 h." });
      const msg =
        `Demande de devis ALS Connect\nNom/Société : ${form.name}\nTéléphone : ${form.phone}\n` +
        `Besoin : ${form.need}\nQuantité : ${form.quantity}`;
      window.open(waLink(msg), "_blank", "noopener");
    } catch (err) {
      setState({ status: "error", message: err.message });
    }
  }

  return (
    <section className="section section--dark" id="pro">
      <div className="container pro">
        <div>
          <span className="chip chip--light">ALS Connect · B2B</span>
          <h2>Équipez votre entreprise</h2>
          <p>Achats en volume, devis rapide, assistance et conseil sur mesure pour vos équipes.</p>
          <ul className="checks">
            <li>Devis sous 24 h</li>
            <li>Tarifs dégressifs</li>
            <li>Installation et assistance</li>
          </ul>
        </div>

        <form className="card form" onSubmit={submit}>
          <label>
            Nom / Société
            <input value={form.name} onChange={set("name")} required minLength={2} />
          </label>
          <label>
            Téléphone
            <input value={form.phone} onChange={set("phone")} required minLength={6} />
          </label>
          <label>
            Besoin
            <select value={form.need} onChange={set("need")}>
              <option>Laptops</option>
              <option>Smartphones</option>
              <option>Tablettes</option>
              <option>Autre</option>
            </select>
          </label>
          <label>
            Quantité
            <input type="number" min="1" value={form.quantity} onChange={set("quantity")} required />
          </label>
          <button className="btn" type="submit" disabled={state.status === "sending"}>
            {state.status === "sending" ? "Envoi…" : "Demander un devis"}
          </button>
          {state.message && (
            <p className={`form__msg form__msg--${state.status}`} role="status">
              {state.message}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
