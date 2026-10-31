import { useEffect, useRef, useState } from "react";
import calendarIcon from "../assets/calendar.svg";
import notificationIcon from "../assets/notification.svg";

export default function WorkspaceTopBar({ title }) {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [readNotifications, setReadNotifications] = useState(new Set());
  const notificationRef = useRef(null);

  const currentDate = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const notifications = [
    {
      id: 1,
      title: "Absensi baru",
      message: "Kehadiran karyawan telah berhasil dicatat.",
      time: "Baru saja",
    },
    {
      id: 2,
      title: "Karyawan diperbarui",
      message: "Data profil karyawan berhasil diperbarui.",
      time: "25 menit lalu",
    },
    {
      id: 3,
      title: "Sistem siap digunakan",
      message: "Pemindaian wajah aktif dan berjalan normal.",
      time: "1 jam lalu",
    },
  ];

  const unreadCount = notifications.filter(
    (notification) => !readNotifications.has(notification.id),
  ).length;

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setIsNotificationOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsNotificationOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function markNotificationRead(id) {
    setReadNotifications((current) => new Set([...current, id]));
  }

  function markAllNotificationsRead() {
    setReadNotifications(new Set(notifications.map(({ id }) => id)));
  }

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
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            className="relative grid h-[34px] w-[34px] cursor-pointer place-items-center rounded-md border border-[#e7ebe7] bg-white text-[#66736b] transition hover:bg-[#f8faf8]"
            aria-label={`Notifikasi${unreadCount ? `, ${unreadCount} belum dibaca` : ""}`}
            aria-expanded={isNotificationOpen}
            aria-haspopup="dialog"
            onClick={() => setIsNotificationOpen((current) => !current)}
          >
            <img src={notificationIcon} className="h-[15px] w-[15px]" alt="" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute -right-[5px] -top-[5px] grid h-[15px] min-w-[15px] place-items-center rounded-full border-2 border-white bg-[#d64545] px-[3px] text-[8px] font-bold leading-none text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotificationOpen && (
            <div
              role="dialog"
              aria-label="Notifikasi"
              className="absolute right-0 top-[44px] z-50 w-[360px] overflow-hidden rounded-[12px] border border-[#e3e8e3] bg-white shadow-[0_16px_40px_rgba(35,52,43,0.16)] max-[650px]:fixed max-[650px]:left-[15px] max-[650px]:right-[15px] max-[650px]:top-[67px] max-[650px]:w-auto"
            >
              <div className="flex items-center justify-between border-b border-[#edf0ed] px-[18px] py-[15px]">
                <div>
                  <h2 className="m-0 text-[13px] font-semibold text-[#26352c]">Notifikasi</h2>
                  <p className="mt-[3px] mb-0 text-[10px] text-[#929b95]">
                    {unreadCount ? `${unreadCount} belum dibaca` : "Semua sudah dibaca"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={markAllNotificationsRead}
                  disabled={unreadCount === 0}
                  className="border-0 bg-transparent px-0 text-[10px] font-semibold text-[#397553] disabled:cursor-default disabled:text-[#a7afa9]"
                >
                  Tandai semua dibaca
                </button>
              </div>

              <div className="max-h-[390px] overflow-y-auto py-[5px]">
                {notifications.map((notification) => {
                  const isUnread = !readNotifications.has(notification.id);
                  return (
                    <button
                      type="button"
                      key={notification.id}
                      onClick={() => markNotificationRead(notification.id)}
                      className={`flex w-full items-start border-0 px-[18px] py-[12px] text-left transition hover:bg-[#f7faf7] ${
                        isUnread ? "bg-[#fbfdfb]" : "bg-white"
                      }`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-[7px]">
                          <span className="text-[11px] font-semibold text-[#344139]">{notification.title}</span>
                          {isUnread && <span className="h-[6px] w-[6px] rounded-full bg-[#d64545]" />}
                        </span>
                        <span className="mt-[3px] block text-[10px] leading-[1.45] text-[#7d8981]">
                          {notification.message}
                        </span>
                        <span className="mt-[5px] block text-[9px] text-[#a0a8a2]">{notification.time}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
