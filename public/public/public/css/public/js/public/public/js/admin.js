const $ = (s) => document.querySelector(s);
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const waPhone = (p) => "https://wa.me/" + String(p || "").replace(/\D/g, "");

async function api(url, opts = {}) {
  const r = await fetch(url, {
    ...opts,
    headers: opts.body && !(opts.body instanceof FormData)
      ? { "Content-Type": "application/json" } : {}
  });
  if (r.status === 401) { showLogin(); throw new Error("auth"); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok && !j.ok) throw new Error(j.error || "Erreur");
  return j;
}

const STATUS = { new: ["Nouvelle", "badge new"], answered: ["En cours", "badge answered"], resolved: ["Résolue", "badge resolved"] };

async function checkAuth() {
  try { await api("/api/admin/me"); showDash(); } catch (e) { showLogin(); }
}
function showLogin() {
  $("#login-view").hidden = false; $("#dash-view").hidden = true;
}
function showDash() {
  $("#login-view").hidden = true; $("#dash-view").hidden = false;
  loadServices(); loadComplaints(); loadOrders();
}

$("#login-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  try {
    await api("/api/admin/login", { method: "POST", body: JSON.stringify(data) });
    showDash();
  } catch (err) {
    const el = $("#login-err"); el.hidden = false; el.textContent = "❌ Identifiants incorrects.";
  }
});
$("#logout-btn")?.addEventListener("click", async () => {
  await api("/api/admin/logout", { method: "POST" });
  showLogin();
});

document.querySelectorAll(".tabs button").forEach(btn =>
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tabs button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    ["services", "complaints", "orders"].forEach(t =>
      $("#tab-" + t).hidden = t !== btn.dataset.tab);
  })
);

let editingId = null;
async function loadServices() {
  const list = await api("/api/admin/services");
  $("#tab-services").innerHTML = `
    <div class="panel-card">
      <h3>Ajouter / modifier un service</h3>
      <form id="service-form" class="form">
        <div class="form-2col">
          <label>Nom du service <input name="name" required placeholder="Ex : Impression sur bâche"></label>
          <label>Catégorie <input name="category" list="cats" placeholder="Ex : Grand format">
            <datalist id="cats">
              <option>Grand format</option><option>Papier & photo</option><option>Textile</option>
              <option>Objets personnalisés</option><option>Cartes & badges</option>
              <option>Signalisation</option><option>Autres</option>
            </datalist>
          </label>
          <label class="full">Description <textarea name="description" rows="2" placeholder="Courte présentation du service"></textarea></label>
          <label class="full">Personnalisation <textarea name="personalization" rows="2" placeholder="Ce que le client peut personnaliser"></textarea></label>
          <label class="full">Informations utiles (commande) <textarea name="order_info" rows="2" placeholder="Délais, conseils, minimums…"></textarea></label>
          <label class="full">Image (URL) <input name="image" id="svc-image" placeholder="https://… ou laissez vide"></label>
          <label class="full">Ou téléverser une image :
            <input type="file" id="svc-file" accept="image/*">
            <img id="svc-preview" class="preview" alt="Aperçu" hidden>
          </label>
        </div>
        <div class="row-actions">
          <button class="btn" type="submit">💾 Enregistrer le service</button>
          <button class="btn btn-ghost" type="button" id="reset-form">Réinitialiser</button>
        </div>
      </form>
    </div>
    <div class="panel-card">
      <h3>Liste des services (${list.length})</h3>
      <div style="overflow-x:auto">
      <table>
        <thead><tr><th>#</th><th>Nom</th><th>Catégorie</th><th>Image</th><th>Actions</th></tr></thead>
        <tbody>
          ${list.map(s => `<tr>
            <td>${s.id}</td>
            <td><strong>${esc(s.name)}</strong></td>
            <td>${esc(s.category)}</td>
            <td>${s.image ? `<a href="${esc(s.image)}" target="_blank">Voir</a>` : "—"}</td>
            <td><div class="row-actions">
              <button class="act-edit" onclick="editService(${s.id})">Modifier</button>
              <button class="act-del" onclick="delService(${s.id})">Supprimer</button>
            </div></td>
          </tr>`).join("")}
        </tbody>
      </table>
      </div>
    </div>`;
  $("#service-form").onsubmit = saveService;
  $("#reset-form").onclick = () => { editingId = null; $("#service-form").reset(); $("#svc-preview").hidden = true; };
  $("#svc-file").onchange = uploadImage;
}

async function uploadImage(e) {
  const file = e.target.files[0];
  if (!file) return;
  const fd = new FormData();
  fd.append("image", file);
  const j = await api("/api/admin/upload", { method: "POST", body: fd });
  $("#svc-image").value = j.url;
  const p = $("#svc-preview");
  p.src = j.url; p.hidden = false;
}

