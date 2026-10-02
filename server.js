const express = require("express");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const cors = require("cors");
const { Pool } = require("pg"); // Ini yang menghubungkan ke PostgreSQL

// Konfigurasi koneksi ke PostgreSQL (SESUAIKAN PASSWORDNYA)
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "absensi_db",
  password: "postgresql", // <--- UBAH INI JADI PASSWORD POSTGRESQL ANDA
  port: 5432,
});

const app = express();
app.use(cors());
const upload = multer({ storage: multer.memoryStorage() });

function hitungJarak(vektor1, vektor2) {
  let sum = 0;
  for (let i = 0; i < vektor1.length; i++) sum += Math.pow(vektor1[i] - vektor2[i], 2);
  return Math.sqrt(sum);
}

// AMBIL DATA LOG (DASHBOARD) DARI DATABASE
app.get("/api/logs", async (req, res) => {
  try {
    const result = await pool.query("SELECT TO_CHAR(waktu, 'DD/MM/YYYY HH24:MI:SS') as waktu, nama, aktivitas, status FROM log_absen ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil log dari database" });
  }
});

// REGISTER WAJAH (SIMPAN KE POSTGRESQL)
app.post("/api/register", upload.single("image"), async (req, res) => {
  try {
    const nama = req.body.nama;
    if (!req.file || !nama) return res.status(400).json({ error: "Gambar dan nama wajib diisi" });

    const form = new FormData();
    form.append("image", req.file.buffer, { filename: "reg.jpg", contentType: "image/jpeg" });

    const fastApiResponse = await axios.post("http://127.0.0.1:8000/extract-feature", form, { headers: form.getHeaders() });
    const dataAI = fastApiResponse.data;

    if (dataAI.status === "success") {
      // Simpan vektor wajah jadi format JSON untuk PostgreSQL
      const featureJson = JSON.stringify(dataAI.feature);

      // Simpan ke tabel karyawan dan log
      await pool.query("INSERT INTO karyawan (nama, feature) VALUES ($1, $2)", [nama, featureJson]);
      await pool.query("INSERT INTO log_absen (nama, aktivitas, status) VALUES ($1, $2, $3)", [nama, "Register", "Sukses"]);

      res.json({ pesan: `Wajah ${nama} berhasil disimpan permanen ke PostgreSQL!` });
    } else {
      res.status(400).json({ error: dataAI.message });
    }
  } catch (error) {
    console.error("Error backend:", error);
    res.status(500).json({ error: "Terjadi kesalahan sistem di Server 1" });
  }
});

// ABSENSI (PENCOCOKAN DENGAN DATA DI POSTGRESQL)
app.post("/api/absen", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Tidak ada gambar" });

    const form = new FormData();
    form.append("image", req.file.buffer, { filename: "absen.jpg", contentType: "image/jpeg" });

    const fastApiResponse = await axios.post("http://127.0.0.1:8000/extract-feature", form, { headers: form.getHeaders() });
    const dataAI = fastApiResponse.data;

    if (dataAI.status === "success") {
      const vektorAbsen = dataAI.feature;

      // Tarik semua data karyawan dari PostgreSQL
      const dbResult = await pool.query("SELECT nama, feature FROM karyawan");
      const databaseKaryawan = dbResult.rows;

      let wajahDikenali = null;
      let jarakTerkecil = 1.0;

      // Cek kecocokan satu per satu
      for (const karyawan of databaseKaryawan) {
        // Kembalikan JSON jadi array angka
        const featureDb = typeof karyawan.feature === "string" ? JSON.parse(karyawan.feature) : karyawan.feature;
        const jarak = hitungJarak(vektorAbsen, featureDb);

        if (jarak < 0.6 && jarak < jarakTerkecil) {
          jarakTerkecil = jarak;
          wajahDikenali = karyawan.nama;
        }
      }

      if (wajahDikenali) {
        await pool.query("INSERT INTO log_absen (nama, aktivitas, status) VALUES ($1, $2, $3)", [wajahDikenali, "Absen Masuk", "Sukses"]);
        res.json({ pesan: `Absen berhasil! Selamat bekerja, ${wajahDikenali}.` });
      } else {
        await pool.query("INSERT INTO log_absen (nama, aktivitas, status) VALUES ($1, $2, $3)", ["Tidak Dikenal", "Absen Masuk", "Gagal"]);
        res.status(401).json({ error: "Wajah tidak ditemukan di database." });
      }
    } else {
      res.status(400).json({ error: dataAI.message });
    }
  } catch (error) {
    console.error("Error backend:", error);
    res.status(500).json({ error: "Terjadi kesalahan sistem di Server 1" });
  }
});

app.listen(5000, () => {
  console.log("Server 1 (Express + PostgreSQL) menyala di http://localhost:5000");
});
