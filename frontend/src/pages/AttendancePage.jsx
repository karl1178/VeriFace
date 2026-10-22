import { useEffect, useRef, useState } from "react";
import { apiRequest } from "../api.js";

export default function AttendancePage() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [scanError, setScanError] = useState("");
  const [countdown, setCountdown] = useState(null);
  const [notification, setNotification] = useState(null);

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

  useEffect(() => {
    if (!notification) return undefined;
    const timer = window.setTimeout(() => setNotification(null), 3000);
    return () => window.clearTimeout(timer);
  }, [notification]);

  useEffect(() => {
    if (!cameraReady) return undefined;
    let active = true;
    let timer;
    let requestTimer;
    let controller;

    const wait = (milliseconds) => new Promise((resolve) => {
      timer = window.setTimeout(resolve, milliseconds);
    });

    async function scanLoop() {
      while (active) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
          await wait(250);
          continue;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d").drawImage(video, 0, 0);
        const image = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));

        if (active && image) {
          const formData = new FormData();
          formData.append("image", image, "absen.jpg");
          controller = new AbortController();
          requestTimer = window.setTimeout(() => controller?.abort(), 15000);
          try {
            const data = await apiRequest("/api/absen", { method: "POST", body: formData, signal: controller.signal });
            if (active) {
              setScanError("");
              setNotification({ id: Date.now(), message: data.pesan || "Absensi berhasil." });
            }
          } catch (error) {
            if (active) {
              const noFaceDetected = error.status === 400 && /wajah.*(tidak ditemukan|tidak terdeteksi)/i.test(error.message);
              if (noFaceDetected) {
                setScanError("");
                setCountdown(null);
                await wait(1000);
                continue;
              } else if (error.status === 401 || error.name === "AbortError") {
                setScanError("");
              } else {
                setScanError(error.message || "Gagal menghubungi layanan absensi.");
              }
            }
          } finally {
            window.clearTimeout(requestTimer);
            requestTimer = undefined;
            controller = undefined;
          }
        } else if (active) {
          setScanError("Gagal mengambil gambar dari kamera.");
        }

        for (const seconds of [3, 2, 1]) {
          if (!active) break;
          setCountdown(seconds);
          await wait(1000);
        }
        if (active) setCountdown(null);
      }
    }

    scanLoop();
    return () => {
      active = false;
      window.clearTimeout(timer);
      window.clearTimeout(requestTimer);
      controller?.abort();
    };
  }, [cameraReady]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7f5] px-4 py-8 text-[#202c26]">
      {notification && (
        <div key={notification.id} className="scanner-toast fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4" aria-live="polite">
          <div role="status" className="flex w-full max-w-lg items-center gap-3 rounded-lg border border-[#cce2d2] bg-white px-4 py-3 shadow-lg">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#397553] text-sm font-bold text-white" aria-hidden="true">✓</span>
            <span className="text-sm font-medium text-[#28634c]">{notification.message}</span>
          </div>
        </div>
      )}

      <section className="w-full max-w-lg rounded-xl border border-[#e7ebe7] bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5">
          <a href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-medium text-[#748078] no-underline hover:text-[#397553]">
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M12.5 4.5 7 10l5.5 5.5M7.5 10h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Kembali ke Dashboard
          </a>
          <h1 className="mt-4 mb-1 text-lg font-semibold tracking-[-0.035em]">Scanner Kehadiran</h1>
          <p className="m-0 text-xs text-[#89938c]">Posisikan wajah di depan kamera untuk scan wajah.</p>
        </div>
        <video ref={videoRef} autoPlay playsInline muted className="aspect-video w-full rounded-lg bg-[#202c26] object-cover -scale-x-100" aria-label="Pratinjau kamera absensi" />
        <canvas ref={canvasRef} className="hidden" />
        {cameraError && <p className="mt-3 text-sm text-[#a85749]" role="alert">{cameraError}</p>}
        {scanError && <p className="mt-3 text-sm text-[#a85749]" role="alert">{scanError}</p>}
        {countdown !== null ? (
          <p className="mt-4 mb-0 text-center text-sm font-medium text-[#748078]" aria-live="polite">Try again in {countdown}</p>
        ) : (
          <p className="mt-4 mb-0 text-center text-xs text-[#89938c]" aria-live="polite">{cameraReady ? "Menunggu wajah..." : "Menyiapkan kamera..."}</p>
        )}
      </section>
    </main>
  );
}
