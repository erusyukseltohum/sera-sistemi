# Sera İzlenebilirlik Sistemi - Backend Demo

Bu paket, önceki HTML prototipinin gerçek backend'e taşınmış ilk versiyonudur.

## İçerik

- Express.js backend
- SQLite veritabanı
- Kullanıcı oluşturma
- İlk şifre atama
- Üretim kaydı oluşturma
- Yönetici ekranında kayıt filtreleme
- Sistem yöneticisi ekranında kullanıcı ve veri yönetimi
- Kullanıcı giriş/çıkış hareketleri listesi

## Kurulum

Önce Node.js kurulu olmalı.

Terminal / Komut İstemi:

```bash
npm install
npm start
```

Sonra tarayıcıdan aç:

```text
http://localhost:3000
```

## Dosya Yapısı

```text
sera_backend_demo/
  server.js
  package.json
  public/
    index.html
```

## Önemli Not

Bu demo ilk şifreyi düz metin saklar. Gerçek canlı sistemde:
- şifreler hashlenmeli,
- gerçek login yapılmalı,
- JWT/session yapısı kurulmalı,
- rol bazlı yetkilendirme backend tarafında zorunlu tutulmalıdır.