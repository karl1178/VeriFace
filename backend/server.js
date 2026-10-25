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
app.use(express.json());
const upload = multer({ storage: multer.memoryStorage() });

function hitungJarak(vektor1, vektor2) {
  let sum = 0;
  for (let i = 0; i < vektor1.length; i++) sum += Math.pow(vektor1[i] - vektor2[i], 2);
  return Math.sqrt(sum);
}

function handleBackendError(error, res) {
  if (error.code === "ECONNREFUSED" && error.config?.url?.startsWith("http://127.0.0.1:8000/")) {
    console.error("AI SERVICE ERROR: Layanan AI tidak aktif di http://127.0.0.1:8000");
    return res.status(503).json({ error: "Layanan AI tidak aktif. Jalankan server AI di http://127.0.0.1:8000 lalu coba lagi." });
  }

  console.error("Error backend:", error);
  return res.status(500).json({ error: "Terjadi kesalahan sistem" });
}

// AMBIL DATA LOG (DASHBOARD)
app.get("/api/logs", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        TO_CHAR(log.waktu AT TIME ZONE pengaturan_absensi.zona_waktu, 'DD/MM/YYYY HH24:MI:SS') AS waktu,
        COALESCE(karyawan.nama, 'Tidak Dikenal') AS nama,
        log.aktivitas,
        log.status_proses,
        log.status_kehadiran
      FROM log_absen AS log
      LEFT JOIN karyawan ON karyawan.id = log.karyawan_id
      CROSS JOIN pengaturan_absensi
      WHERE pengaturan_absensi.id = 1
      ORDER BY log.waktu DESC, log.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("DATABASE ERROR:", err.message); // <-- Add this line!
    res.status(500).json({ error: "Gagal mengambil log dari database" });
  }
});

