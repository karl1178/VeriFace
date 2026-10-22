import { useCallback, useEffect, useState } from "react";
import refreshIcon from "../assets/reset.svg";
import WorkspaceSidebar from "../components/WorkspaceSidebar.jsx";
import WorkspaceTopBar from "../components/WorkspaceTopBar.jsx";
import { apiRequest } from "../api.js";

export default function ManageEmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [deletePending, setDeletePending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const filteredEmployees = employees.filter((employee) =>
    employee.nama?.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/api/employees");
      if (!Array.isArray(data)) throw new Error("Format data karyawan tidak valid.");
      setEmployees(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Koneksi ke backend terputus.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  function selectEmployee(employee) {
    if (selectedId === employee.id) {
      setSelectedId(null);
      setName("");
      setDeletePending(false);
      setNotice("");
      return;
    }
    setSelectedId(employee.id);
    setName(employee.nama);
    setDeletePending(false);
    setNotice("");
  }

  async function saveName(event) {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setNotice("");
    try {
      const data = await apiRequest(`/api/employees/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: name.trim() }),
      });
      setEmployees((current) => current.map((employee) => employee.id === data.id ? data : employee).sort((a, b) => a.nama.localeCompare(b.nama, "id")));
      setName(data.nama);
      setNotice("Nama karyawan berhasil diperbarui.");
      setDeletePending(false);
    } catch (requestError) {
      setNotice(requestError instanceof Error ? requestError.message : "Koneksi ke backend terputus.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteEmployee() {
    if (!deletePending) {
      setDeletePending(true);
      setNotice("Pilih Hapus sekali lagi untuk mengonfirmasi.");
      return;
    }
    setSaving(true);
    setNotice("");
    try {
      const data = await apiRequest(`/api/employees/${selectedId}`, { method: "DELETE" });
      setEmployees((current) => current.filter((employee) => employee.id !== selectedId));
      setSelectedId(null);
      setName("");
      setDeletePending(false);
      setNotice(data.pesan || "Data karyawan berhasil dihapus.");
    } catch (requestError) {
      setNotice(requestError instanceof Error ? requestError.message : "Koneksi ke backend terputus.");
    } finally {
      setSaving(false);
    }
  }

  const selectedEmployee = employees.find((employee) => employee.id === selectedId);

  return (
    <div className="min-h-screen bg-[#f5f7f5] text-[#202c26]">
      <WorkspaceSidebar activePage="manage" />

      <main className="ml-[226px] min-h-screen max-[850px]:ml-0">
        <WorkspaceTopBar title="Kelola Karyawan" />
        <div className="mx-auto w-full max-w-[1440px] px-[34px] pt-[30px] pb-[38px] max-[1100px]:px-6 max-[650px]:px-[15px] max-[650px]:pt-[23px]">
          <section className="mb-4 flex items-center justify-between gap-4 rounded-[9px] border border-[#dce9df] bg-white px-5 py-4 max-[650px]:items-start max-[650px]:px-4">
            <div>
              <h2 className="m-0 text-xs font-semibold text-[#344139]">Tambah karyawan</h2>
              <p className="mt-1 mb-0 text-[10px] text-[#89938c]">Buka scanner untuk mendaftarkan karyawan baru.</p>
            </div>
            <button type="button" onClick={() => { window.location.href = "/register"; }} className="h-[34px] rounded-md bg-[#397553] px-3 text-[10px] font-semibold text-white hover:bg-[#28634c]">Buka Registrasi</button>
          </section>

          <section className="overflow-hidden rounded-[9px] border border-[#e7ebe7] bg-white">
            <div className="flex min-h-[65px] items-center justify-between gap-3 border-b border-[#edf0ed] px-[21px] py-[13px] max-[650px]:px-[14px]">
              <div>
                <h2 className="m-0 text-xs font-semibold text-[#344139]">Daftar karyawan</h2>
                <p className="mt-1 mb-0 text-[10px] text-[#89938c]">Cari karyawan, lalu pilih untuk mengubah atau menghapus data.</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={fetchEmployees} disabled={loading} className="inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-md border border-[#dfe5df] bg-white text-[10px] font-semibold text-[#405047] transition hover:bg-[#f8faf8] disabled:cursor-wait disabled:opacity-[0.65]" title="Segarkan data karyawan" aria-label="Segarkan data karyawan">
                  <img src={refreshIcon} className="h-4 w-4 shrink-0" alt="" aria-hidden="true" />
                </button>
                <label className="flex h-[30px] w-[203px] items-center gap-2 rounded-md border border-[#e7ebe7] px-[10px] text-[9px] text-[#a0a8a2] max-[650px]:w-[150px] max-[650px]:shrink-0">
                  <svg className="h-3 w-3 shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5"/><path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  <input type="search" aria-label="Cari karyawan berdasarkan nama" placeholder="Cari karyawan" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-[10px] text-[#344139] outline-none placeholder:text-[#a0a8a2]" />
                </label>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px] border-collapse text-left">
                <thead className="bg-[#fafbfa] text-[9px] font-medium text-[#89938c]"><tr><th className="px-5 py-[9px] pl-[21px] font-medium" scope="col">Nama karyawan</th><th className="px-5 py-[9px] font-medium" scope="col">ID</th></tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan="3" className="h-[85px] text-center text-[10px] text-[#89938c]">Memuat data karyawan...</td></tr>
                    : error ? <tr><td colSpan="3" className="h-[85px] text-center text-[10px] text-[#b5473a]">{error}</td></tr>
                      : employees.length === 0 ? <tr><td colSpan="2" className="h-[85px] text-center text-[10px] text-[#89938c]">Belum ada karyawan. Gunakan tombol Buka Registrasi untuk menambahkan.</td></tr>
                        : filteredEmployees.length === 0 ? <tr><td colSpan="2" className="h-[85px] text-center text-[10px] text-[#89938c]">Tidak ada karyawan dengan nama tersebut.</td></tr>
                          : filteredEmployees.map((employee) => <tr key={employee.id} onClick={() => selectEmployee(employee)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectEmployee(employee); } }} tabIndex={0} aria-selected={selectedId === employee.id} className={`cursor-pointer transition-colors hover:bg-[#eef5ef] ${selectedId === employee.id ? "bg-[#e5f1e8]" : ""}`}>
                          <td className="border-b border-[#edf0ed] py-[10px] pr-4 pl-[21px] text-[10px] text-[#39463f]"><div className="flex items-center gap-[10px]"><span className="grid h-[29px] w-[29px] shrink-0 place-items-center rounded-full bg-[#dcebe3] text-[8px] font-semibold text-[#35664d]">{employee.nama?.split(/\s+/).map((part) => part[0]).join("").slice(0, 2)}</span><strong className="font-semibold">{employee.nama}</strong></div></td>
                          <td className="border-b border-[#edf0ed] px-5 py-[10px] text-[10px] text-[#748078]">{employee.id}</td>
                        </tr>)}
                </tbody>
              </table>
            </div>

            {selectedEmployee && <form onSubmit={saveName} className="border-t border-[#edf0ed] bg-[#fafbfa] px-[21px] py-4 max-[650px]:px-[14px]">
              
              <div className="flex flex-wrap items-end gap-3">
                <label className="min-w-[200px] flex-1 text-[10px] font-medium text-[#56645b]">Nama karyawan<input value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5 block h-[36px] w-full rounded-md border border-[#dfe5df] bg-white px-3 text-[#202c26] outline-none focus:border-[#397553]" /></label>
                <button type="submit" disabled={saving || !name.trim()} className="h-[34px] rounded-md bg-[#397553] px-3 text-[10px] font-semibold text-white hover:bg-[#28634c] disabled:opacity-60">{saving ? "Menyimpan..." : "Simpan Nama"}</button>
                <button type="button" onClick={deleteEmployee} disabled={saving} className="h-[34px] rounded-md border border-[#e8c9c4] bg-white px-3 text-[10px] font-semibold text-[#a85749] hover:bg-[#fbefed] disabled:opacity-60">{deletePending ? "Konfirmasi Hapus" : "Hapus Karyawan"}</button>
              </div>
              {notice && <p role="status" className={`mt-3 mb-0 text-[10px] ${notice.includes("berhasil") ? "text-[#397553]" : "text-[#a85749]"}`}>{notice}</p>}
            </form>}
            {!selectedEmployee && notice && <p role="status" className="border-t border-[#edf0ed] px-[21px] py-3 text-[10px] text-[#397553]">{notice}</p>}
          </section>
        </div>
      </main>
    </div>
  );
}
