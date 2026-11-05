import { useCallback, useEffect, useState } from "react";
import filterIcon from "../assets/filter.svg";
import searchIcon from "../assets/search.svg";
import refreshIcon from "../assets/reset.svg";
import WorkspaceSidebar from "../components/WorkspaceSidebar.jsx";
import WorkspaceTopBar from "../components/WorkspaceTopBar.jsx";
import SuccessToast from "../components/SuccessToast.jsx";
import { apiRequest } from "../api.js";

function getAttendanceStatus(status) {
  return status === "awal" ? "Lebih Awal" : status === "terlambat" ? "Terlambat" : "-";
}

function getProcessStatus(status) {
  return status === "Sukses" ? "Sukses" : "Tidak Dikenal";
}

export default function AttendanceHistoryPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [processFilter, setProcessFilter] = useState("all");
  const [attendanceFilter, setAttendanceFilter] = useState("all");
  const pageSize = 10;
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredLogs = logs.filter((log) => {
    const matchesName = log.nama?.toLowerCase().includes(normalizedSearchQuery);
    const matchesProcess = processFilter === "all" || log.status_proses === processFilter;
    const matchesAttendance = attendanceFilter === "all" || log.status_kehadiran === attendanceFilter;
    return matchesName && matchesProcess && matchesAttendance;
  });
  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  const displayedPage = Math.min(currentPage, Math.max(totalPages, 1));
  const firstDisplayedRow = filteredLogs.length === 0 ? 0 : (displayedPage - 1) * pageSize + 1;
  const lastDisplayedRow = Math.min(displayedPage * pageSize, filteredLogs.length);
  const visibleLogs = filteredLogs.slice((displayedPage - 1) * pageSize, displayedPage * pageSize);
  const pageNumbers = totalPages <= 5
    ? Array.from({ length: totalPages }, (_, index) => index + 1)
    : displayedPage <= 3
      ? [1, 2, 3, "...", totalPages]
      : displayedPage >= totalPages - 2
        ? [1, "...", totalPages - 2, totalPages - 1, totalPages]
        : [1, "...", displayedPage, "...", totalPages];

  const fetchLogs = useCallback(async (showNotice = false) => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/api/logs?limit=100");
      if (!Array.isArray(data)) throw new Error("Format data log tidak valid.");
      setLogs(data);
      setCurrentPage(1);
      if (showNotice) setNotice({ id: Date.now(), message: "Tabel kehadiran berhasil diperbarui." });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Gagal memuat data kehadiran.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(null), 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  return (
    <div className="min-h-screen bg-[var(--color-page)] text-[var(--color-ink)]">
      <WorkspaceSidebar activePage="attendance" />
      <main className="ml-[226px] min-h-screen max-[850px]:ml-0">
        <WorkspaceTopBar title="Kehadiran" />
        <SuccessToast id={notice?.id} message={notice?.message} />
        <div className="mx-auto w-full max-w-[1440px] px-[34px] pt-[30px] pb-[38px] max-[1100px]:px-6 max-[650px]:px-[15px] max-[650px]:pt-[23px]">
          <section className="relative overflow-visible rounded-[9px] border border-[var(--color-border)] bg-white">
            <div className="relative flex min-h-[53px] items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] px-[21px] py-[9px] max-[650px]:flex-wrap max-[650px]:pr-[14px] max-[650px]:pl-[14px]">
              <h3 className="m-0 text-xs font-semibold text-[var(--color-ink-secondary)]">Riwayat Kehadiran</h3>
              {filtersOpen && (
                <div className="absolute right-[21px] top-[calc(100%+6px)] z-10 w-[230px] rounded-lg border border-[var(--color-border)] bg-white p-3 shadow-lg">
                  <div className="grid gap-2.5">
                    <label className="grid gap-1 text-[9px] font-medium text-[var(--color-text-muted)]">
                      Status
                      <select
                        value={processFilter}
                        onChange={(event) => {
                          setProcessFilter(event.target.value);
                          setCurrentPage(1);
                        }}
                        className="h-7 rounded border border-[var(--color-border-input)] bg-white px-2 text-[10px] text-[var(--color-ink-secondary)] outline-none"
                      >
                        <option value="all">Semua status</option>
                        <option value="Sukses">Sukses</option>
                        <option value="Gagal">Tidak Dikenal</option>
                      </select>
                    </label>
                    <label className="grid gap-1 text-[9px] font-medium text-[var(--color-text-muted)]">
                      Status absensi
                      <select
                        value={attendanceFilter}
                        onChange={(event) => {
                          setAttendanceFilter(event.target.value);
                          setCurrentPage(1);
                        }}
                        className="h-7 rounded border border-[var(--color-border-input)] bg-white px-2 text-[10px] text-[var(--color-ink-secondary)] outline-none"
                      >
                        <option value="all">Semua status absensi</option>
                        <option value="awal">Lebih Awal</option>
                        <option value="terlambat">Terlambat</option>
                      </select>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setProcessFilter("all");
                        setAttendanceFilter("all");
                        setCurrentPage(1);
                        setFiltersOpen(false);
                      }}
                      className="mt-1 h-7 rounded border border-[var(--color-border-input)] bg-[var(--color-surface-muted)] text-[10px] font-semibold text-[var(--color-ink-secondary)] hover:bg-[var(--color-brand-wash)]"
                    >
                      Reset filter
                    </button>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 max-[650px]:ml-auto">
                <label className="flex h-[28px] w-[203px] items-center gap-3 rounded-md border border-[var(--color-border)] px-[10px] text-[9px] text-[var(--color-text-placeholder)] max-[650px]:w-[150px] max-[650px]:shrink-0">
                  <img src={searchIcon} className="h-3 w-3 shrink-0" alt="" aria-hidden="true" />
                  <input
                    type="search"
                    aria-label="Cari berdasarkan nama"
                    placeholder="Cari karyawan"
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      setCurrentPage(1);
                    }}
                    className="min-w-0 flex-1 bg-transparent text-[12px] text-[var(--color-ink-secondary)] outline-none placeholder:text-[var(--color-text-placeholder)]"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setFiltersOpen((open) => !open)}
                  aria-expanded={filtersOpen}
                  className={`inline-flex h-[28px] items-center gap-1.5 rounded-md border px-2.5 text-[10px] font-medium transition ${filtersOpen || processFilter !== "all" || attendanceFilter !== "all" ? "border-[var(--color-brand)] bg-[var(--color-brand-wash)] text-[var(--color-brand-hover)]" : "border-[var(--color-border-input)] bg-white text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-muted)]"}`}
                >
                  <img src={filterIcon} className="h-3 w-3 shrink-0" alt="" aria-hidden="true" />
                  Filters
                </button>
                <button
                  type="button"
                  onClick={() => fetchLogs(true)}
                  disabled={loading}
                  className="inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-md border border-[var(--color-border-input)] bg-white text-[10px] font-semibold text-[var(--color-ink-secondary)] transition hover:bg-[var(--color-surface-muted)] disabled:cursor-wait disabled:opacity-[0.65]"
                  title="Segarkan data kehadiran"
                >
                  <img src={refreshIcon} className="h-4 w-4 shrink-0" alt="" aria-hidden="true" />
                </button>
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
                  ) : visibleLogs.map((log, index) => {
                    const isSuccess = log.status_proses === "Sukses";
                    const statusAbsensi = getAttendanceStatus(log.status_kehadiran);
                    const statusProses = getProcessStatus(log.status_proses);
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
                  })}
                </tbody>
              </table>
            </div>
            <div className="border-t border-[var(--color-border-subtle)] px-5 py-3 text-[10px] text-[var(--color-text-soft)]">
              <div className="flex items-center justify-between gap-4">
                <span>Menampilkan {firstDisplayedRow}-{lastDisplayedRow} dari {filteredLogs.length}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                    disabled={displayedPage === 1}
                    className="grid h-6 w-6 place-items-center rounded border border-transparent text-[10px] text-[var(--color-text-muted)] transition hover:border-[var(--color-border-input)] hover:bg-[var(--color-surface-muted)] disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Halaman sebelumnya"
                  >
                    ‹
                  </button>
                  {pageNumbers.map((page, index) => page === "..." ? (
                    <span key={`ellipsis-${index}`} className="grid h-6 w-6 place-items-center text-[10px] text-[var(--color-text-soft)]">...</span>
                  ) : (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      aria-current={page === displayedPage ? "page" : undefined}
                      className={`grid h-6 w-6 place-items-center rounded border text-[10px] transition ${page === displayedPage ? "border-[var(--color-border-input)] bg-[var(--color-surface-muted)] font-semibold text-[var(--color-ink-secondary)]" : "border-transparent text-[var(--color-text-muted)] hover:border-[var(--color-border-input)] hover:bg-[var(--color-surface-muted)]"}`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
                    disabled={displayedPage >= totalPages || totalPages === 0}
                    className="grid h-6 w-6 place-items-center rounded border border-transparent text-[10px] text-[var(--color-text-muted)] transition hover:border-[var(--color-border-input)] hover:bg-[var(--color-surface-muted)] disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Halaman berikutnya"
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
