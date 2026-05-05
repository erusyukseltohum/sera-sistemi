const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const db = new Database("sera.db");

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  initial_password TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Aktif',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS production_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  greenhouse TEXT NOT NULL,
  parcel TEXT NOT NULL,
  crop_type TEXT NOT NULL,
  variety TEXT NOT NULL,
  planting_date TEXT,
  estimated_harvest_date TEXT,
  actual_harvest_date TEXT,
  area TEXT,
  season TEXT,
  status TEXT NOT NULL DEFAULT 'Aktif',
  entered_by TEXT NOT NULL,
  entered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS login_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_name TEXT NOT NULL,
  role TEXT NOT NULL,
  action TEXT NOT NULL,
  action_time TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`);

function seed() {
  const userCount = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
  if (userCount === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (full_name, role, initial_password, status)
      VALUES (?, ?, ?, ?)
    `);
    insertUser.run("Yönetici Kullanıcısı", "Yönetici", "123456", "Aktif");
    insertUser.run("Ahmet Yılmaz", "Saha Ekibi", "123456", "Aktif");
    insertUser.run("Zeynep Kaya", "Saha Ekibi", "123456", "Aktif");
    insertUser.run("Mehmet Demir", "Saha Ekibi", "123456", "Aktif");
    insertUser.run("Sistem Mühendisi", "Sistem Ekibi", "123456", "Aktif");
  }

  const recordCount = db.prepare("SELECT COUNT(*) AS count FROM production_records").get().count;
  if (recordCount === 0) {
    const insertRecord = db.prepare(`
      INSERT INTO production_records
      (greenhouse, parcel, crop_type, variety, planting_date, estimated_harvest_date, actual_harvest_date, area, season, status, entered_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertRecord.run("Sera 01", "A Blok", "Sebze", "Salkım Domates", "2026-03-15", "2026-06-20", null, "420 m²", "Bahar 2026", "Aktif", "Ahmet Yılmaz");
    insertRecord.run("Sera 01", "B Blok", "Sebze", "Salatalık", "2026-04-05", "2026-07-10", null, "310 m²", "Yaz 2026", "Planlandı", "Zeynep Kaya");
    insertRecord.run("Sera 03", "1. Parsel", "Sebze", "Sivri Biber", "2026-02-12", "2026-05-10", "2026-05-04", "280 m²", "Bahar 2026", "Pasif", "Mehmet Demir");
    insertRecord.run("Sera 06", "Sol Alan", "Meyve", "Çilek", "2026-03-01", "2026-05-30", null, "190 m²", "Bahar 2026", "Aktif", "Ahmet Yılmaz");
  }

  const logCount = db.prepare("SELECT COUNT(*) AS count FROM login_logs").get().count;
  if (logCount === 0) {
    const insertLog = db.prepare(`
      INSERT INTO login_logs (user_name, role, action)
      VALUES (?, ?, ?)
    `);
    insertLog.run("Ahmet Yılmaz", "Saha Ekibi", "Giriş");
    insertLog.run("Zeynep Kaya", "Saha Ekibi", "Çıkış");
    insertLog.run("Mehmet Demir", "Saha Ekibi", "Giriş");
    insertLog.run("Yönetici Kullanıcısı", "Yönetici", "Giriş");
  }
}

seed();

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/api/users", (req, res) => {
  const users = db.prepare("SELECT * FROM users ORDER BY id DESC").all();
  res.json(users);
});

app.post("/api/users", (req, res) => {
  const { full_name, role, initial_password } = req.body;

  if (!full_name || !role || !initial_password) {
    return res.status(400).json({ error: "Ad soyad, rol ve ilk şifre zorunludur." });
  }

  const result = db.prepare(`
    INSERT INTO users (full_name, role, initial_password, status)
    VALUES (?, ?, ?, 'Aktif')
  `).run(full_name, role, initial_password);

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(user);
});

app.put("/api/users/:id", (req, res) => {
  const { full_name, role, status } = req.body;
  const existing = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);

  if (!existing) {
    return res.status(404).json({ error: "Kullanıcı bulunamadı." });
  }

  db.prepare(`
    UPDATE users
    SET full_name = ?, role = ?, status = ?
    WHERE id = ?
  `).run(
    full_name || existing.full_name,
    role || existing.role,
    status || existing.status,
    req.params.id
  );

  res.json(db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id));
});

app.get("/api/records", (req, res) => {
  const { start_date, end_date, crop_type, variety } = req.query;

  let sql = "SELECT * FROM production_records WHERE 1 = 1";
  const params = [];

  if (start_date) {
    sql += " AND planting_date >= ?";
    params.push(start_date);
  }

  if (end_date) {
    sql += " AND planting_date <= ?";
    params.push(end_date);
  }

  if (crop_type) {
    sql += " AND crop_type = ?";
    params.push(crop_type);
  }

  if (variety) {
    sql += " AND lower(variety) LIKE ?";
    params.push(`%${variety.toLowerCase()}%`);
  }

  sql += " ORDER BY id DESC";

  res.json(db.prepare(sql).all(...params));
});

app.post("/api/records", (req, res) => {
  const {
    greenhouse,
    parcel,
    crop_type,
    variety,
    planting_date,
    estimated_harvest_date,
    actual_harvest_date,
    area,
    season,
    status,
    entered_by
  } = req.body;

  if (!greenhouse || !parcel || !crop_type || !variety || !entered_by) {
    return res.status(400).json({
      error: "Sera numarası, bölüm/parsel, ürün tipi, ürün çeşidi ve girişi yapan kişi zorunludur."
    });
  }

  const result = db.prepare(`
    INSERT INTO production_records
    (greenhouse, parcel, crop_type, variety, planting_date, estimated_harvest_date, actual_harvest_date, area, season, status, entered_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    greenhouse,
    parcel,
    crop_type,
    variety,
    planting_date || null,
    estimated_harvest_date || null,
    actual_harvest_date || null,
    area || null,
    season || null,
    status || "Aktif",
    entered_by
  );

  res.status(201).json(db.prepare("SELECT * FROM production_records WHERE id = ?").get(result.lastInsertRowid));
});

