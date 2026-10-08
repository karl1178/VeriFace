import { useCallback, useEffect, useState } from "react";

const API_URL = "http://localhost:5000";

export default function DashboardPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/logs`);
      if (!response.ok) throw new Error("Gagal mengambil data aktivitas.");
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Format data log tidak valid.");
      setLogs(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Koneksi ke backend terputus.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/70">
        <header className="flex flex-col gap-4 border-b border-slate-100 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="mb-1 text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">VeriFace</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Log Aktivitas Karyawan</h1>
          </div>
          <button
            type="button"
            onClick={fetchLogs}
            disabled={loading}
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? "Memuat..." : "Refresh data"}
          </button>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-900 text-xs uppercase tracking-wide text-white">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold">Waktu (Tanggal &amp; Jam)</th>
                <th scope="col" className="px-6 py-4 font-semibold">Nama</th>
                <th scope="col" className="px-6 py-4 font-semibold">Aktivitas</th>
                <th scope="col" className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-500">Memuat data...</td></tr>
              ) : error ? (
                <tr><td colSpan="4" className="px-6 py-12 text-center text-red-600">{error}</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-500">Belum ada aktivitas terekam.</td></tr>
              ) : (
                logs.map((log, index) => (
                  <tr key={`${log.waktu}-${log.nama}-${index}`} className="transition hover:bg-slate-50">
                    <td className="whitespace-nowrap px-6 py-4 text-slate-600">{log.waktu}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{log.nama}</td>
                    <td className="px-6 py-4 text-slate-600">{log.aktivitas}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          log.status === "Sukses"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className="border-t border-slate-100 px-6 py-4 sm:px-8">
          <a href="/" className="text-sm font-medium text-blue-700 hover:underline">Kembali ke absensi</a>
        </footer>
      </section>
    </main>
  );
}
