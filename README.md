# Veriface

Aplikasi absensi dengan pengenalan wajah. Aplikasi terdiri dari:

- `ai-service`: layanan pengenalan wajah (FastAPI).
- `backend`: API dan database (Node.js/Express).
- `frontend`: tampilan web (React/Vite).

## Persyaratan

- Windows
- Node.js 18 atau lebih baru
- Python 3.10 atau lebih baru
- PostgreSQL 15 atau lebih baru

## Instalasi pertama kali

Jalankan perintah berikut dari folder proyek:

```powershell
npm --prefix backend install
npm --prefix frontend install
python -m venv venv
venv\Scripts\python.exe -m pip install -r ai-service\requirements.txt
```

Salin `.env.example` menjadi `.env`, lalu isi nilai rahasia dan koneksi
PostgreSQL. Jangan commit file `.env`. Generate nilai acak untuk
`ENCRYPTION_KEY` dan `SESSION_SECRET`, misalnya:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Simpan `ENCRYPTION_KEY` secara permanen setelah data terenkripsi dibuat.
Mengganti nilai tersebut akan membuat data lama tidak dapat didekripsi.

Buat database PostgreSQL sesuai `PGDATABASE`, lalu jalankan schema:

```powershell
psql -U "$env:PGUSER" -d "$env:PGDATABASE" -f "backend\schema.sql"
```

Semua service membaca konfigurasi dari `.env` di root repository. `DATABASE_URL`
dapat digunakan sebagai alternatif pengaturan `PG*`; `PGPASSWORD` tidak memiliki
nilai default.

## Menjalankan aplikasi

Cara termudah di Windows: **double-click `mulai.bat`** dari folder proyek.

Script tersebut menjalankan semua layanan dan membuka:

- Absensi: <http://localhost:5173/scanner>
- Dashboard: <http://localhost:5173/dashboard>

Jika ingin menjalankan secara manual, buka tiga terminal dari folder proyek:

```powershell
# Terminal 1 - AI service
venv\Scripts\python.exe -m uvicorn main:app --app-dir ai-service

# Terminal 2 - Backend
npm --prefix backend start

# Terminal 3 - Frontend
npm --prefix frontend run dev
```

Jalankan layanan AI terlebih dahulu dan biarkan ketiga terminal tetap terbuka.

## Build frontend

```powershell
npm --prefix frontend run build
```

Hasil build tersedia di `frontend\dist`.
