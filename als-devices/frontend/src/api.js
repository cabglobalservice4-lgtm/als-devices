export const API_URL = import.meta.env.VITE_API_URL || "/api";
export const WHATSAPP = import.meta.env.VITE_WHATSAPP || "221XXXXXXXXX";

export const fmt = (n) => Number(n).toLocaleString("fr-FR") + " FCFA";

export const waLink = (text) =>
  `https://wa.me/${WHATSAPP}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

export async function fetchProducts(category = "all") {
  const q = category === "all" ? "" : `?category=${encodeURIComponent(category)}`;
  const res = await fetch(`${API_URL}/products${q}`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Impossible de charger les produits");
  const json = await res.json();
  return json.data ?? json;
}

export async function sendQuote(payload) {
  const res = await fetch(`${API_URL}/quotes`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Erreur lors de l'envoi");
  }
  return res.json();
}
