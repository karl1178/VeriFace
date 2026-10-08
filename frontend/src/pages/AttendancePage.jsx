import { useEffect, useRef, useState } from "react";

const API_URL = "http://localhost:5000";

export default function AttendancePage() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [name, setName] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let stream;
    let active = true;

    async function startCamera() {
      try {
        const cameraStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (!active) {
          cameraStream.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = cameraStream;
        if (videoRef.current) videoRef.current.srcObject = cameraStream;
      } catch (error) {
        if (active) setCameraError(`Kamera gagal diakses: ${error.message}`);
      }
    }

    startCamera();
    return () => {
      active = false;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function sendToServer(endpoint) {
    if (endpoint === "/api/register" && !name.trim()) {
      setMessage("Isi nama dulu untuk mendaftar.");
      setMessageType("error");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) {
      setMessage("Kamera belum siap. Periksa izin kamera lalu coba lagi.");
      setMessageType("error");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    const image = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    if (!image) {
      setMessage("Gagal mengambil gambar dari kamera.");
      setMessageType("error");
      return;
    }

    const formData = new FormData();
    formData.append("image", image, "foto.jpg");
    if (name.trim()) formData.append("nama", name.trim());

    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Permintaan gagal.");

      setMessage(`Sukses: ${data.pesan}`);
      setMessageType("success");
    } catch (error) {
      setMessage(error.message || "Koneksi ke server gagal.");
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-9">
        <div className="mb-6 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">VeriFace</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Sistem Absensi AI</h1>
          <p className="mt-2 text-slate-500">Daftarkan wajah atau lakukan absensi dengan kamera.</p>
        </div>

        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="aspect-video w-full rounded-2xl bg-slate-950 object-cover"
          aria-label="Pratinjau kamera"
        />
        <canvas ref={canvasRef} className="hidden" />

        {cameraError && <p className="mt-3 text-sm text-red-600" role="alert">{cameraError}</p>}

        <label className="mt-5 block text-sm font-medium text-slate-700" htmlFor="nama">
          Nama karyawan <span className="font-normal text-slate-400">(diperlukan untuk register)</span>
        </label>
        <input
          id="nama"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Masukkan nama"
          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={submitting}
            onClick={() => sendToServer("/api/register")}
            className="rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
          >
            Register wajah
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => sendToServer("/api/absen")}
            className="rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
          >
            Absen masuk
          </button>
        </div>
        {message && (
          <p
            role="status"
            className={`mt-4 rounded-xl px-4 py-3 text-sm ${
              messageType === "error"
                ? "bg-red-50 text-red-700"
                : messageType === "success"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-blue-50 text-blue-700"
            }`}
          >
            {message}
          </p>
        )}
        <a href="/dashboard" className="mt-6 block text-center text-sm font-medium text-blue-700 hover:underline">
          Lihat log aktivitas
        </a>
      </section>
    </main>
  );
}
