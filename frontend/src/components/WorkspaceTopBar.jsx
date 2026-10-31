import { useEffect, useState } from "react";
import calendarIcon from "../assets/calendar.svg";
import profileIcon from "../assets/profile.svg";
import { apiRequest } from "../api.js";

const currentDateFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

export default function WorkspaceTopBar({ title }) {
  const [profile, setProfile] = useState({ name: "Administrator", email: "" });
  const currentDate = currentDateFormatter.format(new Date());

  useEffect(() => {
    let active = true;

    apiRequest("/api/auth/me")
      .then((data) => {
        if (!active || !data?.admin) return;
        setProfile({
          name: data.admin.name?.trim() || "Administrator",
          email: data.admin.email?.trim() || "",
        });
      })
      .catch((error) => {
        console.error("TOP BAR PROFILE ERROR:", error);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <header className="sticky top-0 z-10 flex min-h-[84px] items-center justify-between gap-4 border-b border-[var(--color-border)] bg-white px-9 py-[14px] max-[1100px]:px-6 max-[650px]:min-h-[74px] max-[650px]:px-[17px] max-[650px]:py-3">
      <div>
        <div className="text-[10px] font-medium text-[var(--color-text-soft)]">
          Ruang Kerja <span className="px-[7px] text-[var(--color-border-subtle)]">/</span>
        </div>
        <h1 className="mt-1.5 mb-0 text-lg font-semibold tracking-[-0.035em] text-[var(--color-ink)]">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-4 max-[650px]:gap-[9px]">
        <div className="flex items-center gap-[10px] text-[10px] text-[var(--color-text-muted)] max-[650px]:hidden">
          <img src={calendarIcon} className="h-3 w-3 shrink-0" alt="" aria-hidden="true" />
          <time>{currentDate}</time>
        </div>
        <span className="h-[26px] w-px bg-[var(--color-border)] max-[650px]:hidden" />
        <div className="flex max-w-[190px] items-center gap-[9px] rounded-[6px] border border-[var(--color-border)] bg-white px-[9px] py-[6px] max-[650px]:max-w-[155px]">
          <img
            src={profileIcon}
            className="h-[20px] w-[20px] shrink-0"
            alt=""
            aria-hidden="true"
          />
          <div className="min-w-0 leading-none">
            <strong className="block overflow-hidden text-ellipsis whitespace-nowrap text-[10px] font-semibold text-[var(--color-ink-secondary)]">
              {profile.name}
            </strong>
            <span className="mt-[2px] block overflow-hidden text-ellipsis whitespace-nowrap text-[8px] text-[var(--color-text-soft)]">
              {profile.email || "Administrator"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
