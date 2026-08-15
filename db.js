require("dotenv").config();
const Database = require("better-sqlite3");
const path = require("path");
const bcrypt = require("bcryptjs");

const dbFile = process.env.DB_PATH || path.join(__dirname, "fingomul.db");
const db = new Database(dbFile);
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT DEFAULT 'Autres',
  description TEXT DEFAULT '',
  personalization TEXT DEFAULT '',
  order_info TEXT DEFAULT '',
  image TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS complaints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  service TEXT NOT NULL,
  quantity TEXT DEFAULT '1',
  details TEXT DEFAULT '',
  payment_method TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);
`);

const adminUser = process.env.ADMIN_USER || "admin";
const adminPass = process.env.ADMIN_PASS || "admin123";
const existing = db.prepare("SELECT id FROM admins WHERE username = ?").get(adminUser);
if (!existing) {
  db.prepare("INSERT INTO admins (username, password_hash) VALUES (?, ?)")
    .run(adminUser, bcrypt.hashSync(adminPass, 10));
  console.log("Compte admin créé : " + adminUser);
}

const seedServices = [
  { name: "Impression sur bâche (toute dimension)", slug: "impression-sur-bache", category: "Grand format",
    description: "Impression grand format sur bâche, idéale pour les enseignes, banderoles, affiches publicitaires et décors d'événements. Disponible en toutes dimensions.",
    personalization: "Choix des dimensions, des couleurs, du texte, du logo et des visuels. Finition avec œillets ou ourlets sur demande.",
    order_info: "Envoyez-nous votre visuel ou décrivez votre besoin : nous produisons rapidement. Délai selon la dimension." },
  { name: "Impression sur vinyle", slug: "impression-sur-vinyle", category: "Grand format",
    description: "Supports en vinyle autocollant ou adhésif pour vitrines, véhicules, murs et sols. Résistant aux intempéries.",
    personalization: "Vinyle blanc, transparent ou réfléchissant ; découpe personnalisée ; pose sur vitre possible.",
    order_info: "Précisez le support (vitre, véhicule, mur, sol) et les dimensions." },
  { name: "Papier photo (A4, A3, A2, A1, A0)", slug: "papier-photo", category: "Papier & photo",
    description: "Tirages photo haute qualité sur papier brillant ou mat, du format A4 au très grand format A0.",
    personalization: "Format, finition brillante ou mate, encadrement sur demande.",
    order_info: "Apportez vos images en haute définition pour un rendu optimal." },
  { name: "Impression sur réfléchissant", slug: "impression-reflechissant", category: "Signalisation",
    description: "Plaques et supports réfléchissants pour signalisation, plaques d'immatriculation et panneaux de sécurité.",
    personalization: "Dimensions, couleurs réglementaires, texte et numéros personnalisés.",
    order_info: "Indiquez le type de panneau ou de signalisation souhaité." },
  { name: "Impression one face (à mettre sur la vitre)", slug: "impression-one-face-vitre", category: "Grand format",
    description: "Impression one face spéciale vitrine : visible depuis l'extérieur sans gêner la vision depuis l'intérieur.",
    personalization: "Design, dimensions de la vitre, couleurs, texte et logo.",
    order_info: "Mesurez votre vitre avant de commander pour un ajustement parfait." },
  { name: "Impression sur T-shirts", slug: "impression-t-shirts", category: "Textile",
    description: "Impression textile sur T-shirts et vêtements, pour équipes, événements, associations et entreprises.",
    personalization: "Couleurs, tailles (S à XXL), texte, logo et quantité.",
    order_info: "Commandes en série possibles. Précisez le nombre de pièces et les tailles." },
  { name: "Impression sur bois ou foam (toute dimension)", slug: "impression-bois-foam", category: "Grand format",
    description: "Impression sur panneaux de bois, bois stratifié et mousse PVC (foam) de toute dimension.",
    personalization: "Épaisseur du panneau, dimensions, finitions et fixations.",
    order_info: "Idéal pour enseignes, logos muraux et décoration." },
  { name: "Impression sur plexiglass", slug: "impression-plexiglass", category: "Grand format",
    description: "Impression sur plaque de plexiglas (PMMA) pour une finition moderne et élégante, rétroéclairage possible.",
    personalization: "Épaisseur, transparence, couleurs et trous de fixation.",
    order_info: "Pour enseignes lumineuses ou décor premium, précisez vos dimensions." },
  { name: "Impression sur roche", slug: "impression-roche", category: "Objets personnalisés",
    description: "Impression sur pierre naturelle ou reconstituée : plaques commémoratives, décorations.",
    personalization: "Type de roche, dimensions, texte et impression couleur.",
    order_info: "Photographiez le support ou précisez le type de pierre." },
  { name: "Impression sur agendas", slug: "impression-agendas", category: "Papier & photo",
    description: "Agendas personnalisés avec votre logo, vos photos ou vos messages, pour offrir ou pour votre entreprise.",
    personalization: "Format, couverture, pages intérieures, logo et texte.",
    order_info: "Commandez avant la fin de l'année pour la rentrée." },
  { name: "Impression sur stylos (bic)", slug: "impression-stylos", category: "Objets personnalisés",
    description: "Stylos publicitaires personnalisés à votre marque, parfaits comme cadeaux d'entreprise.",
    personalization: "Couleur du stylo, logo, texte et quantité.",
    order_info: "Quantité minimale conseillée : 50 pièces." },
  { name: "Impression sur gourdes", slug: "impression-gourdes", category: "Objets personnalisés",
    description: "Gourdes personnalisées pour le sport, les événements et les entreprises.",
    personalization: "Couleur, capacité, logo et texte.",
    order_info: "Précisez le modèle et la quantité." },
  { name: "Impression sur chapeaux", slug: "impression-chapeaux", category: "Textile",
    description: "Chapeaux et casquettes brodés ou imprimés à vos couleurs.",
    personalization: "Couleur, taille, logo (impression ou broderie).",
    order_info: "Commandes en série pour équipes et événements." },
  { name: "Impression sur tasses (normales et magiques)", slug: "impression-tasses", category: "Objets personnalisés",
    description: "Tasses personnalisées classiques ou magiques (qui changent de couleur avec la chaleur).",
    personalization: "Couleur, type (normale ou magique), photo, texte et logo.",
    order_info: "Idéal pour cadeaux, souvenirs et articles promotionnels." },
  { name: "Cartes de visite", slug: "cartes-de-visite", category: "Cartes & badges",
    description: "Cartes de visite professionnelles sur papier couché, pelliculé, avec finitions premium.",
    personalization: "Format, papier, finition (mate, brillante, pelliculage), texte et logo.",
    order_info: "Minimum 100 cartes. Fournissez votre logo en haute qualité." },
  { name: "Cartes PVC", slug: "cartes-pvc", category: "Cartes & badges",
    description: "Cartes en PVC rigide : cartes de membres, badges, cartes de fidélité.",
    personalization: "Format carte de crédit, code-barres, photo, numérotation.",
    order_info: "Précisez la quantité et les éléments à imprimer." },
  { name: "Autres supports (sur demande)", slug: "autres-supports", category: "Autres",
    description: "Un besoin particulier ? Nous étudions tous types de supports et de formats selon vos exigences.",
    personalization: "Décrivez votre projet : support, dimensions, quantité, délai.",
    order_info: "Contactez-nous via WhatsApp pour discuter de votre projet." }
];

const count = db.prepare("SELECT COUNT(*) AS n FROM services").get().n;
if (count === 0) {
  const ins = db.prepare(
    "INSERT INTO services (name, slug, category, description, personalization, order_info) VALUES (?, ?, ?, ?, ?, ?)"
  );
  seedServices.forEach(s => ins.run(s.name, s.slug, s.category, s.description, s.personalization, s.order_info));
  console.log(seedServices.length + " services par défaut créés.");
}

module.exports = db;
