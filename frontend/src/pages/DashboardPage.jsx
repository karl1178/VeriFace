import { useCallback, useEffect, useState } from "react";
import searchIcon from "../assets/search.svg";
import refreshIcon from "../assets/reset.svg"
import WorkspaceSidebar from "../components/WorkspaceSidebar.jsx";
import WorkspaceTopBar from "../components/WorkspaceTopBar.jsx";
import { apiRequest } from "../api.js";

export default function DashboardPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const filteredLogs = logs.filter((log) =>
    log.nama?.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/api/logs");
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
    <div className="min-h-screen bg-[#f5f7f5] text-[#202c26]">
      <WorkspaceSidebar activePage="dashboard" />

      <main className="ml-[226px] min-h-screen max-[850px]:ml-0" id="dashboard">
        <WorkspaceTopBar title="Dashboard" />

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
                  className="inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-md border border-[#dfe5df] bg-white text-[10px] font-semibold text-[#405047] transition hover:bg-[#f8faf8] disabled:cursor-wait disabled:opacity-[0.65]"
                  title="Segarkan data kehadiran"
                >
                  <img src={refreshIcon} className="h-4 w-4 shrink-0" alt="" aria-hidden="true" />
                </button>
                <label className="flex h-[30px] w-[203px] items-center gap-2 rounded-md border border-[#e7ebe7] px-[10px] text-[9px] text-[#a0a8a2] max-[650px]:w-[150px] max-[650px]:shrink-0">
                  <img src={searchIcon} className="h-3 w-3 shrink-0" alt="" aria-hidden="true" />
                  <input
                    type="search"
                    aria-label="Cari berdasarkan nama"
                    placeholder="Cari karyawan"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-[10px] text-[#344139] outline-none placeholder:text-[#a0a8a2]"
                  />
                </label>
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
                  ) : filteredLogs.length === 0 ? (
                    <tr><td colSpan="4" className="h-[85px] text-center text-[10px] text-[#89938c]">Tidak ada karyawan dengan nama tersebut.</td></tr>
                  ) : (
                    filteredLogs.map((log, index) => (
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
                Buka Halaman Absensi
              </a>
            </footer>
          </section>
        </div>
      </main>
    </div>
  );
}
