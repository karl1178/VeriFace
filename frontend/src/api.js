const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function apiRequest(path, options) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, options);
  } catch {
    throw new Error("Tidak dapat terhubung ke backend. Pastikan server backend berjalan di http://localhost:5000.");
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error("Backend tidak mengirim respons JSON. Pastikan backend VeriFace terbaru berjalan di http://localhost:5000, lalu muat ulang halaman.");
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Respons backend tidak dapat dibaca. Periksa server backend lalu coba lagi.");
  }

  if (!response.ok) {
    const error = new Error(data?.error || "Permintaan ke backend gagal.");
    error.status = response.status;
    error.payload = data;
    throw error;
  }
  return data;
}
