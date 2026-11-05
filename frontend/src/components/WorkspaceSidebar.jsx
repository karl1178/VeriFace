import dashboardIcon from "../assets/dashboard.svg";
import historyIcon from "../assets/history.svg";
import adminIcon from "../assets/profile.svg";
import settingsIcon from "../assets/settings.svg";

export default function WorkspaceSidebar({ activePage }) {
  const dashboardIsActive = activePage === "dashboard";
  const manageIsActive = activePage === "manage";
  const settingsIsActive = activePage === "settings";
  const attendanceIsActive = activePage === "attendance";
  const navClassName = "space-y-1 max-[850px]:ml-auto max-[850px]:flex max-[850px]:space-y-0 max-[850px]:gap-1";

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-[226px] flex-col border-r border-[var(--color-border)] bg-white px-4 pt-6 pb-5 max-[850px]:static max-[850px]:min-h-0 max-[850px]:w-auto max-[850px]:flex-row max-[850px]:items-center max-[850px]:border-r-0 max-[850px]:border-b max-[850px]:px-5 max-[850px]:py-[13px]">
      <a href="/dashboard" className="px-2 text-[23px] leading-7 font-semibold tracking-[-0.035em] text-[var(--color-ink)] no-underline max-[850px]:px-0 max-[850px]:text-xl">
        VeriFace
      </a>

      <p className="mt-[43px] mb-[10px] mx-[11px] text-[10px] font-semibold tracking-[0.13em] text-[var(--color-text-soft)] uppercase max-[850px]:hidden">
        Ruang Kerja
      </p>
      <nav aria-label="Ruang kerja" className={navClassName}>
        <a
          href={dashboardIsActive ? "#dashboard" : "/dashboard"}
          aria-current={dashboardIsActive ? "page" : undefined}
          className={dashboardIsActive
            ? "flex h-[37px] items-center gap-[11px] rounded-md bg-[var(--color-brand-wash)] px-[11px] text-xs font-semibold text-[var(--color-brand-hover)] no-underline max-[850px]:h-[34px]"
            : "flex h-[37px] items-center gap-[11px] rounded-md px-[11px] text-xs font-medium text-[var(--color-text-muted)] no-underline hover:bg-[var(--color-page)] max-[850px]:h-[34px]"}
        >
          <img src={dashboardIcon} className="h-[18px] w-[18px] shrink-0" alt="" aria-hidden="true" />
          Dashboard
        </a>
        <a
          href="/attendance"
          aria-current={attendanceIsActive ? "page" : undefined}
          className={attendanceIsActive
            ? "flex h-[37px] items-center gap-[11px] rounded-md bg-[var(--color-brand-wash)] px-[11px] text-xs font-semibold text-[var(--color-brand-hover)] no-underline max-[850px]:h-[34px]"
            : "mt-1 flex h-[37px] items-center gap-[11px] rounded-md px-[11px] text-xs font-medium text-[var(--color-text-muted)] no-underline transition hover:bg-[var(--color-page)] hover:text-[var(--color-brand-hover)] max-[850px]:mt-0 max-[850px]:h-[34px]"}
        >
          <img src={historyIcon} className="h-[18px] w-[18px] shrink-0" alt="" aria-hidden="true" />
          Riwayat Kehadiran
        </a>
        <a
          href="/manage"
          aria-current={manageIsActive ? "page" : undefined}
          className={manageIsActive
            ? "flex h-[37px] items-center gap-[11px] rounded-md bg-[var(--color-brand-wash)] px-[11px] text-xs font-semibold text-[var(--color-brand-hover)] no-underline max-[850px]:h-[34px]"
            : "mt-1 flex h-[37px] items-center gap-[11px] rounded-md px-[11px] text-xs font-medium text-[var(--color-text-muted)] no-underline transition hover:bg-[var(--color-page)] hover:text-[var(--color-brand-hover)] max-[850px]:mt-0 max-[850px]:h-[34px]"}
        >
          <img src={adminIcon} className="h-[18px] w-[18px] shrink-0" alt="" aria-hidden="true" />
          Kelola Karyawan
        </a>
        <a
          href={settingsIsActive ? "#settings" : "/settings"}
          aria-current={settingsIsActive ? "page" : undefined}
          className={settingsIsActive
            ? "flex h-[37px] items-center gap-[11px] rounded-md bg-[var(--color-brand-wash)] px-[11px] text-xs font-semibold text-[var(--color-brand-hover)] no-underline max-[850px]:h-[34px]"
            : "mt-1 flex h-[37px] items-center gap-[11px] rounded-md px-[11px] text-xs font-medium text-[var(--color-text-muted)] no-underline transition hover:bg-[var(--color-page)] hover:text-[var(--color-brand-hover)] max-[850px]:mt-0 max-[850px]:h-[34px]"}
        >
          <img src={settingsIcon} className="h-[18px] w-[18px] shrink-0" alt="" aria-hidden="true" />
          Pengaturan
        </a>
      </nav>

    </aside>
  );
}
