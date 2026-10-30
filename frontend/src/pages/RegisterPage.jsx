import { useEffect, useRef, useState } from "react";
import { apiRequest } from "../api.js";

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

  const captureSteps = [
    { label: "Wajah depan", instruction: "Lihat lurus ke kamera" },
    { label: "Sisi kiri", instruction: "Putar wajah perlahan ke kiri" },
    { label: "Sisi kanan", instruction: "Putar wajah perlahan ke kanan" },
  ];

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
    const video = videoRef.current;
    const canvas = canvasRef.current;
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
      previewData.append("angle", ["front", "left", "right"][captureStep]);
      await apiRequest("/api/register/preview", { method: "POST", body: previewData });
    } catch (error) {
      setCapturedImages((current) => {
        const next = [...current];
        delete next[captureStep];
        return next;
      });
      setRetryStep(captureStep);
      setMessage(
        `${captureSteps[captureStep].label} gagal terdeteksi. Posisikan wajah sesuai instruksi, lalu pilih Retry ${captureSteps[captureStep].label}.`,
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
    setMessage(`${captureSteps[captureStep].label} berhasil diambil.`);
    setMessageType("success");
    if (captureStep < 2) setCaptureStep((step) => step + 1);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7f5] px-4 py-8 text-[#202c26]">
      <section className="w-full max-w-lg rounded-xl border border-[#e7ebe7] bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5">
          <a href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-medium text-[#748078] no-underline hover:text-[#397553]">
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M12.5 4.5 7 10l5.5 5.5M7.5 10h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Kembali ke Dashboard
          </a>
          <h1 className="mt-4 mb-1 text-lg font-semibold tracking-[-0.035em]">Registrasi Wajah</h1>
          <p className="m-0 text-xs text-[#89938c]">Ambil wajah depan, sisi kiri, lalu sisi kanan untuk mendaftarkan karyawan.</p>
        </div>
        <video ref={videoRef} autoPlay playsInline muted className="aspect-video w-full rounded-lg bg-[#202c26] object-cover -scale-x-100" aria-label="Pratinjau kamera" />
        <canvas ref={canvasRef} className="hidden" />
        {cameraError && <p className="mt-3 text-sm text-[#a85749]" role="alert">{cameraError}</p>}
        <div className="mt-4 rounded-lg border border-[#e7ebe7] bg-[#f8faf8] px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            {captureSteps.map((step, index) => (
              <div key={step.label} className="flex items-center gap-1.5">
                <span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold ${capturedImages[index] ? "bg-[#397553] text-white" : index === captureStep ? "bg-[#dcebe1] text-[#397553]" : "bg-[#edf0ed] text-[#89938c]"}`}>
                  {capturedImages[index] ? "✓" : index + 1}
                </span>
                <span className="text-[10px] font-medium text-[#56645b]">{step.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 mb-0 text-xs font-semibold text-[#397553]">{captureSteps[captureStep]?.instruction}</p>
        </div>
        <form onSubmit={registerFace}>
          <label className="mt-5 block text-sm font-medium text-[#344139]" htmlFor="nama">Nama karyawan</label>
          <input id="nama" type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="Masukkan nama" autoComplete="name" required className="mt-2 w-full rounded-md border border-[#dfe5df] px-3 py-2.5 text-sm text-[#202c26] outline-none transition placeholder:text-[#a0a8a2] focus:border-[#397553] focus:ring-2 focus:ring-[#edf4ef]" />
          {capturedImages.filter(Boolean).length < 3 ? (
            <button type="button" onClick={captureCurrentFace} disabled={submitting || validating || Boolean(cameraError) || !cameraReady} className="mt-4 w-full rounded-md bg-[#397553] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#28634c] disabled:cursor-wait disabled:opacity-60">
              {!cameraReady
                ? "Menyiapkan kamera..."
                : validating
                  ? `Memvalidasi ${captureSteps[captureStep].label}...`
                  : retryStep === captureStep
                    ? `Retry ${captureSteps[captureStep].label}`
                    : `Ambil foto ${captureSteps[captureStep].label}`}
            </button>
          ) : (
            <button type="submit" disabled={submitting || Boolean(cameraError) || !cameraReady} className="mt-4 w-full rounded-md bg-[#397553] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#28634c] disabled:cursor-wait disabled:opacity-60">
              {submitting ? "Mendaftarkan..." : "Simpan 3 wajah karyawan"}
            </button>
          )}
        </form>
        {message && <p role="status" className={`mt-4 rounded-md px-3 py-2.5 text-sm ${messageType === "success" ? "bg-[#edf5ef] text-[#397553]" : "bg-[#fbefed] text-[#a85749]"}`}>{message}</p>}
      </section>
    </main>
  );
}
