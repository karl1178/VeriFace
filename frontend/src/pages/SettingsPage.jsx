import { useState } from "react";
import WorkspaceSidebar from "../components/WorkspaceSidebar.jsx";
import WorkspaceTopBar from "../components/WorkspaceTopBar.jsx";
import { apiRequest } from "../api.js";

export default function SettingsPage() {
  const [twoStepEnabled, setTwoStepEnabled] = useState(true);
  const [supportAccessEnabled, setSupportAccessEnabled] = useState(true);
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

  function Toggle({ checked, onChange, label }) {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange((current) => !current)}
        className={`relative h-[18px] w-[32px] shrink-0 rounded-full border-0 transition-colors ${checked ? "bg-[#397553]" : "bg-[#dfe5df]"}`}
      >
        <span className={`absolute top-[3px] h-[12px] w-[12px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.16)] transition-transform ${checked ? "translate-x-[17px]" : "translate-x-[3px]"}`} />
      </button>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7f5] text-[#202c26]">
      <WorkspaceSidebar activePage="settings" />

      <main className="ml-[226px] min-h-screen max-[850px]:ml-0" id="settings">
        <WorkspaceTopBar title="Account Security" />

        <div className="mx-auto w-full max-w-[1440px] px-[34px] pt-[30px] pb-[38px] max-[1100px]:px-6 max-[650px]:px-[15px] max-[650px]:pt-[23px] max-[650px]:pb-[30px]">
          <section className="overflow-hidden rounded-[8px] border border-[#e7ebe7] bg-white">
            <h2 className="m-0 border-b border-[#edf0ed] px-[18px] py-[16px] text-[12px] font-semibold text-[#202c26]">
              Account Security
            </h2>

            <div className="divide-y divide-[#edf0ed] px-[18px]">
              <div className="py-[13px]">
                <label className="mb-[8px] block text-[11px] font-semibold text-[#344139]" htmlFor="account-email">Email</label>
                <div className="flex items-center gap-[10px] max-[650px]:items-end">
                  <input
                    id="account-email"
                    type="email"
                    readOnly
                    placeholder="admin@example.com"
                    className="h-[38px] min-w-0 flex-1 rounded-[5px] border border-[#dfe4e0] bg-white px-[12px] text-[11px] text-[#344139] outline-none placeholder:text-[#c4cac5] focus:border-[#397553]"
                  />
                  <button type="button" className="h-[34px] shrink-0 rounded-md bg-[#397553] px-[13px] text-[10px] font-semibold text-white transition hover:bg-[#28634c]">
                    Change email
                  </button>
                </div>
              </div>

              <div className="py-[13px]">
                <div className="mb-[8px] flex items-center justify-between gap-3">
                  <span className="text-[11px] font-semibold text-[#344139]">Password</span>
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-[10px] max-[650px]:grid-cols-1">
                  <div>
                    <label className="mb-[5px] block text-[9px] font-medium text-[#89938c]" htmlFor="current-password">Current password</label>
                    <input
                      id="current-password"
                      type="password"
                      placeholder="********"
                      autoComplete="current-password"
                      className="h-[38px] w-full rounded-[5px] border border-[#dfe4e0] bg-white px-[12px] text-[11px] text-[#344139] outline-none placeholder:text-[#c4cac5] focus:border-[#397553]"
                    />
                  </div>
                  <div>
                    <label className="mb-[5px] block text-[9px] font-medium text-[#89938c]" htmlFor="new-password">New password</label>
                    <input
                      id="new-password"
                      type="password"
                      placeholder="********"
                      autoComplete="new-password"
                      className="h-[38px] w-full rounded-[5px] border border-[#dfe4e0] bg-white px-[12px] text-[11px] text-[#344139] outline-none placeholder:text-[#c4cac5] focus:border-[#397553]"
                    />
                  </div>
                  <button type="button" className="h-[34px] shrink-0 rounded-md bg-[#397553] px-[13px] text-[10px] font-semibold text-white transition hover:bg-[#28634c] max-[650px]:mt-[2px]">
                    Change password
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 py-[12px]">
                <div>
                  <h3 className="m-0 text-[11px] font-semibold text-[#344139]">Log out</h3>
                  <p className="mt-[4px] mb-0 text-[9px] leading-[1.4] text-[#89938c]">Log out of VeriFace on this device.</p>
                </div>
                <button type="button" onClick={logout} disabled={isLoggingOut} className="h-[34px] shrink-0 rounded-md bg-[#397553] px-[13px] text-[10px] font-semibold text-white transition hover:bg-[#28634c] disabled:cursor-not-allowed disabled:opacity-70">
                  {isLoggingOut ? "Logging out..." : "Log out"}
                </button>
              </div>

              <div className="flex items-center justify-between gap-4 py-[12px]">
                <div>
                  <h3 className="m-0 text-[11px] font-semibold text-[#b5473a]">Delete my account</h3>
                  <p className="mt-[4px] mb-0 text-[9px] leading-[1.4] text-[#89938c]">Permanently delete the account and remove access from all workspaces.</p>
                </div>
                <button type="button" className="h-[32px] shrink-0 rounded-[5px] border border-[#eccfc8] bg-[#fffafa] px-[11px] text-[10px] font-semibold text-[#b5473a] hover:border-[#b5473a] hover:bg-[#fbefed]">
                  Delete Account
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
