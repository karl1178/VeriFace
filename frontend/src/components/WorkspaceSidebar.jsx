import dashboardIcon from "../assets/dashboard.svg";
import adminIcon from "../assets/admin.svg";

export default function WorkspaceSidebar({ activePage }) {
  const dashboardIsActive = activePage === "dashboard";
  const manageIsActive = activePage === "manage";
  const navClassName = dashboardIsActive
    ? "max-[850px]:ml-auto"
    : "space-y-1 max-[850px]:ml-auto max-[850px]:flex max-[850px]:space-y-0 max-[850px]:gap-1";

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-[226px] flex-col border-r border-[#e7ebe7] bg-white px-4 pt-6 pb-5 max-[850px]:static max-[850px]:min-h-0 max-[850px]:w-auto max-[850px]:flex-row max-[850px]:items-center max-[850px]:border-r-0 max-[850px]:border-b max-[850px]:px-5 max-[850px]:py-[13px]">
      <a href="/dashboard" className="px-2 text-[23px] leading-7 font-semibold tracking-[-0.035em] text-[#202c26] no-underline max-[850px]:px-0 max-[850px]:text-xl">
        VeriFace
      </a>

      <p className="mt-[43px] mb-[10px] mx-[11px] text-[10px] font-semibold tracking-[0.13em] text-[#929b95] uppercase max-[850px]:hidden">
        Ruang Kerja
      </p>
      <nav aria-label="Ruang kerja" className={navClassName}>
        <a
          href={dashboardIsActive ? "#dashboard" : "/dashboard"}
          aria-current={dashboardIsActive ? "page" : undefined}
          className={dashboardIsActive
            ? "flex h-[37px] items-center gap-[11px] rounded-md bg-[#edf4ef] px-[11px] text-xs font-semibold text-[#28634c] no-underline max-[850px]:h-[34px]"
            : "flex h-[37px] items-center gap-[11px] rounded-md px-[11px] text-xs font-medium text-[#748078] no-underline hover:bg-[#f5f7f5] max-[850px]:h-[34px]"}
        >
          <img src={dashboardIcon} className="h-[18px] w-[18px] shrink-0" alt="" aria-hidden="true" />
          Dashboard
        </a>
        <a
          href="/manage"
          aria-current={manageIsActive ? "page" : undefined}
          className={manageIsActive
            ? "flex h-[37px] items-center gap-[11px] rounded-md bg-[#edf4ef] px-[11px] text-xs font-semibold text-[#28634c] no-underline max-[850px]:h-[34px]"
            : "mt-1 flex h-[37px] items-center gap-[11px] rounded-md px-[11px] text-xs font-medium text-[#748078] no-underline transition hover:bg-[#f5f7f5] hover:text-[#28634c] max-[850px]:mt-0 max-[850px]:h-[34px]"}
        >
          <img src={adminIcon} className="h-[18px] w-[18px] shrink-0" alt="" aria-hidden="true" />
          Kelola Karyawan
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
  );
}
