# Sistem Absensi Wajah AI

## Persyaratan Sistem

1. Install **Node.js** (v18+)
2. Install **Python** (v3.10+)
3. Install **PostgreSQL** (v15+)

## Cara Instalasi (Lakukan Sekali Saja)

1. **Database:** Buka PostgreSQL (pgAdmin/psql), buat database bernama `absensi_db`. Buat tabel menggunakan query SQL yang ada di file `database.sql` (atau bagikan query CREATE TABLE sebelumnya ke tim).
2. **Setup Backend (Node.js):** Buka terminal di folder ini, jalankan `npm install`. Jangan lupa sesuaikan password PostgreSQL di file `server.js`.
3. **Setup AI (Python):**
   - Buka terminal, buat environment baru: `python -m venv venv`
   - Aktifkan venv: `venv\Scripts\activate` (Windows)
   - Install library: `pip install -r requirements.txt`

## Cara Menjalankan

Cukup double-click file `Mulai-Absensi.bat` (khusus Windows), atau jalankan 3 server secara manual:

1. `uvicorn main:app` (Server AI)
2. `node server.js` (Server Backend)
3. `python -m http.server 3000` (Server Web)
