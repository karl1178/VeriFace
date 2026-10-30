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

1. **Database:** Buat database bernama `absensi_db`, lalu dari folder proyek jalankan `psql -U postgres -d absensi_db -f backend/schema.sql`. Schema ini membuat tabel `karyawan`, `log_absen`, dan `pengaturan_absensi`; setiap log menyimpan `karyawan_id`, bukan salinan nama. Nama pada riwayat ditampilkan dari data karyawan saat ini. Status waktu absensi (`status_kehadiran`: `awal` atau `terlambat`) disimpan saat scan sehingga perubahan batas jam masuk tidak mengubah log lama. Batas awalnya 07:00 pada zona waktu Asia/Jakarta dan dapat diubah dari Kelola Karyawan. Penghapusan karyawan melalui aplikasi mengarsipkannya agar riwayat absensi tetap terhubung.
2. **Setup Backend (Node.js):** Dari folder proyek, jalankan `npm --prefix backend install`. Sesuaikan konfigurasi PostgreSQL di `backend/server.js`.
3. **Setup Frontend (React + Tailwind CSS):** Dari folder proyek, jalankan `npm --prefix frontend install`.
4. **Setup AI (Python):**
   - Dari folder proyek, buat environment baru: `python -m venv venv`
   - Aktifkan venv: `venv\Scripts\activate` (Windows)
   - Install library: `pip install -r ai-service\requirements.txt`

## Perubahan Registrasi Wajah 3 Sudut

Registrasi baru meminta tiga foto berurutan: depan, sisi kiri, dan sisi kanan. Backend menyimpan ketiganya sebagai satu referensi wajah AES-256 dalam kolom `karyawan.feature`. Scanner membandingkan foto absensi dengan ketiga referensi dan memakai jarak terdekat. Data lama yang hanya berisi satu referensi tetap dikenali untuk kompatibilitas, tetapi karyawan lama sebaiknya didaftarkan ulang agar mendapatkan tiga sudut.

Jika perlu menghapus dan membuat ulang seluruh schema PostgreSQL, jalankan perintah berikut dengan PostgreSQL aktif:

```sql
DROP DATABASE IF EXISTS absensi_db WITH (FORCE);
CREATE DATABASE absensi_db;
```

Kemudian buat schema dari terminal proyek Windows:

```powershell
psql -U postgres -d absensi_db -f "backend\schema.sql"
```

Perintah ini menghapus semua karyawan, log absensi, dan pengaturan. Pastikan dilakukan hanya pada database uji atau setelah membuat backup. Untuk membackup dulu, jalankan:

```powershell
pg_dump -U postgres -d absensi_db -F c -f veriface-before-three-angle.backup
```

## Cara Menjalankan

Cukup double-click `mulai.bat` (khusus Windows). Script menunggu Server AI siap sebelum menyalakan backend dan frontend. Atau jalankan 3 server secara manual dari folder proyek, masing-masing di terminal terpisah:

1. `venv\Scripts\python -m uvicorn main:app --app-dir ai-service` (Server AI). Tunggu sampai server berjalan di `http://127.0.0.1:8000`.
2. `npm --prefix backend start` (Server Backend).
3. `npm --prefix frontend run dev` (Server Web).

Biarkan ketiga terminal tetap berjalan. Jika backend menampilkan bahwa layanan AI tidak aktif, pastikan Server AI sudah berjalan di port 8000 sebelum mengulangi permintaan.

Buka `http://localhost:5173/scanner` untuk web absensi dan `http://localhost:5173/dashboard` untuk dashboard. Alamat `http://localhost:5173` akan mengarahkan ke `/scanner`.

Untuk membuat build produksi frontend, jalankan `npm --prefix frontend run build`. Hasil build tersedia di `frontend/dist/`.
