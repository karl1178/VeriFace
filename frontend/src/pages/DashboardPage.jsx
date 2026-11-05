import { useCallback, useEffect, useState } from "react";
import searchIcon from "../assets/search.svg";
import refreshIcon from "../assets/reset.svg";
import downloadIcon from "../assets/download.svg";
import WorkspaceSidebar from "../components/WorkspaceSidebar.jsx";
import WorkspaceTopBar from "../components/WorkspaceTopBar.jsx";
import SuccessToast from "../components/SuccessToast.jsx";
import { apiRequest } from "../api.js";

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getAttendanceStatus(status) {
  return status === "awal" ? "Lebih Awal" : status === "terlambat" ? "Terlambat" : "-";
}

function getProcessStatus(status) {
  return status === "Sukses" ? "Sukses" : "Tidak Dikenal";
}

function escapeCsvValue(value) {
  const normalizedValue = String(value ?? "");
  return `"${normalizedValue.replace(/"/g, '""')}"`;
}

export default function DashboardPage() {
  const [logs, setLogs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [exportError, setExportError] = useState("");
  const [exportNotice, setExportNotice] = useState(null);
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const todayKey = getDateKey(new Date());
  const todayLogs = logs.filter((log) => {
    const logDate = new Date(log.waktu_iso);
    return !Number.isNaN(logDate.getTime()) && getDateKey(logDate) === todayKey;
  });
  const filteredLogs = logs.filter((log) =>
    log.nama?.toLowerCase().includes(normalizedSearchQuery),
  );
  const visibleLogs = filteredLogs.slice(0, 6);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [logsData, analyticsData] = await Promise.all([
        apiRequest("/api/logs?limit=100"),
        apiRequest("/api/analytics"),
      ]);
      if (!Array.isArray(logsData)) throw new Error("Format data log tidak valid.");
      setLogs(logsData);
      setAnalytics(analyticsData);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Koneksi ke backend terputus.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (!exportError) return undefined;
    const timer = window.setTimeout(() => setExportError(""), 3000);
    return () => window.clearTimeout(timer);
  }, [exportError]);

  useEffect(() => {
    if (!exportNotice) return undefined;
    const timer = window.setTimeout(() => setExportNotice(null), 3000);
    return () => window.clearTimeout(timer);
  }, [exportNotice]);

  function exportTodayAttendance() {
    if (todayLogs.length === 0) {
      setExportError("Tidak ada kehadiran pada hari ini.");
      return;
    }

    const headers = ["Karyawan", "Aktivitas", "Check-in", "Status", "Status Absensi"];
    const rows = todayLogs.map((log) => [
      log.nama,
      log.aktivitas,
      log.waktu,
      getProcessStatus(log.status_proses),
      getAttendanceStatus(log.status_kehadiran),
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsvValue).join(","))
      .join("\r\n");
    const blob = new Blob([`\uFEFF${csv}\r\n`], { type: "text/csv;charset=utf-8;" });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `kehadiran-${todayKey}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(downloadUrl);
    setExportNotice({ id: Date.now(), message: "Kehadiran hari ini berhasil diunduh." });
  }

  return (
    <div className="min-h-screen bg-[var(--color-page)] text-[var(--color-ink)]">
      <WorkspaceSidebar activePage="dashboard" />

      <main className="ml-[226px] min-h-screen max-[850px]:ml-0" id="dashboard">
        <WorkspaceTopBar title="Dashboard" />

        <SuccessToast id={exportNotice?.id} message={exportNotice?.message} />
        {exportError && (
          <div className="scanner-toast fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4" role="alert" aria-live="assertive">
            <div className="flex w-full max-w-lg items-center gap-3 rounded-lg border border-[var(--color-danger-border)] bg-white px-4 py-3 shadow-lg">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--color-danger)] text-sm font-bold text-white" aria-hidden="true">!</span>
              <span className="text-sm font-medium text-[var(--color-danger)]">{exportError}</span>
            </div>
          </div>
        )}

        <div className="mx-auto w-full max-w-[1440px] px-[34px] pt-[30px] pb-[38px] max-[1100px]:px-6 max-[650px]:px-[15px] max-[650px]:pt-[23px] max-[650px]:pb-[30px]">
        <section aria-labelledby="analytics-title">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 id="analytics-title" className="m-0 text-lg font-semibold text-[var(--color-ink-secondary)]">Analitik hari ini</h2>
            </div>
            <a href="/scanner" className="inline-flex h-[34px] items-center justify-center rounded-md bg-[var(--color-brand)] px-3 text-[10px] font-semibold text-white no-underline hover:bg-[var(--color-brand-hover)]">
              Buka Scanner
            </a>
          </div>
          <div className="grid grid-cols-4 gap-3 max-[850px]:grid-cols-2">
            {[
              ["Total scan", analytics?.total_today ?? "-", "Semua aktivitas hari ini"],
              ["Hadir", analytics?.present_today ?? "-", "Karyawan terdeteksi"],
              ["Lebih awal", analytics?.early_arrivals ?? "-", "Check-in sebelum jam masuk"],
              ["Terlambat", analytics?.late_arrivals ?? "-", "Check-in setelah jam masuk"],
            ].map(([label, value, description]) => (
              <div key={label} className="rounded-[9px] border border-[var(--color-border)] bg-white px-4 py-4">
                <p className="m-0 text-[10px] font-medium text-[var(--color-text-soft)]">{label}</p>
                <p className="mt-2 mb-1 text-2xl font-semibold tracking-[-0.04em] text-[var(--color-ink)]">{value}</p>
                <p className="m-0 text-[9px] text-[var(--color-text-soft)]">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5 overflow-hidden rounded-[9px] border border-[var(--color-border)] bg-white">
            <div className="flex min-h-[65px] items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] px-[21px] py-[13px] max-[650px]:flex-wrap max-[650px]:pr-[14px] max-[650px]:pl-[14px]">
              <div>
                <h3 className="m-0 text-xs font-semibold text-[var(--color-ink-secondary)]">Kehadiran terbaru</h3>
                <p className="mt-[5px] mb-0 text-[10px] text-[var(--color-text-soft)]">Check-in karyawan terbaru hari ini</p>
              </div>
              <div className="flex items-center gap-2 max-[650px]:ml-auto">
                <button
                  type="button"
                  onClick={fetchLogs}
                  disabled={loading}
                  className="inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-md border border-[var(--color-border-input)] bg-white text-[10px] font-semibold text-[var(--color-ink-secondary)] transition hover:bg-[var(--color-surface-muted)] disabled:cursor-wait disabled:opacity-[0.65]"
                  title="Segarkan data kehadiran"
                >
                  <img src={refreshIcon} className="h-4 w-4 shrink-0" alt="" aria-hidden="true" />
                </button>
                <label className="flex h-[34px] w-[203px] items-center gap-3 rounded-md border border-[var(--color-border)] px-[10px] text-[9px] text-[var(--color-text-placeholder)] max-[650px]:w-[150px] max-[650px]:shrink-0">
                  <img src={searchIcon} className="h-3 w-3 shrink-0" alt="" aria-hidden="true" />
                  <input
                    type="search"
                    aria-label="Cari berdasarkan nama"
                    placeholder="Cari karyawan"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-[12px] text-[var(--color-ink-secondary)] outline-none placeholder:text-[var(--color-text-placeholder)]"
                  />
                </label>
                <button
                  type="button"
                  onClick={exportTodayAttendance}
                  disabled={loading}
                  className="inline-flex h-[34px] shrink-0 items-center justify-center rounded-md border border-[var(--color-border-input)] bg-white px-3 text-[10px] font-semibold text-[var(--color-ink-secondary)] transition hover:bg-[var(--color-surface-muted)] disabled:cursor-wait disabled:opacity-[0.65]"
                  title="Unduh kehadiran hari ini dalam format CSV"
                >
                  <img src={downloadIcon} className="mr-1.5 h-3.5 w-3.5 shrink-0" alt="" aria-hidden="true" />
                  Export CSV
                </button>
                <a href="/attendance" className="inline-flex h-[34px] shrink-0 items-center justify-center gap-1 rounded-md border border-[var(--color-border-input)] bg-white px-3 text-[10px] font-semibold text-[var(--color-ink-secondary)] no-underline hover:bg-[var(--color-surface-muted)]">
                  Lihat semua
                  <svg className="h-3.5 w-3.5 rotate-180" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M12.5 4.5 7 10l5.5 5.5M7.5 10h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead className="bg-[var(--color-surface-muted)] text-[9px] font-medium text-[var(--color-text-soft)]">
                  <tr>
                    <th className="px-5 py-[9px] pl-[21px] font-medium" scope="col">Karyawan</th>
                    <th className="px-5 py-[9px] font-medium" scope="col">Aktivitas</th>
                    <th className="px-5 py-[9px] font-medium" scope="col">Check-in</th>
                    <th className="px-5 py-[9px] font-medium" scope="col">Status</th>
                    <th className="px-5 py-[9px] font-medium" scope="col">Status Absensi</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="5" className="h-[85px] text-center text-[10px] text-[var(--color-text-soft)]">Memuat data kehadiran...</td></tr>
                  ) : error ? (
                    <tr><td colSpan="5" className="h-[85px] text-center text-[10px] text-[var(--color-danger)]">{error}</td></tr>
                  ) : logs.length === 0 ? (
                    <tr><td colSpan="5" className="h-[85px] text-center text-[10px] text-[var(--color-text-soft)]">Belum ada aktivitas yang tercatat.</td></tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr><td colSpan="5" className="h-[85px] text-center text-[10px] text-[var(--color-text-soft)]">Tidak ada karyawan dengan nama tersebut.</td></tr>
                  ) : (
                    visibleLogs.map((log, index) => {
                      const statusAbsensi = getAttendanceStatus(log.status_kehadiran);
                      const statusProses = getProcessStatus(log.status_proses);
                      const isSuccess = log.status_proses === "Sukses";
                      return (
                        <tr key={`${log.waktu}-${log.nama}-${index}`} className="transition-colors hover:bg-[var(--color-surface-muted)]">
                          <td className="border-b border-[var(--color-border-subtle)] py-[10px] pr-4 pl-[21px] text-[10px] text-[var(--color-text-muted)]">
                            <div className="flex items-center gap-[10px]">
                              <span className="grid h-[29px] w-[29px] shrink-0 place-items-center rounded-full bg-[var(--color-brand-soft)] text-[8px] font-semibold text-[var(--color-brand)]">
                                {log.nama?.split(/\s+/).map((part) => part[0]).join("").slice(0, 2)}
                              </span>
                              <strong className="text-[10px] font-semibold text-[var(--color-ink-secondary)]">{log.nama}</strong>
                            </div>
                          </td>
                          <td className="border-b border-[var(--color-border-subtle)] px-4 py-[10px] text-[10px] text-[var(--color-text-muted)]">{log.aktivitas}</td>
                          <td className="border-b border-[var(--color-border-subtle)] px-4 py-[10px] text-[10px] text-[var(--color-text-muted)]">{log.waktu}</td>
                          <td className="border-b border-[var(--color-border-subtle)] px-4 py-[10px] text-[10px] text-[var(--color-text-muted)]">
                            <span className={`inline-flex items-center gap-[6px] whitespace-nowrap rounded-full px-2 py-1 text-[9px] font-medium ${isSuccess ? "bg-[var(--color-brand-wash)] text-[var(--color-brand)]" : "bg-[var(--color-danger-surface)] text-[var(--color-danger)]"}`}>
                              <span className={`h-[6px] w-[6px] rounded-full ${isSuccess ? "bg-[var(--color-brand)]" : "bg-[var(--color-danger)]"}`} />
                              {statusProses}
                            </span>
                          </td>
                          <td className="border-b border-[var(--color-border-subtle)] px-4 py-[10px] text-[10px] text-[var(--color-text-muted)]">
                            <span className={`inline-flex items-center gap-[6px] whitespace-nowrap rounded-full px-2 py-1 text-[9px] font-medium ${statusAbsensi === "Terlambat" ? "bg-[var(--color-danger-surface)] text-[var(--color-danger)]" : statusAbsensi === "Lebih Awal" ? "bg-[var(--color-brand-wash)] text-[var(--color-brand)]" : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]"}`}>
                              {statusAbsensi}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {!loading && !error && filteredLogs.length > visibleLogs.length && (
              <div className="flex items-center justify-between border-t border-[var(--color-border-subtle)] px-5 py-3">
                <span className="text-[10px] text-[var(--color-text-soft)]">Menampilkan {visibleLogs.length} dari {filteredLogs.length} data</span>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
