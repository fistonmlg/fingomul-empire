let CONFIG = { waNumber: "243975959823", siteName: "FINGOMUL_EMPIRE" };
let SERVICES = [];

const wa = (text) => "https://wa.me/" + CONFIG.waNumber + "?text=" + encodeURIComponent(text);
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const EMOJI = {
  "impression-sur-bache": "🪧", "impression-sur-vinyle": "🚗", "papier-photo": "🖼️",
  "impression-reflechissant": "⚠️", "impression-one-face-vitre": "🪟", "impression-t-shirts": "👕",
  "impression-bois-foam": "🪵", "impression-plexiglass": "✨", "impression-roche": "🪨",
  "impression-agendas": "📅", "impression-stylos": "🖊️", "impression-gourdes": "🍶",
  "impression-chapeaux": "🧢", "impression-tasses": "☕", "cartes-de-visite": "📇",
  "cartes-pvc": "💳", "autres-supports": "🎨"
};

async function loadServices() {
  if (SERVICES.length) return SERVICES;
  try { SERVICES = await (await fetch("/api/services")).json(); } catch (e) {}
  return SERVICES;
}

function media(svc) {
  if (svc.image) return `<div class="media"><img src="${esc(svc.image)}" alt="${esc(svc.name)}" loading="lazy"></div>`;
  return `<div class="media">${EMOJI[svc.slug] || "🖨️"}</div>`;
}

function card(svc) {
  return `<a class="card" href="#/service/${esc(svc.slug)}">
    ${media(svc)}
    <div class="card-body">
      <span class="tag">${esc(svc.category)}</span>
      <h3>${esc(svc.name)}</h3>
      <p>${esc((svc.description || "").slice(0, 95))}…</p>
      <span class="card-cta">Voir le service →</span>
    </div>
  </a>`;
}

function viewHome() {
  const featured = SERVICES.slice(0, 6);
  return `<section class="hero">
      <h1 class="welcome">BIENVENUE CHEZ FINGOMUL_EMPIRE</h1>
      <p class="hero-sub">Imprimerie professionnelle à Kolwezi — bâches, vinyle, papier photo, objets personnalisés, cartes et bien plus. Livraison partout en RDC.</p>
      <div class="hero-actions">
        <a class="btn" href="#/services">Consulter nos services</a>
        <a class="btn btn-wa" href="${wa("Bonjour FINGOMUL_EMPIRE, je souhaite passer une commande.")}" target="_blank" rel="noopener">Commander sur WhatsApp</a>
      </div>
    </section>
    <section class="section">
      <h2>Nos services populaires</h2>
      <div class="grid">${featured.map(card).join("")}</div>
      <p class="center"><a class="btn btn-ghost" href="#/services">Voir tous nos services</a></p>
    </section>
    <section class="section why">
      <h2>Pourquoi FINGOMUL_EMPIRE ?</h2>
      <div class="grid3">
        <div class="feature"><span>🖨️</span><h3>Impression professionnelle</h3><p>Matériel adapté et finitions soignées pour tous vos supports.</p></div>
        <div class="feature"><span>🚚</span><h3>Livraison partout en RDC</h3><p>Nous expédions vos commandes dans toutes les villes du pays.</p></div>
        <div class="feature"><span>⚡</span><h3>Réponse rapide</h3><p>Contact direct sur WhatsApp pour un devis et un suivi immédiats.</p></div>
      </div>
    </section>`;
}

function viewServices(app) {
  const cats = ["Tous", ...new Set(SERVICES.map(s => s.category))];
  app.innerHTML = `<section class="section">
      <h2>Consulter nos services</h2>
      <p class="muted">Sélectionnez un service pour voir les détails, les personnalisations possibles et passer commande.</p>
      <div class="toolbar">
        <input id="svc-search" type="search" placeholder="Rechercher un service…">
        <select id="svc-cat">${cats.map(c => `<option>${esc(c)}</option>`).join("")}</select>
      </div>
      <div id="svc-grid" class="grid"></div>
    </section>`;
  const grid = app.querySelector("#svc-grid");
  const render = () => {
    const q = (app.querySelector("#svc-search").value || "").toLowerCase();
    const c = app.querySelector("#svc-cat").value;
    const list = SERVICES.filter(s =>
      (c === "Tous" || s.category === c) && (!q || s.name.toLowerCase().includes(q)));
    grid.innerHTML = list.length ? list.map(card).join("") : `<p class="muted">Aucun service trouvé.</p>`;
  };
  app.querySelector("#svc-search").addEventListener("input", render);
  app.querySelector("#svc-cat").addEventListener("change", render);
  render();
}