app.get("/api/settings/attendance", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT TO_CHAR(jam_masuk, 'HH24:MI') AS jam_masuk, zona_waktu
      FROM pengaturan_absensi
      WHERE id = 1
    `);
    if (!result.rowCount) throw new Error("Pengaturan absensi belum tersedia di database");
    res.json(result.rows[0]);
  } catch (err) {
    console.error("DATABASE ERROR:", err.message);
    res.status(500).json({ error: "Gagal mengambil pengaturan waktu absensi" });
  }
});

app.patch("/api/settings/attendance", async (req, res) => {
  const jamMasuk = typeof req.body?.jam_masuk === "string" ? req.body.jam_masuk : "";
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(jamMasuk)) {
    return res.status(400).json({ error: "Waktu masuk harus menggunakan format HH:MM" });
  }
  try {
    const result = await pool.query(`
      UPDATE pengaturan_absensi
      SET jam_masuk = $1::time
      WHERE id = 1
      RETURNING TO_CHAR(jam_masuk, 'HH24:MI') AS jam_masuk, zona_waktu
    `, [jamMasuk]);
    if (!result.rowCount) throw new Error("Pengaturan absensi belum tersedia di database");
    res.json(result.rows[0]);
  } catch (err) {
    console.error("DATABASE ERROR:", err.message);
    res.status(500).json({ error: "Gagal menyimpan pengaturan waktu absensi" });
  }
});

// MANAJEMEN KARYAWAN
app.get("/api/employees", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, nama FROM karyawan WHERE archived_at IS NULL ORDER BY nama ASC, id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("DATABASE ERROR:", err.message);
    res.status(500).json({ error: "Gagal mengambil data karyawan dari database" });
  }
});

app.patch("/api/employees/:id", async (req, res) => {
  const id = Number(req.params.id);
  const nama = typeof req.body?.nama === "string" ? req.body.nama.trim() : "";
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "ID karyawan tidak valid" });
  if (!nama) return res.status(400).json({ error: "Nama karyawan wajib diisi" });
  try {
    const result = await pool.query(
      "UPDATE karyawan SET nama = $1, updated_at = NOW() WHERE id = $2 AND archived_at IS NULL RETURNING id, nama",
      [nama, id],
    );
    if (!result.rowCount) return res.status(404).json({ error: "Karyawan tidak ditemukan" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("DATABASE ERROR:", err.message);
    res.status(500).json({ error: "Gagal memperbarui nama karyawan" });
  }
});

app.delete("/api/employees/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "ID karyawan tidak valid" });
  try {
    const result = await pool.query(
      "UPDATE karyawan SET archived_at = NOW(), updated_at = NOW() WHERE id = $1 AND archived_at IS NULL RETURNING id",
      [id],
    );
    if (!result.rowCount) return res.status(404).json({ error: "Karyawan tidak ditemukan" });
    res.json({ pesan: "Data karyawan berhasil diarsipkan" });
  } catch (err) {
    console.error("DATABASE ERROR:", err.message);
    res.status(500).json({ error: "Gagal menghapus karyawan dari database" });
  }
});

// REGISTER WAJAH (ENKRIPSI SEBELUM DISIMPAN)
app.post("/api/register", upload.single("image"), async (req, res) => {
  try {
    const nama = typeof req.body?.nama === "string" ? req.body.nama.trim() : "";
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

      const employeeResult = await pool.query(
        "INSERT INTO karyawan (nama, feature) VALUES ($1, $2) RETURNING id",
        [nama, secureData],
      );
      await pool.query(
        "INSERT INTO log_absen (karyawan_id, aktivitas, status_proses) VALUES ($1, $2, $3)",
        [employeeResult.rows[0].id, "Register", "Sukses"],
      );

      res.json({ pesan: `Wajah ${nama} berhasil disimpan dengan Enkripsi AES-256!` });
    } else {
      res.status(400).json({ error: dataAI.message });
    }
  } catch (error) {
    handleBackendError(error, res);
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
      const dbResult = await pool.query("SELECT id, nama, feature FROM karyawan WHERE archived_at IS NULL");
      const databaseKaryawan = dbResult.rows;

      let karyawanDikenali = null;
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
              karyawanDikenali = karyawan;
            }
          }
        } catch (cryptoErr) {
          console.log(`Gagal mendekripsi data milik ${karyawan.nama}. Abaikan.`);
        }
      }

      if (karyawanDikenali) {
        const client = await pool.connect();
        let transactionStarted = false;
        try {
          await client.query("BEGIN");
          transactionStarted = true;
          await client.query("SELECT id FROM karyawan WHERE id = $1 FOR UPDATE", [karyawanDikenali.id]);

          const existingAttendance = await client.query(
            `SELECT 1
             FROM log_absen AS log
             CROSS JOIN pengaturan_absensi
             WHERE log.karyawan_id = $1
               AND log.aktivitas = 'Absen Masuk'
               AND log.status_proses = 'Sukses'
               AND pengaturan_absensi.id = 1
               AND (log.waktu AT TIME ZONE pengaturan_absensi.zona_waktu)::date =
                   (NOW() AT TIME ZONE pengaturan_absensi.zona_waktu)::date
             LIMIT 1`,
            [karyawanDikenali.id],
          );

          if (existingAttendance.rowCount) {
            await client.query("COMMIT");
            transactionStarted = false;
            return res.json({ pesan: `${karyawanDikenali.nama} sudah melakukan absensi hari ini.` });
          }

          const attendanceResult = await client.query(
            `INSERT INTO log_absen (karyawan_id, aktivitas, status_proses, status_kehadiran)
             SELECT $1, $2, 'Sukses',
               CASE
                 WHEN (NOW() AT TIME ZONE pengaturan_absensi.zona_waktu)::time < pengaturan_absensi.jam_masuk
                   THEN 'awal'
                 ELSE 'terlambat'
               END
             FROM pengaturan_absensi
             WHERE pengaturan_absensi.id = 1`,
            [karyawanDikenali.id, "Absen Masuk"],
          );
          if (!attendanceResult.rowCount) throw new Error("Pengaturan waktu absensi belum tersedia di database");

          await client.query("COMMIT");
          transactionStarted = false;
        } catch (error) {
          if (transactionStarted) await client.query("ROLLBACK");
          throw error;
        } finally {
          client.release();
        }
        res.json({ pesan: `Absen berhasil! Selamat bekerja, ${karyawanDikenali.nama}.` });
      } else {
        await pool.query(
          "INSERT INTO log_absen (karyawan_id, aktivitas, status_proses) VALUES (NULL, $1, $2)",
          ["Absen Masuk", "Gagal"],
        );
        res.status(401).json({ error: "Wajah tidak dikenali." });
      }
    } else {
      res.status(400).json({ error: dataAI.message });
    }
  } catch (error) {
    handleBackendError(error, res);
  }
});

app.listen(5000, () => {
  console.log("Server 1 (Express + PostgreSQL + Kriptografi AES) menyala di http://localhost:5000");
});
