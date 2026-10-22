import calendarIcon from "../assets/calendar.svg";
import notificationIcon from "../assets/notifications.svg";

export default function WorkspaceTopBar({ title }) {
  const currentDate = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <header className="flex min-h-[84px] items-center justify-between gap-4 border-b border-[#e7ebe7] bg-white px-9 py-[14px] max-[1100px]:px-6 max-[650px]:min-h-[74px] max-[650px]:px-[17px] max-[650px]:py-3">
      <div>
        <div className="text-[10px] font-medium text-[#929b95]">
          Ruang Kerja <span className="px-[7px] text-[#c5cbc6]">/</span>
        </div>
        <h1 className="mt-1.5 mb-0 text-lg font-semibold tracking-[-0.035em] text-[#202c26]">
          {title}
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
  );
}
