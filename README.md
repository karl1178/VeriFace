# Sistem Absensi Wajah AI

## Struktur Proyek

- `ai-service/`: layanan ekstraksi fitur wajah (FastAPI).
- `backend/`: API Express, migrasi database, dan dependensi Node.js.
- `frontend/`: aplikasi React dan Tailwind CSS untuk absensi dan dashboard.
- `mulai.bat`: menjalankan ketiga layanan di Windows.

## Persyaratan Sistem

1. Install **Node.js** (v18+)
2. Install **Python** (v3.10+)
3. Install **PostgreSQL** (v15+)

## Cara Instalasi (Lakukan Sekali Saja)

1. **Database:** Buka PostgreSQL (pgAdmin/psql), buat database bernama `absensi_db` dan pastikan tabel `karyawan` serta `log_absen` tersedia.
2. **Setup Backend (Node.js):** Dari folder proyek, jalankan `npm --prefix backend install`. Sesuaikan konfigurasi PostgreSQL di `backend/server.js`.
3. **Setup Frontend (React + Tailwind CSS):** Dari folder proyek, jalankan `npm --prefix frontend install`.
4. **Setup AI (Python):**
   - Dari folder proyek, buat environment baru: `python -m venv venv`
   - Aktifkan venv: `venv\Scripts\activate` (Windows)
   - Install library: `pip install -r ai-service\requirements.txt`

## Cara Menjalankan

Cukup double-click `mulai.bat` (khusus Windows), atau jalankan 3 server secara manual dari folder proyek:

1. `venv\Scripts\python -m uvicorn main:app --app-dir ai-service` (Server AI)
2. `npm --prefix backend start` (Server Backend)
3. `npm --prefix frontend run dev` (Server Web)

Buka `http://localhost:5173/scanner` untuk web absensi dan `http://localhost:5173/dashboard` untuk dashboard. Alamat `http://localhost:5173` akan mengarahkan ke `/scanner`.

Untuk membuat build produksi frontend, jalankan `npm --prefix frontend run build`. Hasil build tersedia di `frontend/dist/`.