function viewService(app, slug) {
  const svc = SERVICES.find(s => s.slug === slug);
  if (!svc) {
    app.innerHTML = `<section class="section"><h2>Service introuvable</h2><p><a class="back" href="#/services">← Retour aux services</a></p></section>`;
    return;
  }
  const msg = "Bonjour FINGOMUL_EMPIRE, je souhaite commander le service : " + svc.name + ".";
  app.innerHTML = `<section class="section detail">
      <a class="back" href="#/services">← Tous les services</a>
      <div class="detail-grid">
        <div>${media(svc)}</div>
        <div>
          <span class="tag">${esc(svc.category)}</span>
          <h2>${esc(svc.name)}</h2>
          <p>${esc(svc.description)}</p>
          ${svc.personalization ? `<h3>Possibilités de personnalisation</h3><p>${esc(svc.personalization)}</p>` : ""}
          ${svc.order_info ? `<h3>Informations utiles</h3><p>${esc(svc.order_info)}</p>` : ""}
          <div class="detail-actions">
            <a class="btn btn-wa" href="${wa(msg)}" target="_blank" rel="noopener">Passer une commande</a>
            <a class="btn btn-ghost" href="#/commande?service=${esc(svc.slug)}">Commander via le formulaire</a>
          </div>
        </div>
      </div>
    </section>`;
}

function viewAbout() {
  const villes = ["Kolwezi", "Lubumbashi", "Likasi", "Fungurume", "Kamina", "Kinshasa"];
  return `<section class="section narrow">
      <h2>À propos de FINGOMUL_EMPIRE</h2>
      <p><strong>FINGOMUL_EMPIRE</strong> est une imprimerie actuellement installée dans la ville de <strong>Kolwezi</strong>, dans le quartier <strong>Biashara</strong>, sur l'avenue du <strong>Manguier</strong>, en face de l'église <strong>PEVK</strong>.</p>
      <p>Notre imprimerie propose différents services d'impression et peut également <strong>expédier les commandes partout en République démocratique du Congo</strong>.</p>
      <p>Nous pouvons notamment expédier nos produits vers :</p>
      <ul class="chips">${villes.map(v => `<li>${v}</li>`).join("")}<li>Et d'autres villes de la RDC</li></ul>
      <p>Notre équipe reste disponible pour vous conseiller, produire des impressions de qualité et vous livrer, où que vous soyez.</p>
    </section>`;
}

function viewComplaint() {
  return `<section class="section narrow">
      <h2>Faire une réclamation</h2>
      <p class="muted">Décrivez le problème rencontré. Votre message est enregistré et envoyé directement sur le WhatsApp de FINGOMUL_EMPIRE ; un agent vous répondra sur cette conversation.</p>
      <form id="complaint-form" class="form">
        <label>Votre nom <input name="client_name" required placeholder="Ex : Jean Kalala"></label>
        <label>Votre numéro WhatsApp <input name="client_phone" required placeholder="Ex : 243 970 000 000"></label>
        <label>Votre réclamation <textarea name="message" rows="5" required placeholder="Décrivez votre problème…"></textarea></label>
        <button class="btn" type="submit">Envoyer ma réclamation</button>
      </form>
      <div id="complaint-ok" class="ok-box" hidden></div>
    </section>`;
}

function viewOrder(qs) {
  const preselect = qs.get("service") || "";
  const options = SERVICES.map(s =>
    `<option value="${esc(s.slug)}" ${s.slug === preselect ? "selected" : ""}>${esc(s.name)}</option>`).join("");
  return `<section class="section narrow">
      <h2>Passer une commande</h2>
      <p class="muted">Remplissez le formulaire : votre commande sera envoyée directement sur le WhatsApp de FINGOMUL_EMPIRE.</p>
      <form id="order-form" class="form">
        <label>Votre nom <input name="client_name" required placeholder="Ex : Jean Kalala"></label>
        <label>Votre numéro WhatsApp <input name="client_phone" required placeholder="Ex : 243 970 000 000"></label>
        <label>Service choisi <select name="service" required>${options}</select></label>
        <label>Quantité / dimensions <input name="quantity" placeholder="Ex : 10 pièces ou 3 m x 2 m"></label>
        <label>Détails (couleurs, texte, logo, fichier…) <textarea name="details" rows="4" placeholder="Précisez votre visuel, vos dimensions, vos délais…"></textarea></label>
        <label>Moyen de paiement
          <select name="payment_method">
            <option value="">À préciser</option>
            <option>Espèces à la livraison</option>
            <option>M-Pesa (Vodacom)</option>
            <option>Airtel Money</option>
            <option>Orange Money</option>
            <option>Virement bancaire</option>
          </select>
        </label>
        <button class="btn btn-wa" type="submit">Envoyer ma commande sur WhatsApp</button>
      </form>
      <div id="order-ok" class="ok-box" hidden></div>
    </section>`;
}