async function editService(id) {
  const list = await api("/api/admin/services");
  const s = list.find(x => x.id === id);
  if (!s) return;
  editingId = id;
  const f = $("#service-form");
  f.name.value = s.name; f.category.value = s.category;
  f.description.value = s.description; f.personalization.value = s.personalization;
  f.order_info.value = s.order_info; f.image.value = s.image || "";
  const p = $("#svc-preview");
  if (s.image) { p.src = s.image; p.hidden = false; } else p.hidden = true;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function saveService(e) {
  e.preventDefault();
  const f = e.target;
  const data = {
    name: f.name.value, category: f.category.value, description: f.description.value,
    personalization: f.personalization.value, order_info: f.order_info.value, image: f.image.value
  };
  try {
    if (editingId) await api("/api/admin/services/" + editingId, { method: "PUT", body: JSON.stringify(data) });
    else await api("/api/admin/services", { method: "POST", body: JSON.stringify(data) });
    editingId = null; f.reset(); $("#svc-preview").hidden = true;
    loadServices();
    alert("✅ Service enregistré.");
  } catch (err) { alert("Erreur : " + err.message); }
}

async function delService(id) {
  if (!confirm("Supprimer ce service définitivement ?")) return;
  await api("/api/admin/services/" + id, { method: "DELETE" });
  loadServices();
}

async function loadComplaints() {
  const list = await api("/api/admin/complaints");
  const counts = { new: 0, answered: 0, resolved: 0 };
  list.forEach(c => counts[c.status] = (counts[c.status] || 0) + 1);
  $("#tab-complaints").innerHTML = `
    <div class="panel-card">
      <h3>Réclamations reçues</h3>
      <p class="muted">Non traitées : <strong>${counts.new}</strong> · En cours : ${counts.answered} · Résolues : ${counts.resolved}</p>
      <div style="overflow-x:auto">
      <table>
        <thead><tr><th>#</th><th>Client</th><th>Message</th><th>Statut</th><th>Date</th><th>Actions</th></tr></thead>
        <tbody>
          ${list.map(c => `<tr>
            <td>${c.id}</td>
            <td><strong>${esc(c.client_name)}</strong><br>${esc(c.client_phone)}</td>
            <td>${esc(c.message)}</td>
            <td><span class="${STATUS[c.status] ? STATUS[c.status][1] : "badge new"}">${STATUS[c.status] ? STATUS[c.status][0] : c.status}</span></td>
            <td>${esc(c.created_at)}</td>
            <td><div class="row-actions">
              <a class="act-wa" href="${waPhone(c.client_phone)}?text=${encodeURIComponent("Bonjour " + c.client_name + ", FINGOMUL_EMPIRE a bien reçu votre réclamation. ")}" target="_blank" rel="noopener">Répondre</a>
              <button class="act-ok" onclick="setStatus(${c.id},'answered')">En cours</button>
              <button class="act-ok" onclick="setStatus(${c.id},'resolved')">Résolue</button>
            </div></td>
          </tr>`).join("")}
        </tbody>
      </table>
      </div>
    </div>`;
}

async function setStatus(id, status) {
  await api("/api/admin/complaints/" + id, { method: "PUT", body: JSON.stringify({ status }) });
  loadComplaints();
}

async function loadOrders() {
  const list = await api("/api/admin/orders");
  $("#tab-orders").innerHTML = `
    <div class="panel-card">
      <h3>Commandes reçues (${list.length})</h3>
      <div style="overflow-x:auto">
      <table>
        <thead><tr><th>#</th><th>Client</th><th>Service</th><th>Quantité</th><th>Détails</th><th>Paiement</th><th>Date</th><th>Répondre</th></tr></thead>
        <tbody>
          ${list.map(o => `<tr>
            <td>${o.id}</td>
            <td><strong>${esc(o.client_name)}</strong><br>${esc(o.client_phone)}</td>
            <td>${esc(o.service)}</td>
            <td>${esc(o.quantity)}</td>
            <td>${esc(o.details || "—")}</td>
            <td>${esc(o.payment_method || "—")}</td>
            <td>${esc(o.created_at)}</td>
            <td><a class="act-wa" href="${waPhone(o.client_phone)}?text=${encodeURIComponent("Bonjour " + o.client_name + ", FINGOMUL_EMPIRE a bien reçu votre commande. ")}" target="_blank" rel="noopener">Répondre</a></td>
          </tr>`).join("")}
        </tbody>
      </table>
      </div>
    </div>`;
}

checkAuth();
