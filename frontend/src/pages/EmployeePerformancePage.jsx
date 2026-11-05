import { useCallback, useEffect, useMemo, useState } from "react";
import refreshIcon from "../assets/reset.svg";
import WorkspaceSidebar from "../components/WorkspaceSidebar.jsx";
import WorkspaceTopBar from "../components/WorkspaceTopBar.jsx";
import { apiRequest } from "../api.js";

function getMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(month, offset) {
  const [year, value] = month.split("-").map(Number);
  const date = new Date(year, value - 1 + offset, 1);
  return getMonthKey(date);
}

function formatMonth(month) {
  const [year, value] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(year, value - 1, 1));
}

export default function EmployeePerformancePage() {
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [month, setMonth] = useState(getMonthKey(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPerformance = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const query = selectedId ? `&employee_id=${selectedId}` : "";
      const data = await apiRequest(`/api/attendance-performance?month=${month}${query}`);
      if (!Array.isArray(data.employees)) throw new Error("Format data performa tidak valid.");
      setEmployees(data.employees);
      if (selectedId && !data.employees.some((employee) => String(employee.id) === selectedId)) {
        setSelectedId("");
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Gagal memuat performa kehadiran.");
    } finally {
      setLoading(false);
    }
  }, [month, selectedId]);

  useEffect(() => {
    apiRequest("/api/employees")
      .then((data) => {
        if (!Array.isArray(data)) throw new Error("Format data karyawan tidak valid.");
        setEmployeeOptions(data);
      })
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Gagal memuat data karyawan."));
  }, []);

  useEffect(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  const employee = employees[0];
  const metrics = useMemo(() => employee || {
    total_attendances: 0,
    on_time: 0,
    late: 0,
    on_time_percentage: 0,
    logs: [],
  }, [employee]);
  const canGoNext = month < getMonthKey(new Date());

  return (
    <div className="min-h-screen bg-[var(--color-page)] text-[var(--color-ink)]">
      <WorkspaceSidebar activePage="performance" />
      <main className="ml-[226px] min-h-screen max-[850px]:ml-0">
        <WorkspaceTopBar title="Performa Karyawan" />
        <div className="mx-auto w-full max-w-[1440px] px-[34px] pt-[30px] pb-[38px] max-[1100px]:px-6 max-[650px]:px-[15px] max-[650px]:pt-[23px]">
          <section className="mb-4 rounded-[9px] border border-[var(--color-border)] bg-white px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="m-0 text-xs font-semibold text-[var(--color-ink-secondary)]">Performa per karyawan</h2>
                <p className="mt-1 mb-0 text-[10px] text-[var(--color-text-soft)]">Pilih karyawan dan bulan untuk melihat riwayat serta persentase ketepatan waktu.</p>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <label className="grid gap-1 text-[9px] font-medium text-[var(--color-text-muted)]">
                  Karyawan
                  <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="h-[34px] min-w-[190px] rounded-md border border-[var(--color-border-input)] bg-white px-2 text-[10px] text-[var(--color-ink-secondary)] outline-none">
                    <option value="">Pilih karyawan</option>
                    {employeeOptions.map((item) => <option key={item.id} value={item.id}>{item.nama}</option>)}
                  </select>
                </label>
                <label className="grid gap-1 text-[9px] font-medium text-[var(--color-text-muted)]">
                  Bulan
                  <input
                    type="month"
                    value={month}
                    onChange={(event) => {
                      if (event.target.value) setMonth(event.target.value);
                    }}
                    className="h-[34px] rounded-md border border-[var(--color-border-input)] bg-white px-2 text-[10px] text-[var(--color-ink-secondary)] outline-none"
                  />
                </label>
                <button type="button" onClick={fetchPerformance} disabled={loading} className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-md border border-[var(--color-border-input)] bg-white hover:bg-[var(--color-surface-muted)] disabled:opacity-60" title="Segarkan performa">
                  <img src={refreshIcon} className="h-4 w-4" alt="" aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border-subtle)] pt-3">
              <button type="button" onClick={() => setMonth((value) => shiftMonth(value, -1))} className="text-[10px] font-semibold text-[var(--color-brand)]">‹ &nbsp; Bulan sebelumnya</button>
              <strong className="text-xs capitalize text-[var(--color-ink-secondary)]">{formatMonth(month)}</strong>
              <button type="button" disabled={!canGoNext} onClick={() => setMonth((value) => shiftMonth(value, 1))} className="text-[10px] font-semibold text-[var(--color-brand)] disabled:cursor-not-allowed disabled:opacity-40">Bulan berikutnya &nbsp; ›</button>
            </div>
          </section>

          {error ? <div role="alert" className="rounded-[9px] border border-[var(--color-danger-border)] bg-white px-5 py-4 text-[10px] text-[var(--color-danger)]">{error}</div> : loading ? <div className="rounded-[9px] border border-[var(--color-border)] bg-white px-5 py-8 text-center text-[10px] text-[var(--color-text-soft)]">Memuat performa kehadiran...</div> : !selectedId ? <div className="rounded-[9px] border border-[var(--color-border)] bg-white px-5 py-8 text-center text-[10px] text-[var(--color-text-soft)]">Pilih karyawan untuk melihat performanya.</div> : (
            <>
              <section className="grid grid-cols-4 gap-3 max-[850px]:grid-cols-2">
                {[
                  ["Total kehadiran", metrics.total_attendances, "Check-in berhasil bulan ini"],
                  ["Tepat waktu", metrics.on_time, "Datang lebih awal"],
                  ["Terlambat", metrics.late, "Datang setelah batas waktu"],
                  ["Persentase tepat waktu", `${metrics.on_time_percentage}%`, "Dari seluruh kehadiran"],
                ].map(([label, value, description]) => <div key={label} className="rounded-[9px] border border-[var(--color-border)] bg-white px-4 py-4"><p className="m-0 text-[10px] font-medium text-[var(--color-text-soft)]">{label}</p><p className="mt-2 mb-1 text-2xl font-semibold tracking-[-0.04em] text-[var(--color-ink)]">{value}</p><p className="m-0 text-[9px] text-[var(--color-text-soft)]">{description}</p></div>)}
              </section>
              <section className="mt-5 overflow-hidden rounded-[9px] border border-[var(--color-border)] bg-white">
                <div className="border-b border-[var(--color-border-subtle)] px-5 py-4"><h3 className="m-0 text-xs font-semibold text-[var(--color-ink-secondary)]">{employee.nama}</h3><p className="mt-1 mb-0 text-[10px] text-[var(--color-text-soft)]">Riwayat kehadiran {formatMonth(month)}</p></div>
                <div className="overflow-x-auto"><table className="w-full min-w-[520px] border-collapse text-left text-[10px]"><thead className="bg-[var(--color-surface-muted)] text-[9px] text-[var(--color-text-soft)]"><tr><th className="px-5 py-3 font-medium">Waktu</th><th className="px-5 py-3 font-medium">Aktivitas</th><th className="px-5 py-3 font-medium">Status Absensi</th></tr></thead><tbody>{metrics.logs.length === 0 ? <tr><td colSpan="3" className="px-5 py-8 text-center text-[var(--color-text-soft)]">Belum ada kehadiran pada bulan ini.</td></tr> : metrics.logs.map((log) => <tr key={log.id} className="border-t border-[var(--color-border-subtle)]"><td className="px-5 py-3 text-[var(--color-text-muted)]">{log.waktu}</td><td className="px-5 py-3 text-[var(--color-text-muted)]">{log.aktivitas}</td><td className="px-5 py-3"><span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-1 text-[9px] font-medium ${log.status_kehadiran === "terlambat" ? "bg-[var(--color-danger-surface)] text-[var(--color-danger)]" : "bg-[var(--color-brand-wash)] text-[var(--color-brand)]"}`}>{log.status_kehadiran === "terlambat" ? "Terlambat" : "Tepat waktu"}</span></td></tr>)}</tbody></table></div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
