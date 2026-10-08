import { useCallback, useEffect, useState } from "react";
import calendarIcon from "../assets/calendar.svg";
import dashboardIcon from "../assets/dashboard.svg";
import notificationIcon from "../assets/notifications.svg";
import searchIcon from "../assets/search.svg";
import adminIcon from "../assets/admin.svg";
import refreshIcon from "../assets/reset.svg"

const API_URL = "http://localhost:5000";

export default function DashboardPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentDate, setCurrentDate] = useState("");

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
    const today = new Date();
    const formatter = new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    setCurrentDate(formatter.format(today));
  }, [fetchLogs]);

  return (
    <div className="min-h-screen bg-[#f5f7f5] text-[#202c26]">
      <aside className="fixed inset-y-0 left-0 z-20 flex w-[226px] flex-col border-r border-[#e7ebe7] bg-white px-4 pt-6 pb-5 max-[850px]:static max-[850px]:min-h-0 max-[850px]:w-auto max-[850px]:flex-row max-[850px]:items-center max-[850px]:border-r-0 max-[850px]:border-b max-[850px]:px-5 max-[850px]:py-[13px]">
        <a href="/dashboard" className="px-2 text-[23px] leading-7 font-semibold tracking-[-0.035em] text-[#202c26] no-underline max-[850px]:px-0 max-[850px]:text-xl">
          VeriFace
        </a>

        <p className="mt-[43px] mb-[10px] mx-[11px] text-[10px] font-semibold tracking-[0.13em] text-[#929b95] uppercase max-[850px]:hidden">
          Ruang Kerja
        </p>
        <nav aria-label="Ruang kerja" className="max-[850px]:ml-auto">
          <a
            href="#dashboard"
            aria-current="page"
            className="flex h-[37px] items-center gap-[11px] rounded-md bg-[#edf4ef] px-[11px] text-xs font-semibold text-[#28634c] no-underline max-[850px]:h-[34px]"
          >
            <img src={dashboardIcon} className="h-[18px] w-[18px] shrink-0" alt="" aria-hidden="true" />
            Dashboard
          </a>
        </nav>

        <div className="mt-auto max-[850px]:hidden">
          <div className="flex items-center gap-[11px] px-[7px] pt-[18px]">
            <img src={adminIcon} className="h-6 w-6 shrink-0" alt="" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <strong className="block overflow-hidden text-ellipsis whitespace-nowrap text-[11px] font-semibold text-[#344139]">
                Administrator
              </strong>
              <small className="mt-[1px] block overflow-hidden text-ellipsis whitespace-nowrap text-[9px] text-[#8a948d]">
                Pengelola
              </small>
            </span>
          </div>
        </div>
      </aside>

      <main className="ml-[226px] min-h-screen max-[850px]:ml-0" id="dashboard">
        <header className="flex min-h-[84px] items-center justify-between gap-4 border-b border-[#e7ebe7] bg-white px-9 py-[14px] max-[1100px]:px-6 max-[650px]:min-h-[74px] max-[650px]:px-[17px] max-[650px]:py-3">
          <div>
            <div className="text-[10px] font-medium text-[#929b95]">
              Ruang Kerja <span className="px-[7px] text-[#c5cbc6]">/</span> Overview
            </div>
            <h1 className="mt-1.5 mb-0 text-lg font-semibold tracking-[-0.035em] text-[#202c26]">
              Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-4 max-[650px]:gap-[9px]">
            <div className="flex items-center gap-[10px] text-[10px] text-[#748078] max-[650px]:hidden">
              <img src={calendarIcon} className="h-3 w-3 shrink-0" alt="" aria-hidden="true" />
              <time>{currentDate}</time>
            </div>
            <span className="h-[26px] w-px bg-[#e7ebe7] max-[650px]:hidden" />
            <span
              className="grid h-[34px] w-[34px] place-items-center rounded-md border border-[#e7ebe7] text-[#66736b] max-[650px]:hidden"
              aria-label="Notifikasi"
            >
              <img src={notificationIcon} className="h-[15px] w-[15px]" alt="" aria-hidden="true" />
            </span>
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1440px] px-[34px] pt-[30px] pb-[38px] max-[1100px]:px-6 max-[650px]:px-[15px] max-[650px]:pt-[23px] max-[650px]:pb-[30px]">

          <section className="mt-[14px] overflow-hidden rounded-[9px] border border-[#e7ebe7] bg-white">
            <div className="flex min-h-[65px] items-center justify-between gap-3 border-b border-[#edf0ed] px-[21px] py-[13px] max-[650px]:pr-[14px] max-[650px]:pl-[14px]">
              <div>
                <h3 className="m-0 text-xs font-semibold text-[#344139]">Kehadiran terbaru</h3>
                <p className="mt-[5px] mb-0 text-[10px] text-[#89938c]">Check-in karyawan terbaru hari ini</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchLogs}
                  disabled={loading}
                  className="inline-flex h-[30px] shrink-0 items-center gap-2 rounded-md border border-[#dfe5df] bg-white px-2 text-[10px] font-semibold text-[#405047] transition hover:bg-[#f8faf8] disabled:cursor-wait disabled:opacity-[0.65]"
                  title="Segarkan data kehadiran"
                >
                  <img src={refreshIcon} className="h-4 w-4 shrink-0" alt="" aria-hidden="true" />
                </button>
                <div className="flex h-[30px] w-[203px] items-center gap-2 rounded-md border border-[#e7ebe7] px-[10px] text-[9px] text-[#a0a8a2] max-[650px]:w-[150px] max-[650px]:shrink-0">
                  <img src={searchIcon} className="h-3 w-3 shrink-0" alt="" aria-hidden="true" />
                  Cari karyawan
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse text-left">
                <thead className="bg-[#fafbfa] text-[9px] font-medium text-[#89938c]">
                  <tr>
                    <th className="px-5 py-[9px] pl-[21px] font-medium" scope="col">Karyawan</th>
                    <th className="px-5 py-[9px] font-medium" scope="col">Aktivitas</th>
                    <th className="px-5 py-[9px] font-medium" scope="col">Check-in</th>
                    <th className="px-5 py-[9px] font-medium" scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="4" className="h-[85px] text-center text-[10px] text-[#89938c]">Memuat data kehadiran...</td></tr>
                  ) : error ? (
                    <tr><td colSpan="4" className="h-[85px] text-center text-[10px] text-[#b5473a]">{error}</td></tr>
                  ) : logs.length === 0 ? (
                    <tr><td colSpan="4" className="h-[85px] text-center text-[10px] text-[#89938c]">Belum ada aktivitas yang tercatat.</td></tr>
                  ) : (
                    logs.map((log, index) => (
                      <tr key={`${log.waktu}-${log.nama}-${index}`} className="transition-colors hover:bg-[#fafbfa]">
                        <td className="border-b border-[#edf0ed] py-[10px] pr-4 pl-[21px] text-[10px] text-[#748078]">
                          <div className="flex items-center gap-[10px]">
                            <span className="grid h-[29px] w-[29px] shrink-0 place-items-center rounded-full bg-[#dcebe3] text-[8px] font-semibold text-[#35664d]">
                              {log.nama?.split(/\s+/).map((part) => part[0]).join("").slice(0, 2)}
                            </span>
                            <strong className="text-[10px] font-semibold text-[#39463f]">{log.nama}</strong>
                          </div>
                        </td>
                        <td className="border-b border-[#edf0ed] px-4 py-[10px] text-[10px] text-[#748078]">{log.aktivitas}</td>
                        <td className="border-b border-[#edf0ed] px-4 py-[10px] text-[10px] text-[#748078]">{log.waktu}</td>
                        <td className="border-b border-[#edf0ed] px-4 py-[10px] text-[10px] text-[#748078]">
                          <span className={`inline-flex items-center gap-[6px] whitespace-nowrap rounded-full px-2 py-1 text-[9px] font-medium ${log.status === "Sukses" ? "bg-[#edf5ef] text-[#397553]" : "bg-[#fbefed] text-[#a85749]"}`}>
                            <span className={`h-[6px] w-[6px] rounded-full ${log.status === "Sukses" ? "bg-[#4b8a66]" : "bg-[#c87969]"}`} />
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <footer className="border-t border-[#edf0ed] px-[21px] py-3">
              <a href="/scanner" className="text-[10px] font-semibold text-[#397553] no-underline hover:underline">
                Kembali ke absensi
              </a>
            </footer>
          </section>
        </div>
      </main>
    </div>
  );
}
