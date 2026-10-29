import { useState } from "react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="min-h-screen bg-[#edf3ef] px-4 py-5 text-[#202c26] sm:px-8 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-40px)] max-w-[1120px] overflow-hidden rounded-[18px] border border-white/80 bg-white shadow-[0_18px_50px_rgba(42,74,57,0.09)] sm:min-h-[calc(100vh-64px)]">
        <section className="relative hidden w-[47%] flex-col overflow-hidden bg-[#315f48] px-12 py-11 text-white lg:flex">
          <div className="absolute -top-24 -right-24 h-[280px] w-[280px] rounded-full border border-white/10" />
          <div className="absolute -top-10 -right-10 h-[180px] w-[180px] rounded-full border border-white/10" />

          <a href="/" className="relative z-10 text-[24px] font-bold tracking-[-0.04em] text-white no-underline">
            VeriFace
          </a>

          <div className="relative z-10 my-auto">
            {/* <div className="mb-7 flex h-[190px] w-[190px] items-center justify-center rounded-full border border-white/15 bg-white/[0.07]">
              <div className="relative h-[116px] w-[116px] rounded-full border-2 border-dashed border-[#c6ded0]">
                <span className="absolute inset-[18px] flex items-center justify-center rounded-full bg-[#edf4ef]">
                  <svg className="h-[54px] w-[54px] text-[#397553]" viewBox="0 0 64 64" fill="none" aria-hidden="true">
                    <path d="M32 8a14 14 0 0 0-14 14v7a14 14 0 0 0 28 0v-7A14 14 0 0 0 32 8Z" fill="currentColor" fillOpacity=".16" />
                    <path d="M32 9v30M18 29h28M22 25c3-7 6.3-10 10-10s7 3 10 10M22 43c3 8 6.3 12 10 12s7-4 10-12" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                    <path d="M20 56c2.8-6 6.8-9 12-9s9.2 3 12 9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="absolute top-[11px] left-[11px] h-4 w-4 rounded-tl-lg border-t-2 border-l-2 border-white" />
                <span className="absolute right-[11px] bottom-[11px] h-4 w-4 rounded-br-lg border-r-2 border-b-2 border-white" />
              </div>
            </div> */}

            <h2 className="m-0 max-w-[430px] text-[36px] leading-[1.12] font-semibold tracking-[-0.045em]">
              Kelola kehadiran dengan mudah.
            </h2>
            <p className="mt-4 mb-0 max-w-[390px] text-[13px] leading-6 text-[#d5e3da]">
              Pantau absensi dan data karyawan dari satu ruang kerja yang aman.
            </p>
          </div>

        </section>

        <section className="flex w-full items-center justify-center px-6 py-10 sm:px-12 lg:w-[53%]">
          <div className="w-full max-w-[390px]">
            <a href="/" className="mb-14 text-[22px] font-bold tracking-[-0.04em] text-[#202c26] no-underline lg:hidden">
              VeriFace
            </a>

            <div className="mb-8 mt-12 lg:mt-0">
              <h1 className="m-0 text-[28px] leading-tight font-semibold tracking-[-0.04em] text-[#202c26]">
                Masuk sebagai Admin
              </h1>
            </div>

            <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
              <div>
                <label className="mb-2 block text-[12px] font-semibold text-[#344139]" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@veriface.com"
                  className="h-[48px] w-full rounded-lg border border-[#dfe6e0] bg-white px-4 text-[13px] text-[#202c26] outline-none transition placeholder:text-[#aab2ac] focus:border-[#397553] focus:ring-4 focus:ring-[#edf4ef]"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-[12px] font-semibold text-[#344139]" htmlFor="password">
                    Kata sandi
                  </label>
                  <button type="button" className="border-0 bg-transparent p-0 text-[11px] font-semibold text-[#397553]">
                    Lupa kata sandi?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Masukkan kata sandi"
                    className="h-[48px] w-full rounded-lg border border-[#dfe6e0] bg-white px-4 pr-12 text-[13px] text-[#202c26] outline-none transition placeholder:text-[#aab2ac] focus:border-[#397553] focus:ring-4 focus:ring-[#edf4ef]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute top-1/2 right-3 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md border-0 bg-transparent text-[#89938c] hover:bg-[#f3f6f3] hover:text-[#397553]"
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
                className="h-[48px] w-full rounded-lg border-0 bg-[#397553] text-[13px] font-semibold text-white transition hover:bg-[#28634c] active:bg-[#245840]"
              >
                Masuk
              </button>
            </form>

            <p className="mt-6 mb-0 text-center text-[12px] text-[#89938c]">
              Don't have an account?
              <a href="/signup" className="ml-1 font-semibold text-[#397553] no-underline hover:text-[#28634c]">
                Sign up
              </a>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