app.put("/api/records/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM production_records WHERE id = ?").get(req.params.id);

  if (!existing) {
    return res.status(404).json({ error: "Kayıt bulunamadı." });
  }

  const next = { ...existing, ...req.body };

  db.prepare(`
    UPDATE production_records
    SET greenhouse = ?, parcel = ?, crop_type = ?, variety = ?, planting_date = ?,
        estimated_harvest_date = ?, actual_harvest_date = ?, area = ?, season = ?,
        status = ?, entered_by = ?
    WHERE id = ?
  `).run(
    next.greenhouse,
    next.parcel,
    next.crop_type,
    next.variety,
    next.planting_date,
    next.estimated_harvest_date,
    next.actual_harvest_date,
    next.area,
    next.season,
    next.status,
    next.entered_by,
    req.params.id
  );

  res.json(db.prepare("SELECT * FROM production_records WHERE id = ?").get(req.params.id));
});

app.get("/api/login-logs", (req, res) => {
  const logs = db.prepare("SELECT * FROM login_logs ORDER BY id DESC").all();
  res.json(logs);
});

app.post("/api/login-logs", (req, res) => {
  const { user_name, role, action } = req.body;

  if (!user_name || !role || !action) {
    return res.status(400).json({ error: "Kullanıcı adı, rol ve hareket zorunludur." });
  }

  const result = db.prepare(`
    INSERT INTO login_logs (user_name, role, action)
    VALUES (?, ?, ?)
  `).run(user_name, role, action);

  res.status(201).json(db.prepare("SELECT * FROM login_logs WHERE id = ?").get(result.lastInsertRowid));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Sera izlenebilirlik sistemi çalışıyor: http://localhost:${PORT}`);
});