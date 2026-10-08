import { useEffect, useRef, useState } from "react";

const API_URL = "http://localhost:5000";

export default function AttendancePage() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [name, setName] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
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

      setMessage(`${data.pesan}`);
      setMessageType("success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Koneksi ke server gagal.");
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7f5] px-4 py-8 text-[#202c26]">
      <section className="w-full max-w-lg rounded-xl border border-[#e7ebe7] bg-white p-5 shadow-sm sm:p-7">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="aspect-video w-full rounded-lg bg-[#202c26] object-cover"
          aria-label="Pratinjau kamera"
        />
        <canvas ref={canvasRef} className="hidden" />

        {cameraError && <p className="mt-3 text-sm text-[#a85749]" role="alert">{cameraError}</p>}

        <label className="mt-5 block text-sm font-medium text-[#344139]" htmlFor="nama">
          Nama (hanya untuk register)
        </label>
        <input
          id="nama"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Masukkan nama"
          className="mt-2 w-full rounded-md border border-[#dfe5df] px-3 py-2.5 text-sm text-[#202c26] outline-none transition placeholder:text-[#a0a8a2] focus:border-[#397553] focus:ring-2 focus:ring-[#edf4ef]"
        />

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={submitting}
            onClick={() => sendToServer("/api/register")}
            className="rounded-md bg-[#397553] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#28634c] disabled:cursor-wait disabled:opacity-60"
          >
            Register wajah
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => sendToServer("/api/absen")}
            className="rounded-md border border-[#dfe5df] bg-white px-4 py-3 text-sm font-semibold text-[#397553] transition hover:bg-[#edf4ef] disabled:cursor-wait disabled:opacity-60"
          >
            Absen masuk
          </button>
        </div>
        {message && (
          <p
            role="alert"
            className={`mt-4 rounded-md px-3 py-2.5 text-sm ${
              messageType === "success"
                ? "bg-[#edf5ef] text-[#397553]"
                : "bg-[#fbefed] text-[#a85749]"
            }`}
          >
            {message}
          </p>
        )}
        <a href="/dashboard" className="mt-5 block text-center text-xs font-medium text-[#748078] hover:text-[#397553] hover:underline">
          Kembali ke Dashboard
        </a>
      </section>
    </main>
  );
}
