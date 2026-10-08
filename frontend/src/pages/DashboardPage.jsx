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
    <div className="min-h-screen bg-[#f5f7f5] text-[#202c26]">
      <aside className="fixed inset-y-0 left-0 z-20 flex w-[226px] flex-col border-r border-[#e7ebe7] bg-white px-4 pt-6 pb-5 max-[850px]:static max-[850px]:min-h-0 max-[850px]:w-auto max-[850px]:flex-row max-[850px]:items-center max-[850px]:border-r-0 max-[850px]:border-b max-[850px]:px-5 max-[850px]:py-[13px]">
        <a href="/dashboard.html" className="px-2 text-[23px] leading-7 font-semibold tracking-[-0.035em] text-[#202c26] no-underline max-[850px]:px-0 max-[850px]:text-xl">
          VeriFace
        </a>

        <p className="mt-[43px] mb-[10px] mx-[11px] text-[10px] font-semibold tracking-[0.13em] text-[#929b95] uppercase max-[850px]:hidden">
          Workspace
        </p>
        <nav aria-label="Workspace" className="max-[850px]:ml-auto">
          <a
            href="#dashboard"
            aria-current="page"
            className="flex h-[37px] items-center gap-[11px] rounded-md bg-[#edf4ef] px-[11px] text-xs font-semibold text-[#28634c] no-underline max-[850px]:h-[34px]"
          >
            <svg className="h-[15px] w-[15px] fill-none stroke-current stroke-[1.5]" viewBox="0 0 20 20" aria-hidden="true">
              <rect x="2.5" y="2.5" width="6" height="6" rx="1" />
              <rect x="11.5" y="2.5" width="6" height="6" rx="1" />
              <rect x="2.5" y="11.5" width="6" height="6" rx="1" />
              <rect x="11.5" y="11.5" width="6" height="6" rx="1" />
            </svg>
            Dashboard
          </a>
        </nav>

        <div className="mt-auto max-[850px]:hidden">
          <section className="rounded-lg border border-[#e7ebe7] bg-[#fafbfa] p-[14px]">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-[#39463f]">
              <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-[#4c9a6d]" />
              Face scan system
            </div>
            <p className="mt-2 mb-0 text-[10px] leading-[1.7] text-[#7b857e]">
              Ready for attendance. Sample dashboard data.
            </p>
          </section>
          <div className="flex items-center gap-[11px] px-[7px] pt-[18px]">
            <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full bg-[#e7ece8] text-[9px] font-semibold text-[#4b5b51]">
              AC
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block overflow-hidden text-ellipsis whitespace-nowrap text-[11px] font-semibold text-[#344139]">
                Alvaro Caesar
              </strong>
              <small className="mt-[3px] block overflow-hidden text-ellipsis whitespace-nowrap text-[9px] text-[#8a948d]">
                Administrator
              </small>
            </span>
            <svg className="h-[14px] w-[14px] shrink-0 fill-none stroke-[#89938c] stroke-[1.5]" viewBox="0 0 20 20" aria-hidden="true">
              <path d="m6 8 4 4 4-4" />
            </svg>
          </div>
        </div>
      </aside>

      <main className="ml-[226px] min-h-screen max-[850px]:ml-0" id="dashboard">
        <header className="flex min-h-[84px] items-center justify-between gap-4 border-b border-[#e7ebe7] bg-white px-9 py-[14px] max-[1100px]:px-6 max-[650px]:min-h-[74px] max-[650px]:px-[17px] max-[650px]:py-3">
          <div>
            <div className="text-[10px] font-medium text-[#929b95]">
              Workspace <span className="px-[7px] text-[#c5cbc6]">/</span> Overview
            </div>
            <h1 className="mt-1.5 mb-0 text-lg font-semibold tracking-[-0.035em] text-[#202c26]">
              Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-4 max-[650px]:gap-[9px]">
            <div className="flex items-center gap-[7px] text-[10px] text-[#748078] max-[650px]:hidden">
              <svg className="h-[14px] w-[14px] fill-none stroke-[#7d8a81] stroke-[1.4]" viewBox="0 0 20 20" aria-hidden="true">
                <rect x="3" y="4.5" width="14" height="13" rx="1.5" />
                <path d="M6.5 2.5v4M13.5 2.5v4M3 8h14M6.5 11h1M10 11h1M13.5 11h1M6.5 14h1M10 14h1" />
              </svg>
              <time>Friday, October 2, 2026</time>
            </div>
            <span className="h-[26px] w-px bg-[#e7ebe7] max-[650px]:hidden" />
            <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-[#f1f5f2] px-[11px] py-[7px] text-[10px] font-medium text-[#4c6657]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4c9a6d]" />
              Demo data
            </span>
            <span
              className="grid h-[34px] w-[34px] place-items-center rounded-md border border-[#e7ebe7] text-[#66736b] max-[650px]:hidden"
              aria-label="Notifications"
            >
              <svg className="h-4 w-4 fill-none stroke-current stroke-[1.35]" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M15.5 8.5a5.5 5.5 0 0 0-11 0c0 6-2 6-2 7.5h15c0-1.5-2-1.5-2-7.5ZM8 18h4" />
              </svg>
            </span>
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1440px] px-[34px] pt-[30px] pb-[38px] max-[1100px]:px-6 max-[650px]:px-[15px] max-[650px]:pt-[23px] max-[650px]:pb-[30px]">
          <div className="mb-[21px] flex items-end justify-between gap-4 max-[650px]:items-start max-[390px]:flex-col">
            <div>
              <h2 className="m-0 text-[15px] font-semibold tracking-[-0.025em] text-[#202c26] max-[650px]:text-sm">
                Good morning, Alvaro
              </h2>
              <p className="mt-[5px] mb-0 text-[11px] text-[#89938c] max-[650px]:max-w-[225px] max-[650px]:leading-[1.5]">
                Here&apos;s what&apos;s happening with your team today.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchLogs}
              disabled={loading}
              className="inline-flex h-[34px] shrink-0 items-center gap-2 rounded-md border border-[#dfe5df] bg-white px-3 text-[10px] font-semibold text-[#405047] transition hover:bg-[#f8faf8] disabled:cursor-wait disabled:opacity-[0.65] max-[650px]:px-[9px] max-[650px]:text-[9px]"
            >
              <svg className="h-[14px] w-[14px] fill-none stroke-current stroke-[1.5]" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M10 3v10m0 0 3.5-3.5M10 13l-3.5-3.5M4 13.5v3h12v-3" />
              </svg>
              {loading ? "Memuat..." : "Refresh data"}
            </button>
          </div>

          <section className="grid grid-cols-4 gap-[11px] max-[1100px]:[&>article]:p-[14px] max-[650px]:grid-cols-2 max-[390px]:[&>article]:min-h-[118px] max-[390px]:[&>article]:p-[11px]" aria-label="Attendance summary">
            {[
              { label: "Present today", value: "142", description: "of 156 employees", change: "↗ +4.8%", positive: true, icon: <><circle cx="7" cy="6" r="3" /><path d="M1.8 16v-1.5A4.5 4.5 0 0 1 6.3 10h1.4a4.5 4.5 0 0 1 4.5 4.5V16M13 3.3a3 3 0 0 1 0 5.8m1.2 1.3a4.3 4.3 0 0 1 4 4.3V16" /></> },
              { label: "Late arrivals", value: "8", description: "vs. 11 yesterday", change: "↗ -3 today", positive: true, icon: <><circle cx="10" cy="10" r="7" /><path d="M10 5.5V10l3 1.8" /></> },
              { label: "Absent today", value: "6", description: "3.8% of workforce", change: "↘ +2 today", positive: false, icon: <path d="M5 5l10 10M7 15h8V7" /> },
              { label: "Average check-in", value: "08:42", description: "12 min earlier", change: "↗ -12 min", positive: true, icon: <><rect x="3" y="4.5" width="14" height="13" rx="1.5" /><path d="M6.5 2.5v4M13.5 2.5v4M3 8h14M6.5 11h1M10 11h1M13.5 11h1M6.5 14h1M10 14h1" /></> },
            ].map((card) => (
              <article key={card.label} className="min-h-[123px] rounded-[9px] border border-[#e7ebe7] bg-white p-4">
                <div className="flex items-center justify-between text-[11px] font-medium text-[#748078]">
                  <span>{card.label}</span>
                  <span className="grid h-[29px] w-[29px] shrink-0 place-items-center rounded-md bg-[#f3f6f3] text-[#61766a]">
                    <svg className="h-[15px] w-[15px] fill-none stroke-current stroke-[1.4]" viewBox="0 0 20 20" aria-hidden="true">
                      {card.icon}
                    </svg>
                  </span>
                </div>
                <strong className="mt-[9px] block text-2xl leading-none font-semibold tracking-[-0.055em] text-[#202c26]">
                  {card.value}
                </strong>
                <div className="mt-[9px] flex items-center justify-between gap-[5px] text-[9px] text-[#929b95] max-[390px]:text-[8px]">
                  <span>{card.description}</span>
                  <span className={`whitespace-nowrap text-[9px] font-semibold max-[390px]:text-[8px] ${card.positive ? "text-[#397553]" : "text-[#c87969]"}`}>
                    {card.change}
                  </span>
                </div>
              </article>
            ))}
          </section>

          <section className="mt-[14px] grid grid-cols-[minmax(0,1.65fr)_minmax(290px,0.9fr)] gap-[14px] max-[1100px]:grid-cols-[minmax(0,1.35fr)_minmax(265px,0.9fr)] max-[850px]:grid-cols-[minmax(0,1.4fr)_minmax(250px,0.9fr)] max-[650px]:grid-cols-1">
            <article className="min-h-[282px] rounded-[9px] border border-[#e7ebe7] bg-white px-[21px] py-5 max-[650px]:h-[282px]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="m-0 text-xs font-semibold text-[#344139]">Attendance rate</h3>
                  <p className="mt-[5px] mb-0 text-[10px] text-[#89938c]">Team check-ins over time</p>
                </div>
                <span className="inline-flex h-[30px] items-center gap-3 rounded-md border border-[#e7ebe7] px-[10px] text-[10px] text-[#526057]">
                  Week <span className="text-sm text-[#89938c]">⌄</span>
                </span>
              </div>
              <div className="mt-5 flex items-baseline gap-[7px]">
                <strong className="text-2xl font-semibold tracking-[-0.055em] text-[#202c26]">91%</strong>
                <span className="text-[9px] font-semibold text-[#397553]">↗ 2.4%</span>
                <span className="text-[9px] text-[#929b95]">vs. previous week</span>
              </div>
              <div className="relative mt-[14px] h-[148px] border-b border-[#edf0ed]" aria-label="Weekly attendance rate chart">
                <div className="absolute inset-x-0 top-0 border-t border-dashed border-[#edf0ed]" />
                <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-[#edf0ed]" />
                <div className="relative flex h-full justify-around gap-2 px-[14px]">
                  {[
                    ["Mon", "88%"],
                    ["Tue", "94%"],
                    ["Wed", "91%"],
                    ["Thu", "96%"],
                    ["Fri", "91%"],
                    ["Sat", "42%"],
                    ["Sun", "28%"],
                  ].map(([day, height]) => (
                    <div key={day} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-[7px] text-[9px] text-[#929b95]">
                      <div
                        className={`min-h-[3px] w-[min(32px,62%)] rounded-t-[3px] ${day === "Fri" ? "bg-[#347755]" : "bg-[#c8dbcf]"}`}
                        style={{ height }}
                      />
                      <span className={day === "Fri" ? "font-semibold text-[#347755]" : ""}>{day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <article className="min-h-[282px] rounded-[9px] border border-[#e7ebe7] bg-white px-[21px] py-5 max-[650px]:min-h-0 max-[650px]:pb-[17px]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="m-0 text-xs font-semibold text-[#344139]">Today&apos;s breakdown</h3>
                  <p className="mt-[5px] mb-0 text-[10px] text-[#89938c]">Attendance across 156 employees</p>
                </div>
                <span className="grid h-[29px] w-[29px] shrink-0 place-items-center rounded-md bg-[#f3f6f3] text-[#61766a]">
                  <svg className="h-[15px] w-[15px] fill-none stroke-current stroke-[1.6]" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="m4 10 4 4 8-8" />
                  </svg>
                </span>
              </div>
              <div className="mt-[23px] grid gap-[18px]">
                {[
                  { label: "On time", count: "142", percent: "91%", width: "w-[91%]", color: "bg-[#4b8a66]" },
                  { label: "Late", count: "8", percent: "5%", width: "w-[5%]", color: "bg-[#d4a15f]" },
                  { label: "Absent", count: "6", percent: "4%", width: "w-[4%]", color: "bg-[#c87969]" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="mb-[7px] flex justify-between text-[10px] text-[#536057]">
                      <span>{item.label} <small className="ml-[7px] text-[inherit] text-[#929b95]">{item.count}</small></span>
                      <span className="text-[#7b867f]">{item.percent}</span>
                    </div>
                    <div className="h-[6px] overflow-hidden rounded-full bg-[#eff2ef]">
                      <span className={`block h-full rounded-full ${item.width} ${item.color}`} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-[19px] flex items-center gap-[7px] border-t border-[#edf0ed] pt-[13px] text-[9px] text-[#929b95]">
                <svg className="h-[13px] w-[13px] shrink-0 fill-none stroke-[#8a978e] stroke-[1.4]" viewBox="0 0 20 20" aria-hidden="true">
                  <circle cx="10" cy="10" r="7" />
                  <path d="M10 5.5V10l3 1.8" />
                </svg>
                Last check-in recorded at 09:18 AM
              </div>
            </article>
          </section>

          <section className="mt-[14px] overflow-hidden rounded-[9px] border border-[#e7ebe7] bg-white">
            <div className="flex min-h-[65px] items-center justify-between gap-3 border-b border-[#edf0ed] px-[21px] py-[13px] max-[650px]:pr-[14px] max-[650px]:pl-[14px]">
              <div>
                <h3 className="m-0 text-xs font-semibold text-[#344139]">Recent attendance</h3>
                <p className="mt-[5px] mb-0 text-[10px] text-[#89938c]">Latest employee check-ins today</p>
              </div>
              <div className="flex h-[30px] w-[203px] items-center gap-2 rounded-md border border-[#e7ebe7] px-[10px] text-[9px] text-[#a0a8a2] max-[650px]:w-[150px] max-[650px]:shrink-0">
                <svg className="h-[14px] w-[14px] shrink-0 fill-none stroke-[#9aa39d] stroke-[1.5]" viewBox="0 0 20 20" aria-hidden="true">
                  <circle cx="8.5" cy="8.5" r="5.5" />
                  <path d="m13 13 4 4" />
                </svg>
                Search employees
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse text-left">
                <thead className="bg-[#fafbfa] text-[9px] font-medium text-[#89938c]">
                  <tr>
                    <th className="px-5 py-[9px] pl-[21px] font-medium" scope="col">Employee</th>
                    <th className="px-5 py-[9px] font-medium" scope="col">Activity</th>
                    <th className="px-5 py-[9px] font-medium" scope="col">Check-in</th>
                    <th className="px-5 py-[9px] font-medium" scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="4" className="h-[85px] text-center text-[10px] text-[#89938c]">Loading attendance data...</td></tr>
                  ) : error ? (
                    <tr><td colSpan="4" className="h-[85px] text-center text-[10px] text-[#b5473a]">{error}</td></tr>
                  ) : logs.length === 0 ? (
                    <tr><td colSpan="4" className="h-[85px] text-center text-[10px] text-[#89938c]">No activity has been recorded yet.</td></tr>
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
              <a href="/" className="text-[10px] font-semibold text-[#397553] no-underline hover:underline">
                Kembali ke absensi
              </a>
            </footer>
          </section>
        </div>
      </main>
    </div>
  );
}
