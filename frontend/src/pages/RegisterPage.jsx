import { useEffect, useRef, useState } from "react";
import { apiRequest } from "../api.js";

const CAPTURE_STEPS = [
  { label: "Wajah depan", instruction: "Lihat lurus ke kamera" },
  { label: "Sisi kiri", instruction: "Putar wajah perlahan ke kiri" },
  { label: "Sisi kanan", instruction: "Putar wajah perlahan ke kanan" },
];
const CAPTURE_ANGLES = ["front", "left", "right"];

export default function RegisterPage() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [name, setName] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [submitting, setSubmitting] = useState(false);
  const [captureStep, setCaptureStep] = useState(0);
  const [capturedImages, setCapturedImages] = useState([]);
  const [validating, setValidating] = useState(false);
  const [retryStep, setRetryStep] = useState(null);

  useEffect(() => {
    let stream;
    let active = true;
    async function startCamera() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("Browser ini tidak mendukung akses kamera.");
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
        if (!active) {
          cameraStream.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = cameraStream;
        if (videoRef.current) {
          videoRef.current.srcObject = cameraStream;
          await videoRef.current.play();
          if (active) setCameraReady(true);
        }
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

  async function registerFace(event) {
    event.preventDefault();
    if (!name.trim()) {
      setMessage("Isi nama dulu untuk mendaftar.");
      setMessageType("error");
      return;
    }
    if (capturedImages.filter(Boolean).length !== 3) {
      setMessage("Ambil tiga foto: depan, sisi kiri, dan sisi kanan.");
      setMessageType("error");
      return;
    }
    const formData = new FormData();
    formData.append("nama", name.trim());
    capturedImages.forEach((image, index) => {
      formData.append("images", image, `face-${index + 1}.jpg`);
    });
    setSubmitting(true);
    setMessage("");
    try {
      const data = await apiRequest("/api/register", { method: "POST", body: formData });
      setMessage(data.pesan || "Wajah berhasil didaftarkan.");
      setMessageType("success");
      setName("");
      setCaptureStep(0);
      setCapturedImages([]);
      setRetryStep(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Koneksi ke server gagal.");
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  }

  async function captureCurrentFace() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
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

    setValidating(true);
    setMessage("");
    try {
      const previewData = new FormData();
      previewData.append("image", image, `face-${captureStep + 1}.jpg`);
      previewData.append("angle", CAPTURE_ANGLES[captureStep]);
      await apiRequest("/api/register/preview", { method: "POST", body: previewData });
    } catch (error) {
      setCapturedImages((current) => {
        const next = [...current];
        delete next[captureStep];
        return next;
      });
      setRetryStep(captureStep);
      setMessage(
        `${CAPTURE_STEPS[captureStep].label} gagal terdeteksi. Posisikan wajah sesuai instruksi, lalu pilih Retry ${CAPTURE_STEPS[captureStep].label}.`,
      );
      setMessageType("error");
      return;
    } finally {
      setValidating(false);
    }

    setCapturedImages((current) => {
      const next = [...current];
      next[captureStep] = image;
      return next;
    });
    setRetryStep(null);
    setMessage(`${CAPTURE_STEPS[captureStep].label} berhasil diambil.`);
    setMessageType("success");
    if (captureStep < 2) setCaptureStep((step) => step + 1);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-page)] px-4 py-8 text-[var(--color-ink)]">
      <section className="w-full max-w-lg rounded-xl border border-[var(--color-border)] bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5">
          <a href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-muted)] no-underline hover:text-[var(--color-brand)]">
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M12.5 4.5 7 10l5.5 5.5M7.5 10h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Kembali ke Dashboard
          </a>
          <h1 className="mt-4 mb-1 text-lg font-semibold tracking-[-0.035em]">Registrasi Wajah</h1>
          <p className="m-0 text-xs text-[var(--color-text-soft)]">Ambil wajah depan, sisi kiri, lalu sisi kanan untuk mendaftarkan karyawan.</p>
        </div>
        <video ref={videoRef} autoPlay playsInline muted className="aspect-video w-full rounded-lg bg-[var(--color-ink)] object-cover -scale-x-100" aria-label="Pratinjau kamera" />
        <canvas ref={canvasRef} className="hidden" />
        {cameraError && <p className="mt-3 text-sm text-[var(--color-danger)]" role="alert">{cameraError}</p>}
        <div className="mt-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            {CAPTURE_STEPS.map((step, index) => (
              <div key={step.label} className="flex items-center gap-1.5">
                <span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold ${capturedImages[index] ? "bg-[var(--color-brand)] text-white" : index === captureStep ? "bg-[var(--color-brand-soft)] text-[var(--color-brand)]" : "bg-[var(--color-border-subtle)] text-[var(--color-text-soft)]"}`}>
                  {capturedImages[index] ? "Ã¢Å“â€œ" : index + 1}
                </span>
                <span className="text-[10px] font-medium text-[var(--color-ink-secondary)]">{step.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 mb-0 text-xs font-semibold text-[var(--color-brand)]">{CAPTURE_STEPS[captureStep]?.instruction}</p>
        </div>
        <form onSubmit={registerFace}>
          <label className="mt-5 block text-sm font-medium text-[var(--color-ink-secondary)]" htmlFor="nama">Nama karyawan</label>
          <input id="nama" type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="Masukkan nama" autoComplete="name" required className="mt-2 w-full rounded-md border border-[var(--color-border-input)] px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-text-placeholder)] focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand-wash)]" />
          {capturedImages.filter(Boolean).length < CAPTURE_STEPS.length ? (
            <button type="button" onClick={captureCurrentFace} disabled={submitting || validating || Boolean(cameraError) || !cameraReady} className="mt-4 w-full rounded-md bg-[var(--color-brand)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-hover)] disabled:cursor-wait disabled:opacity-60">
              {!cameraReady
                ? "Menyiapkan kamera..."
                : validating
                  ? `Memvalidasi ${CAPTURE_STEPS[captureStep].label}...`
                  : retryStep === captureStep
                    ? `Retry ${CAPTURE_STEPS[captureStep].label}`
                    : `Ambil foto ${CAPTURE_STEPS[captureStep].label}`}
            </button>
          ) : (
            <button type="submit" disabled={submitting || Boolean(cameraError) || !cameraReady} className="mt-4 w-full rounded-md bg-[var(--color-brand)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-hover)] disabled:cursor-wait disabled:opacity-60">
              {submitting ? "Mendaftarkan..." : "Simpan 3 wajah karyawan"}
            </button>
          )}
        </form>
        {message && <p role="status" className={`mt-4 rounded-md px-3 py-2.5 text-sm ${messageType === "success" ? "bg-[var(--color-brand-wash)] text-[var(--color-brand)]" : "bg-[var(--color-danger-surface)] text-[var(--color-danger)]"}`}>{message}</p>}
      </section>
    </main>
  );
}
