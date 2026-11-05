import { useState } from "react";
import { apiRequest } from "../api.js";
import logoWhite from "../assets/logo-white.png";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitLogin(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await apiRequest("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      window.location.href = "/dashboard";
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Gagal masuk.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-auth-page)] px-4 py-5 text-[var(--color-ink)] sm:px-8 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-40px)] max-w-[1120px] overflow-hidden rounded-[18px] border border-white/80 bg-white shadow-[0_18px_50px_rgba(42,74,57,0.09)] sm:min-h-[calc(100vh-64px)]">
        <section className="relative hidden w-[47%] flex-col overflow-hidden bg-[var(--color-brand)] px-12 py-11 text-white lg:flex">
          <div className="absolute -top-24 -right-24 h-[280px] w-[280px] rounded-full border border-white/10" />
          <div className="absolute -top-10 -right-10 h-[180px] w-[180px] rounded-full border border-white/10" />

          <a href="/" className="relative z-10 inline-block no-underline">
            <img src={logoWhite} className="block h-10 w-[130px] object-contain object-left" alt="VeriFace" />
          </a>

          <div className="relative z-10 my-auto">
            <h2 className="m-0 max-w-[430px] text-[36px] leading-[1.12] font-semibold tracking-[-0.045em]">
              Kelola kehadiran dengan mudah.
            </h2>
            <p className="mt-4 mb-0 max-w-[390px] text-[13px] leading-6 text-[var(--color-brand-on-dark)]">
              Pantau absensi dan data karyawan dari satu ruang kerja yang aman.
            </p>
          </div>

        </section>

        <section className="flex w-full items-center justify-center px-6 py-10 sm:px-12 lg:w-[53%]">
          <div className="w-full max-w-[390px]">
            <a href="/" className="mb-14 inline-block no-underline lg:hidden">
              <img src={logoWhite} className="block h-9 w-[118px] object-contain object-left" alt="VeriFace" />
            </a>

            <div className="mb-8 mt-12 lg:mt-0">
              <h1 className="m-0 text-[28px] leading-tight font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                Masuk sebagai Admin
              </h1>
            </div>

            <form className="space-y-5" onSubmit={submitLogin}>
              <div>
                <label className="mb-2 block text-[12px] font-semibold text-[var(--color-ink-secondary)]" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="admin@veriface.com"
                  className="h-[48px] w-full rounded-lg border border-[var(--color-border-input)] bg-white px-4 text-[13px] text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-text-placeholder)] focus:border-[var(--color-brand)] focus:ring-4 focus:ring-[var(--color-brand-wash)]"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-[12px] font-semibold text-[var(--color-ink-secondary)]" htmlFor="password">
                    Kata sandi
                  </label>
                  <button type="button" className="border-0 bg-transparent p-0 text-[11px] font-semibold text-[var(--color-brand)]">
                    Lupa kata sandi?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    placeholder="Masukkan kata sandi"
                    className="h-[48px] w-full rounded-lg border border-[var(--color-border-input)] bg-white px-4 pr-12 text-[13px] text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-text-placeholder)] focus:border-[var(--color-brand)] focus:ring-4 focus:ring-[var(--color-brand-wash)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute top-1/2 right-3 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md border-0 bg-transparent text-[var(--color-text-soft)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-brand)]"
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  >
                    {showPassword ? (
                      <svg className="h-[17px] w-[17px]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 4.3A10.7 10.7 0 0 1 12 4c5 0 9 4 9 8a8.7 8.7 0 0 1-1.9 4.3M6.6 6.5A9.8 9.8 0 0 0 3 12c0 4 4 8 9 8a10 10 0 0 0 4-.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg className="h-[17px] w-[17px]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                        <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.7" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="h-[48px] w-full rounded-lg border-0 bg-[var(--color-brand)] text-[13px] font-semibold text-white transition hover:bg-[var(--color-brand-hover)] active:bg-[var(--color-brand)]"
              >
                {loading ? "Memproses..." : "Masuk"}
              </button>
              {error && <p role="alert" className="text-center text-[12px] text-[var(--color-danger)]">{error}</p>}
            </form>

            <p className="mt-6 mb-0 text-center text-[12px] text-[var(--color-text-soft)]">
              Don't have an account?
              <a href="/signup" className="ml-1 font-semibold text-[var(--color-brand)] no-underline hover:text-[var(--color-brand-hover)]">
                Sign up
              </a>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
