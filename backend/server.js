const express = require("express");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const cors = require("cors");
const { Pool } = require("pg");
const crypto = require("crypto"); // Modul Kriptografi bawaan Node.js

// --- KONFIGURASI KRIPTOGRAFI AES-256-CBC ---
const ALGORITHM = "aes-256-cbc";
// Kunci rahasia harus 32 karakter (256 bit). Di dunia nyata, ini disimpan di file .env
const SECRET_KEY = crypto.createHash("sha256").update("KunciRahasiaVeriFaceTugasKripto").digest("base64").substring(0, 32);

// Fungsi Enkripsi
function encryptData(text) {
  const iv = crypto.randomBytes(16); // Bikin IV acak 16 byte
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  // Gabungkan IV dan Ciphertext dengan pemisah titik dua (:)
  return iv.toString("hex") + ":" + encrypted;
}

// Fungsi Dekripsi
function decryptData(encryptedData) {
  const parts = encryptedData.split(":");
  const iv = Buffer.from(parts.shift(), "hex");
  const encryptedText = Buffer.from(parts.join(":"), "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
// -------------------------------------------

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "absensi_db",
  password: "root", // <--- UBAH INI JADI PASSWORD POSTGRESQL ANDA
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

// AMBIL DATA LOG (DASHBOARD)
app.get("/api/logs", async (req, res) => {
  try {
    const result = await pool.query("SELECT TO_CHAR(waktu, 'DD/MM/YYYY HH24:MI:SS') as waktu, nama, aktivitas, status FROM log_absen ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("DATABASE ERROR:", err.message); // <-- Add this line!
    res.status(500).json({ error: "Gagal mengambil log dari database" });
  }
});

// REGISTER WAJAH (ENKRIPSI SEBELUM DISIMPAN)
app.post("/api/register", upload.single("image"), async (req, res) => {
  try {
    const nama = req.body.nama;
    if (!req.file || !nama) return res.status(400).json({ error: "Gambar dan nama wajib diisi" });

    const form = new FormData();
    form.append("image", req.file.buffer, { filename: "reg.jpg", contentType: "image/jpeg" });

    const fastApiResponse = await axios.post("http://127.0.0.1:8000/extract-feature", form, { headers: form.getHeaders() });
    const dataAI = fastApiResponse.data;

    if (dataAI.status === "success") {
      // 1. Ubah array 128 angka menjadi string
      const featureString = JSON.stringify(dataAI.feature);

      // 2. Enkripsi string tersebut menggunakan AES-256
      const cipherText = encryptData(featureString);

      // 3. Bungkus jadi JSON (karena kolom database kita tipe datanya JSON)
      const secureData = JSON.stringify({ cipher: cipherText });

      await pool.query("INSERT INTO karyawan (nama, feature) VALUES ($1, $2)", [nama, secureData]);
      await pool.query("INSERT INTO log_absen (nama, aktivitas, status) VALUES ($1, $2, $3)", [nama, "Register", "Sukses"]);

      res.json({ pesan: `Wajah ${nama} berhasil disimpan dengan Enkripsi AES-256!` });
    } else {
      res.status(400).json({ error: dataAI.message });
    }
  } catch (error) {
    console.error("Error backend:", error);
    res.status(500).json({ error: "Terjadi kesalahan sistem" });
  }
});

// ABSENSI (DEKRIPSI SAAT DIBACA DARI DATABASE)
app.post("/api/absen", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Tidak ada gambar" });

    const form = new FormData();
    form.append("image", req.file.buffer, { filename: "absen.jpg", contentType: "image/jpeg" });

    const fastApiResponse = await axios.post("http://127.0.0.1:8000/extract-feature", form, { headers: form.getHeaders() });
    const dataAI = fastApiResponse.data;

    if (dataAI.status === "success") {
      const vektorAbsen = dataAI.feature;
      const dbResult = await pool.query("SELECT nama, feature FROM karyawan");
      const databaseKaryawan = dbResult.rows;

      let wajahDikenali = null;
      let jarakTerkecil = 1.0;

      for (const karyawan of databaseKaryawan) {
        try {
          // 1. Ekstrak data JSON dari database
          const parsedDb = typeof karyawan.feature === "string" ? JSON.parse(karyawan.feature) : karyawan.feature;

          // 2. Jika data terenkripsi, lakukan dekripsi
          if (parsedDb.cipher) {
            const decryptedString = decryptData(parsedDb.cipher);
            const featureDb = JSON.parse(decryptedString);

            // 3. Hitung kecocokan seperti biasa
            const jarak = hitungJarak(vektorAbsen, featureDb);
            if (jarak < 0.6 && jarak < jarakTerkecil) {
              jarakTerkecil = jarak;
              wajahDikenali = karyawan.nama;
            }
          }
        } catch (cryptoErr) {
          console.log(`Gagal mendekripsi data milik ${karyawan.nama}. Abaikan.`);
        }
      }

      if (wajahDikenali) {
        await pool.query("INSERT INTO log_absen (nama, aktivitas, status) VALUES ($1, $2, $3)", [wajahDikenali, "Absen Masuk", "Sukses"]);
        res.json({ pesan: `Absen berhasil! Selamat bekerja, ${wajahDikenali}.` });
      } else {
        await pool.query("INSERT INTO log_absen (nama, aktivitas, status) VALUES ($1, $2, $3)", ["Tidak Dikenal", "Absen Masuk", "Gagal"]);
        res.status(401).json({ error: "Wajah tidak dikenali." });
      }
    } else {
      res.status(400).json({ error: dataAI.message });
    }
  } catch (error) {
    console.error("Error backend:", error);
    res.status(500).json({ error: "Terjadi kesalahan sistem" });
  }
});

app.listen(5000, () => {
  console.log("Server 1 (Express + PostgreSQL + Kriptografi AES) menyala di http://localhost:5000");
});
