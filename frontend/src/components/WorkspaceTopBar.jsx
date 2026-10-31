import { useEffect, useRef, useState } from "react";
import calendarIcon from "../assets/calendar.svg";
import notificationIcon from "../assets/notification.svg";
import { apiRequest } from "../api.js";

const READ_NOTIFICATIONS_STORAGE_KEY = "veriface-read-notifications";
const NOTIFICATION_REFRESH_INTERVAL = 30000;
const currentDateFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

function formatNotificationTime(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Waktu tidak tersedia";

  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (elapsedMinutes < 1) return "Baru saja";
  if (elapsedMinutes < 60) return `${elapsedMinutes} menit lalu`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours} jam lalu`;
  const elapsedDays = Math.floor(elapsedHours / 24);
  return `${elapsedDays} hari lalu`;
}

function buildNotifications(logs) {
  const groupedLogs = [];

  for (const log of logs) {
    const isRelevant =
      log.aktivitas === "Absen Masuk" &&
      (log.status_proses !== "Sukses" || log.status_kehadiran === "terlambat");

    if (!isRelevant) continue;

    const notificationType = log.status_proses === "Sukses" ? "late" : "failure";
    const previousGroup = groupedLogs[groupedLogs.length - 1];
    if (previousGroup?.type === notificationType) {
      previousGroup.logs.push(log);
    } else {
      groupedLogs.push({ type: notificationType, logs: [log] });
    }
  }

  return groupedLogs.slice(0, 5).map(({ type, logs: groupLogs }) => {
    const latestLog = groupLogs[0];
    const count = groupLogs.length;
    const isLate = type === "late";
    return {
      id: `log-${latestLog.id}`,
      title: `${isLate ? "Absensi terlambat" : "Absensi gagal"}${count > 1 ? ` ${count}x` : ""}`,
      message: isLate
        ? count > 1
          ? `${count} absensi karyawan tercatat terlambat.`
          : `${latestLog.nama} tercatat terlambat melakukan absensi.`
        : "Percobaan absensi untuk Tidak Dikenal tidak dikenali.",
      time: formatNotificationTime(latestLog.waktu_iso),
    };
  });
}

function loadReadNotifications() {
  try {
    const storedNotifications = window.localStorage.getItem(READ_NOTIFICATIONS_STORAGE_KEY);
    return new Set(JSON.parse(storedNotifications || "[]"));
  } catch {
    return new Set();
  }
}

export default function WorkspaceTopBar({ title }) {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationError, setNotificationError] = useState("");
  const [readNotifications, setReadNotifications] = useState(loadReadNotifications);
  const notificationRef = useRef(null);

  const currentDate = currentDateFormatter.format(new Date());
  const unreadCount = notifications.reduce(
    (count, notification) => count + (readNotifications.has(notification.id) ? 0 : 1),
    0,
  );

  useEffect(() => {
    let active = true;

    async function fetchNotifications() {
      try {
        const logs = await apiRequest("/api/logs");
        if (!active || !Array.isArray(logs)) return;
        setNotificationError("");
        setNotifications(buildNotifications(logs));
      } catch (error) {
        if (active) {
          setNotificationError(error instanceof Error ? error.message : "Notifikasi tidak dapat dimuat.");
        }
      }
    }

    fetchNotifications();
    const refreshTimer = window.setInterval(
      fetchNotifications,
      NOTIFICATION_REFRESH_INTERVAL,
    );

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
      active = false;
      window.clearInterval(refreshTimer);
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      READ_NOTIFICATIONS_STORAGE_KEY,
      JSON.stringify([...readNotifications]),
    );
  }, [readNotifications]);

  function markNotificationRead(id) {
    setReadNotifications((current) => new Set(current).add(id));
  }

  function markAllNotificationsRead() {
    setReadNotifications(new Set(notifications.map(({ id }) => id)));
  }

  return (
    <header className="flex min-h-[84px] items-center justify-between gap-4 border-b border-[var(--color-border)] bg-white px-9 py-[14px] max-[1100px]:px-6 max-[650px]:min-h-[74px] max-[650px]:px-[17px] max-[650px]:py-3">
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
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            className="relative grid h-[34px] w-[34px] cursor-pointer place-items-center rounded-md border border-[var(--color-border)] bg-white text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-muted)]"
            aria-label={`Notifikasi${unreadCount ? `, ${unreadCount} belum dibaca` : ""}`}
            aria-expanded={isNotificationOpen}
            aria-haspopup="dialog"
            onClick={() => setIsNotificationOpen((current) => !current)}
          >
            <img src={notificationIcon} className="h-[15px] w-[15px]" alt="" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute -right-[5px] -top-[5px] grid h-[15px] min-w-[15px] place-items-center rounded-full border-2 border-white bg-[var(--color-notification)] px-[3px] text-[8px] font-bold leading-none text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotificationOpen && (
            <div
              role="dialog"
              aria-label="Notifikasi"
              className="absolute right-0 top-[44px] z-50 w-[360px] overflow-hidden rounded-[12px] border border-[var(--color-border)] bg-white shadow-[0_16px_40px_rgba(35,52,43,0.16)] max-[650px]:fixed max-[650px]:left-[15px] max-[650px]:right-[15px] max-[650px]:top-[67px] max-[650px]:w-auto"
            >
              <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-[18px] py-[15px]">
                <div>
                  <h2 className="m-0 text-[13px] font-semibold text-[var(--color-ink)]">Notifikasi</h2>
                  <p className="mt-[3px] mb-0 text-[10px] text-[var(--color-text-soft)]">
                    {unreadCount ? `${unreadCount} belum dibaca` : "Semua sudah dibaca"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={markAllNotificationsRead}
                  disabled={unreadCount === 0}
                  className="border-0 bg-transparent px-0 text-[10px] font-semibold text-[var(--color-brand)] disabled:cursor-default disabled:text-[var(--color-text-placeholder)]"
                >
                  Tandai semua dibaca
                </button>
              </div>

              <div className="max-h-[390px] overflow-y-auto py-[5px]">
                {notificationError ? (
                  <p className="px-[18px] py-[20px] text-center text-[10px] text-[var(--color-danger)]">
                    {notificationError}
                  </p>
                ) : notifications.length === 0 ? (
                  <p className="px-[18px] py-[20px] text-center text-[10px] text-[var(--color-text-soft)]">
                    Belum ada aktivitas terbaru.
                  </p>
                ) : notifications.map((notification) => {
                  const isUnread = !readNotifications.has(notification.id);
                  return (
                    <button
                      type="button"
                      key={notification.id}
                      onClick={() => markNotificationRead(notification.id)}
                      className={`flex w-full items-start border-0 px-[18px] py-[12px] text-left transition hover:bg-[var(--color-surface-muted)] ${
                        isUnread ? "bg-[var(--color-surface-muted)]" : "bg-white"
                      }`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-[7px]">
                          <span className="text-[11px] font-semibold text-[var(--color-ink-secondary)]">{notification.title}</span>
                          {isUnread && <span className="h-[6px] w-[6px] rounded-full bg-[var(--color-notification)]" />}
                        </span>
                        <span className="mt-[3px] block text-[10px] leading-[1.45] text-[var(--color-text-muted)]">
                          {notification.message}
                        </span>
                        <span className="mt-[5px] block text-[9px] text-[var(--color-text-placeholder)]">{notification.time}</span>
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
