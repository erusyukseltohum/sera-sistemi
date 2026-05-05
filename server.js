const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let users = [
  { id: 1, full_name: "Yönetici Kullanıcısı", role: "Yönetici", status: "Aktif" },
  { id: 2, full_name: "Ahmet Yılmaz", role: "Saha Ekibi", status: "Aktif" },
  { id: 3, full_name: "Sistem Mühendisi", role: "Sistem Ekibi", status: "Aktif" }
];

let records = [
  {
    id: 1,
    greenhouse: "Sera 01",
    parcel: "A Blok",
    crop_type: "Sebze",
    variety: "Salkım Domates",
    season: "Bahar 2026",
    area: "420 m²",
    status: "Aktif",
    entered_by: "Ahmet Yılmaz",
    entered_at: "05.05.2026 09:12"
  },
  {
    id: 2,
    greenhouse: "Sera 06",
    parcel: "Sol Alan",
    crop_type: "Meyve",
    variety: "Çilek",
    season: "Bahar 2026",
    area: "190 m²",
    status: "Aktif",
    entered_by: "Ahmet Yılmaz",
    entered_at: "05.05.2026 11:20"
  }
];

let logs = [
  { id: 1, user_name: "Ahmet Yılmaz", role: "Saha Ekibi", action: "Giriş", action_time: "05.05.2026 09:02" },
  { id: 2, user_name: "Yönetici Kullanıcısı", role: "Yönetici", action: "Giriş", action_time: "05.05.2026 14:05" }
];

app.get("/api/users", (req, res) => res.json(users));

app.post("/api/users", (req, res) => {
  const user = { id: users.length + 1, status: "Aktif", ...req.body };
  users.push(user);
  res.status(201).json(user);
});

app.get("/api/records", (req, res) => {
  const { crop_type, variety } = req.query;

  let result = records;

  if (crop_type) {
    result = result.filter(r => r.crop_type === crop_type);
  }

  if (variety) {
    result = result.filter(r => r.variety.toLowerCase().includes(variety.toLowerCase()));
  }

  res.json(result);
});

app.post("/api/records", (req, res) => {
  const record = {
    id: records.length + 1,
    entered_at: new Date().toLocaleString("tr-TR"),
    ...req.body
  };
  records.push(record);
  res.status(201).json(record);
});

app.put("/api/records/:id", (req, res) => {
  const id = Number(req.params.id);
  records = records.map(r => r.id === id ? { ...r, ...req.body } : r);
  res.json(records.find(r => r.id === id));
});

app.get("/api/login-logs", (req, res) => res.json(logs));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Sera sistemi çalışıyor: ${PORT}`);
});