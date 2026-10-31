import { useEffect, useState } from "react";
import WorkspaceSidebar from "../components/WorkspaceSidebar.jsx";
import WorkspaceTopBar from "../components/WorkspaceTopBar.jsx";
import SuccessToast from "../components/SuccessToast.jsx";
import { apiRequest } from "../api.js";

export default function SettingsPage() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [newName, setNewName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [successNotice, setSuccessNotice] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountPending, setDeleteAccountPending] = useState(false);
  const [deleteAccountNotice, setDeleteAccountNotice] = useState("");

  useEffect(() => {
    let active = true;
    apiRequest("/api/auth/me")
      .then((data) => {
        if (!active) return;
        const name = data?.admin?.name || "";
        setNewName(name);
      })
      .catch((error) => {
        if (active) {
          setSuccessNotice({
            id: Date.now(),
            message: error instanceof Error ? error.message : "Nama admin tidak dapat dimuat.",
            type: "error",
          });
        }
      })
      .finally(() => {
        if (active) setIsLoadingProfile(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!successNotice) return undefined;
    const timer = window.setTimeout(() => setSuccessNotice(null), 3000);
    return () => window.clearTimeout(timer);
  }, [successNotice]);

  async function saveName(event) {
    event.preventDefault();
    if (isSavingName) return;
    setIsSavingName(true);
    try {
      const data = await apiRequest("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      const savedName = data.admin.name;
      setNewName(savedName);
      setSuccessNotice({ id: Date.now(), message: "Nama admin berhasil diubah." });
    } catch (error) {
      setSuccessNotice({
        id: Date.now(),
        message: error instanceof Error ? error.message : "Gagal mengubah nama admin.",
        type: "error",
      });
    } finally {
      setIsSavingName(false);
    }
  }

  async function savePassword(event) {
    event.preventDefault();
    if (isSavingPassword) return;
    setIsSavingPassword(true);
    try {
      await apiRequest("/api/settings/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword("");
      setNewPassword("");
      setSuccessNotice({ id: Date.now(), message: "Kata sandi berhasil diubah." });
    } catch (error) {
      setSuccessNotice({
        id: Date.now(),
        message: error instanceof Error ? error.message : "Gagal mengubah kata sandi.",
        type: "error",
      });
    } finally {
      setIsSavingPassword(false);
    }
  }

  async function logout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.replace("/login");
    }
  }

  async function deleteAccount() {
    if (isDeletingAccount) return;
    if (!deleteAccountPending) {
      setDeleteAccountPending(true);
      setDeleteAccountNotice("Pilih Hapus Akun sekali lagi untuk mengonfirmasi.");
      return;
    }

    setIsDeletingAccount(true);
    try {
      await apiRequest("/api/settings/account", { method: "DELETE" });
      window.location.replace("/login");
    } catch (error) {
      setDeleteAccountNotice(error instanceof Error ? error.message : "Gagal menghapus akun.");
      setDeleteAccountPending(false);
      setIsDeletingAccount(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-page)] text-[var(--color-ink)]">
      <SuccessToast id={successNotice?.id} message={successNotice?.message} type={successNotice?.type} />
      <WorkspaceSidebar activePage="settings" />

      <main className="ml-[226px] min-h-screen max-[850px]:ml-0" id="settings">
        <WorkspaceTopBar title="Keamanan Akun" />

        <div className="mx-auto w-full max-w-[1440px] px-[34px] pt-[30px] pb-[38px] max-[1100px]:px-6 max-[650px]:px-[15px] max-[650px]:pt-[23px] max-[650px]:pb-[30px]">
          <section className="overflow-hidden rounded-[8px] border border-[var(--color-border)] bg-white">
            <h2 className="m-0 border-b border-[var(--color-border-subtle)] px-[18px] py-[16px] text-[12px] font-semibold text-[var(--color-ink)]">
              Keamanan Akun
            </h2>

            <div className="divide-y divide-[var(--color-border-subtle)] px-[18px]">
              <form className="py-[13px]" onSubmit={saveName}>
                <label className="mb-[8px] block text-[11px] font-semibold text-[var(--color-ink-secondary)]" htmlFor="admin-name">Nama Admin</label>
                <div className="flex items-center gap-[10px] max-[650px]:items-end">
                  <input
                    id="admin-name"
                    name="name"
                    type="text"
                    required
                    maxLength={100}
                    value={newName}
                    onChange={(event) => setNewName(event.target.value)}
                    disabled={isLoadingProfile || isSavingName}
                    placeholder="Administrator"
                    className="h-[38px] min-w-0 flex-1 rounded-[5px] border border-[var(--color-border-input)] bg-white px-[12px] text-[11px] text-[var(--color-ink-secondary)] outline-none placeholder:text-[var(--color-text-placeholder)] focus:border-[var(--color-brand)]"
                  />
                  <button type="submit" disabled={isLoadingProfile || isSavingName} className="h-[34px] shrink-0 rounded-md bg-[var(--color-brand)] px-[13px] text-[10px] font-semibold text-white transition hover:bg-[var(--color-brand-hover)] disabled:cursor-not-allowed disabled:opacity-70">
                    {isSavingName ? "Menyimpan..." : "Ubah Nama Admin"}
                  </button>
                </div>
              </form>

              <form className="py-[13px]" onSubmit={savePassword}>
                <div className="mb-[8px] flex items-center justify-between gap-3">
                  <span className="text-[11px] font-semibold text-[var(--color-ink-secondary)]">Kata Sandi</span>
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-[10px] max-[650px]:grid-cols-1">
                  <div>
                    <label className="mb-[5px] block text-[9px] font-medium text-[var(--color-text-soft)]" htmlFor="current-password">Kata sandi lama (asli)</label>
                    <input
                      id="current-password"
                      name="currentPassword"
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      placeholder="Masukkan kata sandi lama"
                      autoComplete="current-password"
                      disabled={isSavingPassword}
                      className="h-[38px] w-full rounded-[5px] border border-[var(--color-border-input)] bg-white px-[12px] text-[11px] text-[var(--color-ink-secondary)] outline-none placeholder:text-[var(--color-text-placeholder)] focus:border-[var(--color-brand)]"
                    />
                  </div>
                  <div>
                    <label className="mb-[5px] block text-[9px] font-medium text-[var(--color-text-soft)]" htmlFor="new-password">Kata sandi baru</label>
                    <input
                      id="new-password"
                      name="newPassword"
                      type="password"
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="Masukkan kata sandi baru"
                      autoComplete="new-password"
                      disabled={isSavingPassword}
                      className="h-[38px] w-full rounded-[5px] border border-[var(--color-border-input)] bg-white px-[12px] text-[11px] text-[var(--color-ink-secondary)] outline-none placeholder:text-[var(--color-text-placeholder)] focus:border-[var(--color-brand)]"
                    />
                  </div>
                  <button type="submit" disabled={isSavingPassword} className="h-[34px] shrink-0 rounded-md bg-[var(--color-brand)] px-[13px] text-[10px] font-semibold text-white transition hover:bg-[var(--color-brand-hover)] disabled:cursor-not-allowed disabled:opacity-70 max-[650px]:mt-[2px]">
                    {isSavingPassword ? "Menyimpan..." : "Ubah Kata Sandi"}
                  </button>
                </div>
              </form>

              <div className="flex items-center justify-between gap-4 py-[12px]">
                <div>
                  <h3 className="m-0 text-[11px] font-semibold text-[var(--color-ink-secondary)]">Keluar</h3>
                  <p className="mt-[4px] mb-0 text-[9px] leading-[1.4] text-[var(--color-text-soft)]">Keluar dari VeriFace di perangkat ini.</p>
                </div>
                <button type="button" onClick={logout} disabled={isLoggingOut} className="h-[34px] shrink-0 rounded-md bg-[var(--color-brand)] px-[13px] text-[10px] font-semibold text-white transition hover:bg-[var(--color-brand-hover)] disabled:cursor-not-allowed disabled:opacity-70">
                  {isLoggingOut ? "Sedang keluar..." : "Keluar"}
                </button>
              </div>

              <div className="py-[12px]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="m-0 text-[11px] font-semibold text-[var(--color-danger)]">Hapus akun saya</h3>
                    <p className="mt-[4px] mb-0 text-[9px] leading-[1.4] text-[var(--color-text-soft)]">Hapus akun secara permanen dan cabut akses dari semua ruang kerja.</p>
                  </div>
                  <button type="button" onClick={deleteAccount} disabled={isDeletingAccount} className="h-[32px] shrink-0 rounded-[5px] border border-[var(--color-danger-border)] bg-[var(--color-surface-danger)] px-[11px] text-[10px] font-semibold text-[var(--color-danger)] hover:border-[var(--color-danger)] hover:bg-[var(--color-danger-surface)] disabled:cursor-not-allowed disabled:opacity-70">
                    {isDeletingAccount ? "Menghapus..." : deleteAccountPending ? "Konfirmasi Hapus" : "Hapus Akun"}
                  </button>
                </div>
                {deleteAccountNotice && <p role={deleteAccountPending ? "status" : "alert"} className="mt-3 mb-0 text-[10px] text-[var(--color-danger)]">{deleteAccountNotice}</p>}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
