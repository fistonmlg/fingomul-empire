require("dotenv").config();
const express = require("express");
const session = require("express-session");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;
const WA_NUMBER = process.env.WA_NUMBER || "243975959823";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || "fingomul-secret",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 }
}));

const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_"))
});
const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } });

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(uploadDir));

const isAdmin = (req, res, next) =>
  req.session && req.session.admin ? next() : res.status(401).json({ error: "Non autorisé" });

app.get("/api/config", (req, res) =>
  res.json({ waNumber: WA_NUMBER, siteName: "FINGOMUL_EMPIRE" })
);

app.get("/api/services", (req, res) =>
  res.json(db.prepare("SELECT * FROM services ORDER BY id ASC").all())
);
app.get("/api/services/:slug", (req, res) => {
  const row = db.prepare("SELECT * FROM services WHERE slug = ?").get(req.params.slug);
  if (!row) return res.status(404).json({ error: "Service introuvable" });
  res.json(row);
});

app.post("/api/complaints", (req, res) => {
  const { client_name, client_phone, message } = req.body;
  if (!client_name || !client_phone || !message)
    return res.status(400).json({ error: "Champs manquants" });
  const info = db.prepare(
    "INSERT INTO complaints (client_name, client_phone, message) VALUES (?, ?, ?)"
  ).run(client_name, client_phone, message);
  res.json({ ok: true, id: info.lastInsertRowid });
});

app.post("/api/orders", (req, res) => {
  const { client_name, client_phone, service, quantity, details, payment_method } = req.body;
  if (!client_name || !client_phone || !service)
    return res.status(400).json({ error: "Champs manquants" });
  const info = db.prepare(
    "INSERT INTO orders (client_name, client_phone, service, quantity, details, payment_method) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(client_name, client_phone, service, quantity || "1", details || "", payment_method || "");
  res.json({ ok: true, id: info.lastInsertRowid });
});

app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  const admin = db.prepare("SELECT * FROM admins WHERE username = ?").get(username || "");
  if (!admin || !bcrypt.compareSync(password || "", admin.password_hash))
    return res.status(401).json({ error: "Identifiants incorrects" });
  req.session.admin = { id: admin.id, username: admin.username };
  res.json({ ok: true });
});
app.post("/api/admin/logout", (req, res) =>
  req.session.destroy(() => res.json({ ok: true }))
);
app.get("/api/admin/me", isAdmin, (req, res) =>
  res.json({ username: req.session.admin.username })
);

app.get("/api/admin/services", isAdmin, (req, res) =>
  res.json(db.prepare("SELECT * FROM services ORDER BY id ASC").all())
);
app.post("/api/admin/services", isAdmin, (req, res) => {
  const { name, slug, category, description, personalization, order_info, image } = req.body;
  if (!name) return res.status(400).json({ error: "Le nom est requis" });
  const s = slug || name.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const info = db.prepare(
    "INSERT INTO services (name, slug, category, description, personalization, order_info, image) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(name, s, category || "Autres", description || "", personalization || "", order_info || "", image || "");
  res.json({ ok: true, id: info.lastInsertRowid });
});
app.put("/api/admin/services/:id", isAdmin, (req, res) => {
  const { name, category, description, personalization, order_info, image } = req.body;
  db.prepare(
    "UPDATE services SET name=?, category=?, description=?, personalization=?, order_info=?, image=? WHERE id=?"
  ).run(name, category || "Autres", description || "", personalization || "", order_info || "", image || "", req.params.id);
  res.json({ ok: true });
});
app.delete("/api/admin/services/:id", isAdmin, (req, res) => {
  db.prepare("DELETE FROM services WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});
app.post("/api/admin/upload", isAdmin, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Aucun fichier" });
  res.json({ url: "/uploads/" + req.file.filename });
});

app.get("/api/admin/complaints", isAdmin, (req, res) =>
  res.json(db.prepare("SELECT * FROM complaints ORDER BY created_at DESC").all())
);
app.put("/api/admin/complaints/:id", isAdmin, (req, res) => {
  db.prepare("UPDATE complaints SET status=?, updated_at=datetime('now') WHERE id=?")
    .run(req.body.status || "new", req.params.id);
  res.json({ ok: true });
});
app.get("/api/admin/orders", isAdmin, (req, res) =>
  res.json(db.prepare("SELECT * FROM orders ORDER BY created_at DESC").all())
);

app.listen(PORT, () =>
  console.log("FINGOMUL_EMPIRE démarré : http://localhost:" + PORT)
);
