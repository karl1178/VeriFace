import { useState } from "react";
import WorkspaceSidebar from "../components/WorkspaceSidebar.jsx";
import WorkspaceTopBar from "../components/WorkspaceTopBar.jsx";
import { apiRequest } from "../api.js";

export default function SettingsPage() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function logout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.replace("/login");
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-page)] text-[var(--color-ink)]">
      <WorkspaceSidebar activePage="settings" />

      <main className="ml-[226px] min-h-screen max-[850px]:ml-0" id="settings">
        <WorkspaceTopBar title="Keamanan Akun" />

        <div className="mx-auto w-full max-w-[1440px] px-[34px] pt-[30px] pb-[38px] max-[1100px]:px-6 max-[650px]:px-[15px] max-[650px]:pt-[23px] max-[650px]:pb-[30px]">
          <section className="overflow-hidden rounded-[8px] border border-[var(--color-border)] bg-white">
            <h2 className="m-0 border-b border-[var(--color-border-subtle)] px-[18px] py-[16px] text-[12px] font-semibold text-[var(--color-ink)]">
              Keamanan Akun
            </h2>

            <div className="divide-y divide-[var(--color-border-subtle)] px-[18px]">
              <div className="py-[13px]">
                <label className="mb-[8px] block text-[11px] font-semibold text-[var(--color-ink-secondary)]" htmlFor="admin-name">Nama Admin</label>
                <div className="flex items-center gap-[10px] max-[650px]:items-end">
                  <input
                    id="admin-name"
                    type="text"
                    readOnly
                    placeholder="Administrator"
                    className="h-[38px] min-w-0 flex-1 rounded-[5px] border border-[var(--color-border-input)] bg-white px-[12px] text-[11px] text-[var(--color-ink-secondary)] outline-none placeholder:text-[var(--color-text-placeholder)] focus:border-[var(--color-brand)]"
                  />
                  <button type="button" className="h-[34px] shrink-0 rounded-md bg-[var(--color-brand)] px-[13px] text-[10px] font-semibold text-white transition hover:bg-[var(--color-brand-hover)]">
                    Ubah Nama Admin
                  </button>
                </div>
              </div>

              <div className="py-[13px]">
                <div className="mb-[8px] flex items-center justify-between gap-3">
                  <span className="text-[11px] font-semibold text-[var(--color-ink-secondary)]">Kata Sandi</span>
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-[10px] max-[650px]:grid-cols-1">
                  <div>
                    <label className="mb-[5px] block text-[9px] font-medium text-[var(--color-text-soft)]" htmlFor="current-password">Kata sandi saat ini</label>
                    <input
                      id="current-password"
                      type="password"
                      placeholder="********"
                      autoComplete="current-password"
                      className="h-[38px] w-full rounded-[5px] border border-[var(--color-border-input)] bg-white px-[12px] text-[11px] text-[var(--color-ink-secondary)] outline-none placeholder:text-[var(--color-text-placeholder)] focus:border-[var(--color-brand)]"
                    />
                  </div>
                  <div>
                    <label className="mb-[5px] block text-[9px] font-medium text-[var(--color-text-soft)]" htmlFor="new-password">Kata sandi baru</label>
                    <input
                      id="new-password"
                      type="password"
                      placeholder="********"
                      autoComplete="new-password"
                      className="h-[38px] w-full rounded-[5px] border border-[var(--color-border-input)] bg-white px-[12px] text-[11px] text-[var(--color-ink-secondary)] outline-none placeholder:text-[var(--color-text-placeholder)] focus:border-[var(--color-brand)]"
                    />
                  </div>
                  <button type="button" className="h-[34px] shrink-0 rounded-md bg-[var(--color-brand)] px-[13px] text-[10px] font-semibold text-white transition hover:bg-[var(--color-brand-hover)] max-[650px]:mt-[2px]">
                    Ubah Kata Sandi
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 py-[12px]">
                <div>
                  <h3 className="m-0 text-[11px] font-semibold text-[var(--color-ink-secondary)]">Keluar</h3>
                  <p className="mt-[4px] mb-0 text-[9px] leading-[1.4] text-[var(--color-text-soft)]">Keluar dari VeriFace di perangkat ini.</p>
                </div>
                <button type="button" onClick={logout} disabled={isLoggingOut} className="h-[34px] shrink-0 rounded-md bg-[var(--color-brand)] px-[13px] text-[10px] font-semibold text-white transition hover:bg-[var(--color-brand-hover)] disabled:cursor-not-allowed disabled:opacity-70">
                  {isLoggingOut ? "Sedang keluar..." : "Keluar"}
                </button>
              </div>

              <div className="flex items-center justify-between gap-4 py-[12px]">
                <div>
                  <h3 className="m-0 text-[11px] font-semibold text-[var(--color-danger)]">Hapus akun saya</h3>
                  <p className="mt-[4px] mb-0 text-[9px] leading-[1.4] text-[var(--color-text-soft)]">Hapus akun secara permanen dan cabut akses dari semua ruang kerja.</p>
                </div>
                <button type="button" className="h-[32px] shrink-0 rounded-[5px] border border-[var(--color-danger-border)] bg-[var(--color-surface-danger)] px-[11px] text-[10px] font-semibold text-[var(--color-danger)] hover:border-[var(--color-danger)] hover:bg-[var(--color-danger-surface)]">
                  Hapus Akun
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