function viewContact() {
  return `<section class="section narrow">
      <h2>Contact / WhatsApp</h2>
      <div class="contact-card">
        <div class="wa-big">💬</div>
        <p><strong>WhatsApp :</strong> +243 975 959 823</p>
        <p class="muted">Réponse rapide du lundi au samedi.</p>
        <a class="btn btn-wa big" href="${wa("Bonjour FINGOMUL_EMPIRE, je vous contacte depuis votre site web.")}" target="_blank" rel="noopener">Contacter FINGOMUL_EMPIRE sur WhatsApp</a>
      </div>
      <div class="contact-card">
        <h3>Adresse</h3>
        <p>Kolwezi, quartier Biashara, avenue du Manguier, en face de l'église PEVK.</p>
        <p class="muted">Expédition des commandes partout en RDC.</p>
      </div>
    </section>`;
}

function parseHash() {
  let h = location.hash.replace(/^#/, "") || "/";
  let qs = new URLSearchParams();
  const qi = h.indexOf("?");
  if (qi >= 0) { qs = new URLSearchParams(h.slice(qi + 1)); h = h.slice(0, qi); }
  return { parts: h.split("/").filter(Boolean), qs };
}

function router() {
  const app = document.getElementById("app");
  const { parts, qs } = parseHash();
  window.scrollTo(0, 0);
  const path0 = parts[0] || "";
  if (path0 === "") app.innerHTML = viewHome();
  else if (path0 === "services") viewServices(app);
  else if (path0 === "service" && parts[1]) viewService(app, parts[1]);
  else if (path0 === "a-propos") app.innerHTML = viewAbout();
  else if (path0 === "reclamation") app.innerHTML = viewComplaint();
  else if (path0 === "commande") app.innerHTML = viewOrder(qs);
  else if (path0 === "contact") app.innerHTML = viewContact();
  else app.innerHTML = `<section class="section"><h2>Page introuvable</h2><p><a class="back" href="#/">← Retour à l'accueil</a></p></section>`;
  document.querySelectorAll(".menu a").forEach(a =>
    a.classList.toggle("active", a.getAttribute("href") === "#/" + parts.join("/") ||
      (a.getAttribute("href") === "#/service/" + parts[1] && path0 === "service")));
}

document.addEventListener("submit", async (e) => {
  if (e.target.id === "complaint-form") {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    try {
      const r = await fetch("/api/complaints", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
      });
      const j = await r.json();
      if (j.ok) {
        const msg = `Bonjour FINGOMUL_EMPIRE, je souhaite faire une réclamation.\nNom : ${data.client_name}\nTéléphone : ${data.client_phone}\nMessage : ${data.message}`;
        window.open(wa(msg), "_blank");
        document.getElementById("complaint-ok").hidden = false;
        document.getElementById("complaint-ok").textContent =
          "✅ Votre réclamation a été enregistrée et envoyée. Un agent vous répondra sur WhatsApp.";
        e.target.reset();
      } else alert("Erreur : " + (j.error || ""));
    } catch (err) { alert("Impossible d'envoyer la réclamation."); }
  }
  if (e.target.id === "order-form") {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    const svc = SERVICES.find(s => s.slug === data.service);
    const msg = `Bonjour FINGOMUL_EMPIRE, je souhaite passer une commande.\nNom : ${data.client_name}\nTéléphone : ${data.client_phone}\nService : ${svc ? svc.name : data.service}\nQuantité / dimensions : ${data.quantity || "-"}\nDétails : ${data.details || "-"}\nMoyen de paiement : ${data.payment_method || "à préciser"}`;
    try {
      const r = await fetch("/api/orders", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
      });
      const j = await r.json();
      if (j.ok) {
        window.open(wa(msg), "_blank");
        document.getElementById("order-ok").hidden = false;
        document.getElementById("order-ok").textContent =
          "✅ Votre commande a été enregistrée et envoyée sur WhatsApp. Nous vous répondrons rapidement.";
        e.target.reset();
      } else alert("Erreur : " + (j.error || ""));
    } catch (err) { alert("Impossible d'envoyer la commande."); }
  }
});

document.addEventListener("click", (e) => {
  if (e.target.closest("#burger")) document.querySelector(".menu").classList.toggle("open");
  else if (!e.target.closest(".menu")) document.querySelector(".menu")?.classList.remove("open");
});

(async function init() {
  try { CONFIG = await (await fetch("/api/config")).json(); } catch (e) {}
  document.getElementById("wa-float").href =
    wa("Bonjour " + CONFIG.siteName + ", je vous contacte depuis votre site.");
  document.getElementById("year").textContent = new Date().getFullYear();
  await loadServices();
  window.addEventListener("hashchange", router);
  router();
})();
