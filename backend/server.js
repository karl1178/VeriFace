require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const express = require("express");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const cors = require("cors");
const { Pool } = require("pg");
const crypto = require("crypto"); // Modul Kriptografi bawaan Node.js
const bcrypt = require("bcryptjs");
const session = require("express-session");
const PgSession = require("connect-pg-simple")(session);
const { generateSecret, generateSync, generateURI, verifySync } = require("otplib");
const QRCode = require("qrcode");

const FACE_ANGLES = ["front", "left", "right"];

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} wajib diatur di file .env.`);
  return value;
}

// --- KONFIGURASI KRIPTOGRAFI AES-256-CBC ---
const ALGORITHM = "aes-256-cbc";
const ENCRYPTION_KEY = requireEnv("ENCRYPTION_KEY");
const SESSION_SECRET = requireEnv("SESSION_SECRET");
const SECRET_KEY = crypto.createHash("sha256").update(ENCRYPTION_KEY, "utf8").digest();
const LEGACY_SECRET_KEY = Buffer.from(
  crypto.createHash("sha256").update("KunciRahasiaVeriFaceTugasKripto").digest("base64").substring(0, 32),
  "utf8",
);
const AI_SERVICE_URL = requireEnv("AI_SERVICE_URL").replace(/\/+$/, "");

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
function decryptDataWithKey(encryptedData, key) {
  const parts = encryptedData.split(":");
  const iv = Buffer.from(parts.shift(), "hex");
  const encryptedText = Buffer.from(parts.join(":"), "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

function decryptData(encryptedData) {
  try {
    return decryptDataWithKey(encryptedData, SECRET_KEY);
  } catch (error) {
    if (SECRET_KEY.equals(LEGACY_SECRET_KEY)) throw error;
    return decryptDataWithKey(encryptedData, LEGACY_SECRET_KEY);
  }
}
// -------------------------------------------

const pool = new Pool(process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
    }
  : {
      user: requireEnv("PGUSER"),
      host: requireEnv("PGHOST"),
      database: requireEnv("PGDATABASE"),
      password: requireEnv("PGPASSWORD"),
      port: Number(requireEnv("PGPORT")),
    });

const app = express();
const allowedOrigins = requireEnv("CLIENT_ORIGIN")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());
const sessionCookie = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 24 * 60 * 60 * 1000,
};
const clearSessionCookie = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  secure: process.env.NODE_ENV === "production",
};
if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);
app.use(session({
  secret: SESSION_SECRET,
  store: new PgSession({
    pool,
    tableName: "user_session",
  }),
  resave: false,
  saveUninitialized: false,
  cookie: sessionCookie,
}));
const upload = multer({ storage: multer.memoryStorage() });

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

async function extractFaceFeature(buffer, filename) {
  const form = new FormData();
  form.append("image", buffer, { filename, contentType: "image/jpeg" });
  const response = await axios.post(`${AI_SERVICE_URL}/extract-feature`, form, {
    headers: form.getHeaders(),
  });
  return response.data;
}

function requireAuth(req, res, next) {
  if (!req.session.adminId || !req.session.workspaceId) {
    return res.status(401).json({ error: "Silakan masuk terlebih dahulu." });
  }
  next();
}

function requirePendingAuth(req, res, next) {
  if (!req.session.mfaPendingAdminId || !req.session.mfaPendingWorkspaceId) {
    return res.status(401).json({ error: "Sesi verifikasi MFA tidak ditemukan." });
  }
  next();
}

function startSession(req, adminId, workspaceId) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) {
        reject(error);
        return;
      }
      req.session.adminId = adminId;
      req.session.workspaceId = workspaceId;
      delete req.session.mfaPendingAdminId;
      delete req.session.mfaPendingWorkspaceId;
      delete req.session.mfaSetupSecret;
      resolve();
    });
  });
}

function startPendingSession(req, adminId, workspaceId) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) {
        reject(error);
        return;
      }
      req.session.mfaPendingAdminId = adminId;
      req.session.mfaPendingWorkspaceId = workspaceId;
      resolve();
    });
  });
}

function isValidMfaToken(secret, token) {
  if (typeof secret !== "string" || !secret || typeof token !== "string") {
    return false;
  }

  const verification = verifySync({ token, secret });
  return verification?.valid === true;
}

app.post("/api/auth/signup", async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!name || !email || password.length < 8) {
    return res.status(400).json({ error: "Nama, email, dan kata sandi minimal 8 karakter wajib diisi." });
  }

  const client = await pool.connect();
  let transactionStarted = false;
  try {
    await client.query("BEGIN");
    transactionStarted = true;
    const workspaceResult = await client.query(
      "INSERT INTO workspace (nama) VALUES ($1) RETURNING id",
      [`Ruang Kerja ${name}`],
    );
    const workspaceId = workspaceResult.rows[0].id;
    const passwordHash = await bcrypt.hash(password, 12);
    const adminResult = await client.query(
      "INSERT INTO admin (workspace_id, nama, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING id",
      [workspaceId, name, email, passwordHash],
    );
    await client.query(
      "INSERT INTO pengaturan_absensi (workspace_id) VALUES ($1) ON CONFLICT (workspace_id) DO NOTHING",
      [workspaceId],
    );
    await client.query("COMMIT");
    transactionStarted = false;

    await startPendingSession(req, adminResult.rows[0].id, workspaceId);
    res.status(201).json({ mfaSetupRequired: true, admin: { name, email }, workspaceId });
  } catch (error) {
    if (transactionStarted) await client.query("ROLLBACK");
    if (error.code === "23505") {
      return res.status(409).json({ error: "Email sudah terdaftar. Silakan masuk." });
    }
    console.error("SIGNUP ERROR:", error);
    return res.status(500).json({ error: "Gagal membuat akun." });
  } finally {
    client.release();
  }
});

app.post("/api/auth/login", async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!email || !password) return res.status(400).json({ error: "Email dan kata sandi wajib diisi." });

  try {
    const result = await pool.query(
      "SELECT id, workspace_id, nama, email, password_hash, mfa_enabled FROM admin WHERE email = $1",
      [email],
    );
    const admin = result.rows[0];
    if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
      return res.status(401).json({ error: "Email atau kata sandi salah." });
    }
    await startPendingSession(req, admin.id, admin.workspace_id);
    res.json({
      mfaRequired: Boolean(admin.mfa_enabled),
      mfaSetupRequired: !admin.mfa_enabled,
      admin: { id: admin.id, name: admin.nama, email: admin.email },
      workspaceId: admin.workspace_id,
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ error: "Gagal masuk." });
  }
});

app.get("/api/auth/mfa/setup", requirePendingAuth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT email, mfa_enabled FROM admin WHERE id = $1 AND workspace_id = $2",
      [req.session.mfaPendingAdminId, req.session.mfaPendingWorkspaceId],
    );
    if (!result.rowCount) return res.status(401).json({ error: "Akun tidak ditemukan." });
    if (result.rows[0].mfa_enabled) return res.status(409).json({ error: "MFA sudah aktif. Masukkan kode autentikator." });

    if (!req.session.mfaSetupSecret) req.session.mfaSetupSecret = generateSecret();
    const uri = generateURI({
      secret: req.session.mfaSetupSecret,
      issuer: "VeriFace",
      label: result.rows[0].email,
    });
    const qrCode = await QRCode.toDataURL(uri);
    res.json({ qrCode, secret: req.session.mfaSetupSecret });
  } catch (error) {
    console.error("MFA SETUP ERROR:", error);
    res.status(500).json({ error: "Gagal menyiapkan MFA." });
  }
});

app.post("/api/auth/mfa/verify", requirePendingAuth, async (req, res) => {
  const token = typeof req.body?.token === "string" ? req.body.token.replace(/\s/g, "") : "";
  if (!/^\d{6}$/.test(token)) return res.status(400).json({ error: "Kode autentikator harus terdiri dari 6 angka." });

  try {
    const result = await pool.query(
      "SELECT id, workspace_id, nama, email, mfa_enabled, mfa_secret FROM admin WHERE id = $1 AND workspace_id = $2",
      [req.session.mfaPendingAdminId, req.session.mfaPendingWorkspaceId],
    );
    const admin = result.rows[0];
    if (!admin) return res.status(401).json({ error: "Akun tidak ditemukan." });

    const secret = admin.mfa_enabled ? decryptData(admin.mfa_secret) : req.session.mfaSetupSecret;
    if (!isValidMfaToken(secret, token)) {
      return res.status(401).json({ error: "Kode autentikator salah atau sudah kedaluwarsa." });
    }

    const isMfaSetup = !admin.mfa_enabled;
    if (isMfaSetup) {
      await pool.query(
        "UPDATE admin SET mfa_secret = $1, mfa_enabled = TRUE WHERE id = $2 AND workspace_id = $3",
        [encryptData(secret), admin.id, admin.workspace_id],
      );
    }
    if (isMfaSetup) {
      await new Promise((resolve, reject) => {
        req.session.regenerate((error) => (error ? reject(error) : resolve()));
      });
      return res.json({ setupComplete: true });
    }
    await startSession(req, admin.id, admin.workspace_id);
    res.json({ admin: { id: admin.id, name: admin.nama, email: admin.email }, workspaceId: admin.workspace_id });
  } catch (error) {
    console.error("MFA VERIFY ERROR:", error);
    res.status(500).json({ error: "Gagal memverifikasi MFA." });
  }
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  const result = await pool.query(
    "SELECT admin.id, admin.nama, admin.email, admin.workspace_id, workspace.nama AS workspace_name FROM admin JOIN workspace ON workspace.id = admin.workspace_id WHERE admin.id = $1 AND admin.workspace_id = $2",
    [req.session.adminId, req.session.workspaceId],
  );
  if (!result.rowCount) {
    req.session.destroy(() => {});
    return res.status(401).json({ error: "Sesi tidak valid." });
  }
  const admin = result.rows[0];
  res.json({
    admin: { id: admin.id, name: admin.nama, email: admin.email },
    workspace: { id: admin.workspace_id, name: admin.workspace_name },
  });
});

app.patch("/api/settings/profile", requireAuth, async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (!name) {
    return res.status(400).json({ error: "Nama admin wajib diisi." });
  }

  try {
    const result = await pool.query(
      `UPDATE admin
       SET nama = $1
       WHERE id = $2 AND workspace_id = $3
       RETURNING id, nama AS name, email`,
      [name, req.session.adminId, req.session.workspaceId],
    );
    if (!result.rowCount) {
      return res.status(404).json({ error: "Akun admin tidak ditemukan." });
    }
    res.json({ admin: result.rows[0] });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);
    res.status(500).json({ error: "Gagal mengubah nama admin." });
  }
});

app.patch("/api/settings/password", requireAuth, async (req, res) => {
  const currentPassword = typeof req.body?.currentPassword === "string" ? req.body.currentPassword : "";
  const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";
  if (!currentPassword || newPassword.length < 8) {
    return res.status(400).json({ error: "Kata sandi lama wajib diisi dan kata sandi baru minimal 8 karakter." });
  }

  try {
    const result = await pool.query(
      "SELECT password_hash FROM admin WHERE id = $1 AND workspace_id = $2",
      [req.session.adminId, req.session.workspaceId],
    );
    const admin = result.rows[0];
    if (!admin || !(await bcrypt.compare(currentPassword, admin.password_hash))) {
      return res.status(401).json({ error: "Kata sandi lama salah." });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await pool.query(
      "UPDATE admin SET password_hash = $1 WHERE id = $2 AND workspace_id = $3",
      [passwordHash, req.session.adminId, req.session.workspaceId],
    );
    res.json({ message: "Kata sandi berhasil diubah." });
  } catch (error) {
    console.error("UPDATE PASSWORD ERROR:", error);
    res.status(500).json({ error: "Gagal mengubah kata sandi." });
  }
});

app.delete("/api/settings/account", requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // log_absen.karyawan_id uses ON DELETE RESTRICT, so remove logs before
    // deleting the workspace and its cascading dependents.
    await client.query(
      "DELETE FROM log_absen WHERE workspace_id = $1",
      [req.session.workspaceId],
    );
    const result = await client.query(
      "DELETE FROM workspace WHERE id = $1 RETURNING id",
      [req.session.workspaceId],
    );
    if (!result.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Ruang kerja akun tidak ditemukan." });
    }

    await client.query("COMMIT");
    req.session.destroy((error) => {
      res.clearCookie("connect.sid", clearSessionCookie);
      if (error) {
        console.error("DELETE ACCOUNT SESSION ERROR:", error);
      }
      res.json({ pesan: "Akun dan seluruh data terkait berhasil dihapus." });
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("DELETE ACCOUNT ERROR:", error);
    res.status(500).json({ error: "Gagal menghapus akun dan data terkait." });
  } finally {
    client.release();
  }
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy((error) => {
    res.clearCookie("connect.sid", clearSessionCookie);
    if (error) {
      console.error("LOGOUT ERROR:", error);
      return res.status(500).json({ error: "Gagal keluar." });
    }
    res.json({ pesan: "Berhasil keluar." });
  });
});

app.use("/api", requireAuth);

function hitungJarak(vektor1, vektor2) {
  let sum = 0;
  for (let i = 0; i < vektor1.length; i++) sum += Math.pow(vektor1[i] - vektor2[i], 2);
  return Math.sqrt(sum);
}

function ambilFiturReferensi(parsedDb) {
  if (Array.isArray(parsedDb)) return [parsedDb];
  if (!parsedDb?.cipher) return [];

  const decrypted = JSON.parse(decryptData(parsedDb.cipher));
  if (Array.isArray(decrypted)) return [decrypted];
  if (Array.isArray(decrypted?.references)) {
    return decrypted.references
      .filter((reference) => Array.isArray(reference.feature))
      .map((reference) => reference.feature);
  }
  return [];
}

function handleBackendError(error, res) {
  if (error.code === "ECONNREFUSED" && error.config?.url?.startsWith(`${AI_SERVICE_URL}/`)) {
    console.error(`AI SERVICE ERROR: Layanan AI tidak aktif di ${AI_SERVICE_URL}`);
    return res.status(503).json({ error: `Layanan AI tidak aktif. Jalankan server AI di ${AI_SERVICE_URL} lalu coba lagi.` });
  }

  console.error("Error backend:", error);
  return res.status(500).json({ error: "Terjadi kesalahan sistem" });
}

// AMBIL DATA LOG (DASHBOARD DAN HALAMAN KEHADIRAN)
app.get("/api/logs", async (req, res) => {
  try {
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 100;
    const result = await pool.query(`
      SELECT
        log.id,
        log.waktu AS waktu_iso,
        TO_CHAR(log.waktu AT TIME ZONE pengaturan_absensi.zona_waktu, 'DD/MM/YYYY HH24:MI:SS') AS waktu,
        COALESCE(karyawan.nama, 'Tidak Dikenal') AS nama,
        log.aktivitas,
        log.status_proses,
        log.status_kehadiran
      FROM log_absen AS log
      LEFT JOIN karyawan ON karyawan.id = log.karyawan_id AND karyawan.workspace_id = $1
      CROSS JOIN pengaturan_absensi
      WHERE pengaturan_absensi.workspace_id = $1
        AND log.workspace_id = $1
      ORDER BY log.waktu DESC, log.id DESC
      LIMIT $2
    `, [req.session.workspaceId, limit]);
    res.json(result.rows);
  } catch (err) {
    console.error("DATABASE ERROR:", err.message);
    res.status(500).json({ error: "Gagal mengambil log dari database" });
  }
});

app.get("/api/attendance-performance", async (req, res) => {
  const month = typeof req.query.month === "string" && /^\d{4}-\d{2}$/.test(req.query.month)
    ? req.query.month
    : null;
  const employeeId = req.query.employee_id ? Number(req.query.employee_id) : null;
  if (!month) return res.status(400).json({ error: "Bulan tidak valid." });
  if (req.query.employee_id && (!Number.isInteger(employeeId) || employeeId < 1)) {
    return res.status(400).json({ error: "ID karyawan tidak valid." });
  }

  try {
    const result = await pool.query(`
      WITH month_logs AS (
        SELECT
          log.id,
          log.karyawan_id,
          log.waktu,
          log.aktivitas,
          log.status_proses,
          log.status_kehadiran,
          TO_CHAR(log.waktu AT TIME ZONE settings.zona_waktu, 'DD/MM/YYYY HH24:MI:SS') AS waktu_tampil
        FROM log_absen AS log
        CROSS JOIN pengaturan_absensi AS settings
        WHERE log.workspace_id = $1
          AND settings.workspace_id = $1
          AND TO_CHAR(log.waktu AT TIME ZONE settings.zona_waktu, 'YYYY-MM') = $2
          AND ($3::bigint IS NULL OR log.karyawan_id = $3)
          AND log.karyawan_id IS NOT NULL
          AND log.aktivitas = 'Absen Masuk'
          AND log.status_proses = 'Sukses'
      )
      SELECT
        employee.id,
        employee.nama,
        employee.created_at,
        TO_CHAR(employee.created_at AT TIME ZONE settings.zona_waktu, 'DD/MM/YYYY HH24:MI:SS') AS registered_at_tampil,
        COUNT(month_logs.id)::int AS total_attendances,
        COUNT(month_logs.id) FILTER (WHERE month_logs.status_kehadiran = 'awal')::int AS on_time,
        COUNT(month_logs.id) FILTER (WHERE month_logs.status_kehadiran = 'terlambat')::int AS late,
        COALESCE(ROUND(
          COUNT(month_logs.id) FILTER (WHERE month_logs.status_kehadiran = 'awal') * 100.0
          / NULLIF(COUNT(month_logs.id), 0), 1
        ), 0)::float AS on_time_percentage,
        COALESCE(
          JSON_AGG(JSON_BUILD_OBJECT(
            'id', month_logs.id,
            'waktu', month_logs.waktu_tampil,
            'waktu_iso', month_logs.waktu,
            'aktivitas', month_logs.aktivitas,
            'status_kehadiran', month_logs.status_kehadiran
          ) ORDER BY month_logs.waktu DESC, month_logs.id DESC)
          FILTER (WHERE month_logs.id IS NOT NULL),
          '[]'::json
        ) AS logs
      FROM karyawan AS employee
      CROSS JOIN pengaturan_absensi AS settings
      LEFT JOIN month_logs ON month_logs.karyawan_id = employee.id
      WHERE employee.workspace_id = $1
        AND settings.workspace_id = $1
        AND employee.archived_at IS NULL
        AND ($3::bigint IS NULL OR employee.id = $3)
      GROUP BY employee.id, employee.nama, employee.created_at, settings.zona_waktu
      ORDER BY employee.nama ASC, employee.id ASC
    `, [req.session.workspaceId, month, employeeId]);

    res.json({
      month,
      employees: result.rows.map((row) => ({
        ...row,
        logs: Array.isArray(row.logs) ? row.logs : [],
      })),
    });
  } catch (err) {
    console.error("ATTENDANCE PERFORMANCE DATABASE ERROR:", err.message);
    res.status(500).json({ error: "Gagal mengambil performa kehadiran karyawan." });
  }
});

app.get("/api/analytics", async (req, res) => {
  try {
    const result = await pool.query(`
      WITH workspace_clock AS (
        SELECT zona_waktu, (NOW() AT TIME ZONE zona_waktu)::date AS today
        FROM pengaturan_absensi
        WHERE workspace_id = $1
      )
      SELECT
        COUNT(*) AS total_today,
        COUNT(DISTINCT log.karyawan_id) FILTER (WHERE log.status_proses = 'Sukses') AS present_today,
        COUNT(*) FILTER (WHERE log.status_proses = 'Sukses') AS successful_scans,
        COUNT(*) FILTER (WHERE log.status_kehadiran = 'awal') AS early_arrivals,
        COUNT(*) FILTER (WHERE log.status_kehadiran = 'terlambat') AS late_arrivals
      FROM log_absen AS log
      CROSS JOIN workspace_clock
      WHERE log.workspace_id = $1
        AND (log.waktu AT TIME ZONE workspace_clock.zona_waktu)::date = workspace_clock.today
    `, [req.session.workspaceId]);
    res.json(result.rows[0] || {
      total_today: "0",
      present_today: "0",
      successful_scans: "0",
      early_arrivals: "0",
      late_arrivals: "0",
    });
  } catch (err) {
    console.error("ANALYTICS DATABASE ERROR:", err.message);
    res.status(500).json({ error: "Gagal mengambil analitik kehadiran" });
  }
});

app.get("/api/settings/attendance", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT TO_CHAR(jam_masuk, 'HH24:MI') AS jam_masuk, zona_waktu
      FROM pengaturan_absensi
      WHERE workspace_id = $1
    `, [req.session.workspaceId]);
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
      WHERE workspace_id = $2
      RETURNING TO_CHAR(jam_masuk, 'HH24:MI') AS jam_masuk, zona_waktu
    `, [jamMasuk, req.session.workspaceId]);
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
    const result = await pool.query(
      "SELECT id, nama FROM karyawan WHERE workspace_id = $1 AND archived_at IS NULL ORDER BY nama ASC, id ASC",
      [req.session.workspaceId],
    );
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
      "UPDATE karyawan SET nama = $1, updated_at = NOW() WHERE id = $2 AND workspace_id = $3 AND archived_at IS NULL RETURNING id, nama",
      [nama, id, req.session.workspaceId],
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
      "UPDATE karyawan SET archived_at = NOW(), updated_at = NOW() WHERE id = $1 AND workspace_id = $2 AND archived_at IS NULL RETURNING id",
      [id, req.session.workspaceId],
    );
    if (!result.rowCount) return res.status(404).json({ error: "Karyawan tidak ditemukan" });
    res.json({ pesan: "Data karyawan berhasil diarsipkan" });
  } catch (err) {
    console.error("DATABASE ERROR:", err.message);
    res.status(500).json({ error: "Gagal menghapus karyawan dari database" });
  }
});

// REGISTER WAJAH (ENKRIPSI SEBELUM DISIMPAN)
app.post("/api/register/preview", upload.single("image"), async (req, res) => {
  try {
    const angle = typeof req.body?.angle === "string" ? req.body.angle.trim() : "";
    if (!req.file || !FACE_ANGLES.includes(angle)) {
      return res.status(400).json({ error: "Sudut wajah tidak valid atau gambar tidak tersedia" });
    }

    const dataAI = await extractFaceFeature(req.file.buffer, `${angle}.jpg`);

    if (dataAI.status !== "success") {
      return res.status(400).json({ error: `${angle}: ${dataAI.message || "Wajah tidak ditemukan"}` });
    }

    res.json({ pesan: `Wajah ${angle} berhasil dideteksi.`, detected: true });
  } catch (error) {
    handleBackendError(error, res);
  }
});

app.post("/api/register", upload.array("images", 3), async (req, res) => {
  try {
    const nama = typeof req.body?.nama === "string" ? req.body.nama.trim() : "";
    if (!Array.isArray(req.files) || req.files.length !== 3 || !nama) {
      return res.status(400).json({ error: "Nama dan tepat 3 gambar wajah wajib diisi" });
    }

    const references = [];
    for (let index = 0; index < req.files.length; index++) {
      const angle = FACE_ANGLES[index];
      const dataAI = await extractFaceFeature(req.files[index].buffer, `${angle}.jpg`);
      if (dataAI.status !== "success") {
        return res.status(400).json({ error: `${angle}: ${dataAI.message || "Wajah tidak ditemukan"}` });
      }
      references.push({ angle, feature: dataAI.feature });
    }

    const cipherText = encryptData(JSON.stringify({ references }));
    const secureData = JSON.stringify({ version: 2, cipher: cipherText });

    const employeeResult = await pool.query(
      "INSERT INTO karyawan (workspace_id, nama, feature) VALUES ($1, $2, $3) RETURNING id",
      [req.session.workspaceId, nama, secureData],
    );
    await pool.query(
      "INSERT INTO log_absen (workspace_id, karyawan_id, aktivitas, status_proses) VALUES ($1, $2, $3, $4)",
      [req.session.workspaceId, employeeResult.rows[0].id, "Register", "Sukses"],
    );

    res.json({ pesan: `3 referensi wajah ${nama} berhasil disimpan dengan Enkripsi AES-256!` });
  } catch (error) {
    handleBackendError(error, res);
  }
});

// ABSENSI (DEKRIPSI SAAT DIBACA DARI DATABASE)
app.post("/api/absen", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Tidak ada gambar" });

    const dataAI = await extractFaceFeature(req.file.buffer, "absen.jpg");

    if (dataAI.status === "success") {
      const vektorAbsen = dataAI.feature;
      const dbResult = await pool.query(
        "SELECT id, nama, feature FROM karyawan WHERE workspace_id = $1 AND archived_at IS NULL",
        [req.session.workspaceId],
      );
      const databaseKaryawan = dbResult.rows;

      let karyawanDikenali = null;
      let jarakTerkecil = 1.0;

      for (const karyawan of databaseKaryawan) {
        try {
          // 1. Ekstrak data JSON dari database
          const parsedDb = typeof karyawan.feature === "string" ? JSON.parse(karyawan.feature) : karyawan.feature;
          const fiturReferensi = ambilFiturReferensi(parsedDb);

          // Bandingkan dengan setiap sudut, lalu gunakan jarak terdekat untuk mengenali wajah.
          for (const featureDb of fiturReferensi) {
            if (featureDb.length !== vektorAbsen.length) continue;
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
          await client.query(
            "SELECT id FROM karyawan WHERE id = $1 AND workspace_id = $2 FOR UPDATE",
            [karyawanDikenali.id, req.session.workspaceId],
          );

          const existingAttendance = await client.query(
            `SELECT 1
             FROM log_absen AS log
             CROSS JOIN pengaturan_absensi
             WHERE log.karyawan_id = $1
               AND log.workspace_id = $2
               AND log.aktivitas = 'Absen Masuk'
               AND log.status_proses = 'Sukses'
               AND pengaturan_absensi.workspace_id = $2
               AND (log.waktu AT TIME ZONE pengaturan_absensi.zona_waktu)::date =
                   (NOW() AT TIME ZONE pengaturan_absensi.zona_waktu)::date
             LIMIT 1`,
            [karyawanDikenali.id, req.session.workspaceId],
          );

          if (existingAttendance.rowCount) {
            await client.query("COMMIT");
            transactionStarted = false;
            return res.json({ pesan: `${karyawanDikenali.nama} sudah melakukan absensi hari ini.` });
          }

          const attendanceResult = await client.query(
            `INSERT INTO log_absen (workspace_id, karyawan_id, aktivitas, status_proses, status_kehadiran)
             SELECT $1, $2, $3, 'Sukses',
               CASE
                 WHEN (NOW() AT TIME ZONE pengaturan_absensi.zona_waktu)::time < pengaturan_absensi.jam_masuk
                   THEN 'awal'
                 ELSE 'terlambat'
               END
             FROM pengaturan_absensi
             WHERE pengaturan_absensi.workspace_id = $1`,
            [req.session.workspaceId, karyawanDikenali.id, "Absen Masuk"],
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
          "INSERT INTO log_absen (workspace_id, karyawan_id, aktivitas, status_proses) VALUES ($1, NULL, $2, $3)",
          [req.session.workspaceId, "Absen Masuk", "Gagal"],
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

const port = Number(requireEnv("PORT"));
app.listen(port, () => {
  console.log(`Server 1 (Express + PostgreSQL + Kriptografi AES) menyala di port ${port}`);
});
