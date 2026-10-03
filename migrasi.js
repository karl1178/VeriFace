const { Pool } = require("pg");
const crypto = require("crypto");

// --- KONFIGURASI KRIPTOGRAFI (SAMA PERSIS DENGAN SERVER.JS) ---
const ALGORITHM = "aes-256-cbc";
const SECRET_KEY = crypto.createHash("sha256").update("KunciRahasiaVeriFaceTugasKripto").digest("hex").substring(0, 32);

function encryptData(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}
// --------------------------------------------------------------

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "absensi_db",
  password: "postgresql", // <--- UBAH SESUAI PASSWORD POSTGRESQL ANDA
  port: 5432,
});

async function jalankanMigrasi() {
  console.log("Memulai proses migrasi dan enkripsi data...");

  try {
    const result = await pool.query("SELECT id, nama, feature FROM karyawan");
    const karyawanList = result.rows;

    let jumlahBerhasil = 0;
    let jumlahLewat = 0;

    for (const karyawan of karyawanList) {
      // Cek apakah data sudah dalam bentuk objek JSON
      let parsedData;
      try {
        parsedData = typeof karyawan.feature === "string" ? JSON.parse(karyawan.feature) : karyawan.feature;
      } catch (e) {
        parsedData = karyawan.feature;
      }

      // Jika data sudah memiliki properti 'cipher', berarti sudah aman
      if (parsedData && parsedData.cipher) {
        console.log(`[-] Data milik ${karyawan.nama} sudah terenkripsi. Lewati.`);
        jumlahLewat++;
        continue;
      }

      // Jika masih berupa array angka (plaintext)
      console.log(`[+] Mengenkripsi data milik: ${karyawan.nama}...`);
      const featureString = JSON.stringify(parsedData);
      const cipherText = encryptData(featureString);
      const secureData = JSON.stringify({ cipher: cipherText });

      // Timpa data lama dengan data terenkripsi di database
      await pool.query("UPDATE karyawan SET feature = $1 WHERE id = $2", [secureData, karyawan.id]);
      jumlahBerhasil++;
    }

    console.log("\n=========================================");
    console.log(`Migrasi Selesai!`);
    console.log(`Data berhasil diamankan : ${jumlahBerhasil}`);
    console.log(`Data dilewati (sudah aman): ${jumlahLewat}`);
    console.log("=========================================\n");
  } catch (error) {
    console.error("Terjadi kesalahan saat migrasi:", error);
  } finally {
    pool.end();
  }
}

jalankanMigrasi();
