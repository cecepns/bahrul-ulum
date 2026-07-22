import React, { useState, useEffect } from "react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import Pagination from "../components/Pagination";
import Modal from "../components/Modal";
import { SkeletonTable } from "../components/Skeleton";
import { Plus, Check, X, Search, QrCode, ClipboardCopy, Calendar, User, ScanLine, Smartphone, Download } from "lucide-react";
import toast from "react-hot-toast";

const PerizinanAdmin = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const isWali = user?.role === "walisantri";

  // Data states
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Wali Request Modals
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestData, setRequestData] = useState({
    tanggal_mulai: "",
    tanggal_selesai: "",
    alasan: ""
  });

  // QR Code Viewer Modals
  const [qrOpen, setQrOpen] = useState(false);
  const [selectedIzin, setSelectedIzin] = useState(null);

  // Admin QR Code Scanner Simulation Modals
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedCode, setScannedCode] = useState("");

  const [actionLoading, setActionLoading] = useState(false);

  // Debounce search effect (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    fetchPerizinanList();
  }, [pagination.page, pagination.limit, debouncedSearch, status]);

  const fetchPerizinanList = async () => {
    setIsLoading(true);
    try {
      let res;
      if (isWali) {
        res = await request.get(API_ENDPOINTS.PERIZINAN.WALI);
      } else {
        res = await request.get(API_ENDPOINTS.PERIZINAN.LIST, {
          page: pagination.page,
          limit: pagination.limit,
          search: debouncedSearch,
          status: status
        });
      }
      if (res.success) {
        if (isWali) {
          setData(res.data);
          setPagination({ page: 1, limit: 100, total: res.data.length, totalPages: 1 });
        } else {
          setData(res.data);
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      toast.error(err.message || "Gagal memuat data perizinan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!requestData.tanggal_mulai || !requestData.tanggal_selesai || !requestData.alasan) {
      toast.error("Silakan lengkapi tanggal mulai, selesai, dan alasan.");
      return;
    }

    // Format HTML datetime format (YYYY-MM-DDTHH:MM) to backend format (YYYY-MM-DD HH:MM:SS)
    const fmtMulai = requestData.tanggal_mulai.replace("T", " ") + ":00";
    const fmtSelesai = requestData.tanggal_selesai.replace("T", " ") + ":00";

    setActionLoading(true);
    try {
      const res = await request.post(API_ENDPOINTS.PERIZINAN.SUBMIT_WALI, {
        tanggal_mulai: fmtMulai,
        tanggal_selesai: fmtSelesai,
        alasan: requestData.alasan
      });
      if (res.success) {
        toast.success(res.message);
        setRequestOpen(false);
        fetchPerizinanList();
      }
    } catch (err) {
      toast.error(err.message || "Gagal mengajukan perizinan");
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerify = async (id, approve) => {
    setActionLoading(true);
    try {
      const res = await request.post(API_ENDPOINTS.PERIZINAN.VERIFY(id), {
        status: approve ? "disetujui" : "ditolak"
      });
      if (res.success) {
        toast.success(res.message);
        fetchPerizinanList();
      }
    } catch (err) {
      toast.error(err.message || "Gagal memproses verifikasi.");
    } finally {
      setActionLoading(false);
    }
  };

  // QR Code image dynamic source link
  const getQrUrl = (id, type) => {
    return `${import.meta.env.VITE_API_URL || "https://api-ebum.bahrululum.or.id"}${API_ENDPOINTS.PERIZINAN.QR_CODE(id, type)}`;
  };

  const downloadQrCode = async (id, type) => {
    try {
      const url = getQrUrl(id, type);
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `QR-CODE-${type.toUpperCase()}-${id}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success(`QR Code ${type === "keluar" ? "Keluar" : "Kembali"} berhasil diunduh.`);
    } catch (err) {
      toast.error("Gagal mengunduh gambar QR Code.");
    }
  };

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    if (!scannedCode) return;
    setActionLoading(true);
    try {
      const res = await request.post(API_ENDPOINTS.PERIZINAN.SCAN, { qr_code: scannedCode });
      if (res.success) {
        toast.success(res.message);
        setScannerOpen(false);
        setScannedCode("");
        fetchPerizinanList();
      }
    } catch (err) {
      toast.error(err.message || "Scan gagal atau kode tidak terdaftar.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">

        {/* Left Search / Info */}
        {!isWali ? (
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search size={18} />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari santri..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm font-medium text-slate-700"
              />
            </div>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full sm:w-44 px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white text-slate-700 font-medium"
            >
              <option value="">Semua Status</option>
              <option value="menunggu">Menunggu Verifikasi</option>
              <option value="disetujui">Disetujui / Aktif</option>
              <option value="ditolak">Ditolak</option>
            </select>
          </div>
        ) : (
          <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Calendar size={20} className="text-emerald-500" />
            Pengajuan Izin Keluar / Pulang Santri
          </h2>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {!isWali ? (
            <button
              onClick={() => setScannerOpen(true)}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <ScanLine size={16} />
              Scan QR Code
            </button>
          ) : (
            <button
              onClick={() => {
                setRequestData({ tanggal_mulai: "", tanggal_selesai: "", alasan: "" });
                setRequestOpen(true);
              }}
              className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus size={16} />
              Ajukan Izin
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <SkeletonTable rows={5} cols={isWali ? 5 : 6} />
      ) : data.length === 0 ? (
        <div className="bg-white border border-slate-100 p-12 rounded-2xl text-center">
          <p className="text-slate-400 text-sm font-medium">Tidak ada data riwayat perizinan.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-slide-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">No</th>
                  {!isWali && <th className="px-6 py-4">Santri</th>}
                  <th className="px-6 py-4">Masa Izin</th>
                  <th className="px-6 py-4">Alasan</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700 font-medium">
                {data.map((izin, idx) => (
                  <tr key={izin.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      {isWali ? idx + 1 : (pagination.page - 1) * pagination.limit + idx + 1}
                    </td>
                    {!isWali && (
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{izin.santri?.nama_lengkap}</div>
                        <div className="text-xs text-slate-400 mt-0.5">NIS: {izin.santri?.nis ?? "-"}</div>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-500 font-semibold">Mulai: {izin.tanggal_mulai}</div>
                      <div className="text-xs text-red-500 font-semibold mt-0.5">Selesai: {izin.tanggal_selesai}</div>
                      {izin.status_kembali === "kembali" && (
                        <div className="text-[10px] text-emerald-600 font-bold mt-1">Kembali: {izin.tanggal_kembali}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 max-w-[200px] truncate" title={izin.alasan}>{izin.alasan}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 w-max">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${izin.status === "disetujui"
                          ? "bg-emerald-50 text-emerald-700"
                          : izin.status === "ditolak"
                            ? "bg-red-50 text-red-700"
                            : "bg-amber-50 text-amber-700"
                          }`}>
                          {izin.status === "menunggu" ? "Menunggu" : izin.status}
                        </span>

                        {izin.status === "disetujui" && (
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide text-center ${izin.status_kembali === "kembali"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-amber-50 text-amber-600"
                            }`}>
                            {izin.status_kembali === "kembali" ? "Sudah Kembali" : "Belum Kembali"}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Wali QR code access */}
                        {isWali && izin.status === "disetujui" && (
                          <button
                            onClick={() => {
                              setSelectedIzin(izin);
                              setQrOpen(true);
                            }}
                            title="Tampilkan Kartu QR Izin"
                            className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            <QrCode size={16} />
                          </button>
                        )}

                        {/* Admin actions */}
                        {!isWali && (
                          <>
                            {izin.status === "menunggu" && (
                              <>
                                <button
                                  onClick={() => handleVerify(izin.id, true)}
                                  title="Setujui Izin"
                                  className="p-1.5 text-emerald-500 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors"
                                >
                                  <Check size={16} />
                                </button>
                                <button
                                  onClick={() => handleVerify(izin.id, false)}
                                  title="Tolak Izin"
                                  className="p-1.5 text-red-500 hover:text-red-750 rounded-lg hover:bg-red-50 transition-colors"
                                >
                                  <X size={16} />
                                </button>
                              </>
                            )}

                            {izin.status === "disetujui" && (
                              <button
                                onClick={() => {
                                  setSelectedIzin(izin);
                                  setQrOpen(true);
                                }}
                                title="Tampilkan QR Code"
                                className="p-1.5 text-slate-500 hover:text-indigo-650 rounded-lg hover:bg-slate-50 transition-colors"
                              >
                                <QrCode size={16} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!isWali && (
            <div className="px-6">
              <Pagination
                page={pagination.page}
                limit={pagination.limit}
                total={pagination.total}
                totalPages={pagination.totalPages}
                onPageChange={(p) => setPagination({ ...pagination, page: p })}
                onLimitChange={(l) => setPagination({ ...pagination, limit: l, page: 1 })}
              />
            </div>
          )}
        </div>
      )}

      {/* Wali Submit Request Modal */}
      <Modal
        isOpen={requestOpen}
        onClose={() => setRequestOpen(false)}
        title="Ajukan Izin Keluar Santri"
      >
        <form onSubmit={handleRequestSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Mulai Tanggal / Jam</label>
              <input
                type="datetime-local"
                value={requestData.tanggal_mulai}
                onChange={(e) => setRequestData({ ...requestData, tanggal_mulai: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none text-xs font-semibold text-slate-750"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Rencana Kembali (Tanggal / Jam)</label>
              <input
                type="datetime-local"
                value={requestData.tanggal_selesai}
                onChange={(e) => setRequestData({ ...requestData, tanggal_selesai: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none text-xs font-semibold text-slate-750"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Alasan Izin</label>
            <textarea
              value={requestData.alasan}
              onChange={(e) => setRequestData({ ...requestData, alasan: e.target.value })}
              rows="3"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 text-sm text-slate-700"
              placeholder="Tulis alasan izin santri keluar pondok..."
            ></textarea>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-50">
            <button
              type="button"
              onClick={() => setRequestOpen(false)}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              {actionLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : null}
              Kirim Pengajuan
            </button>
          </div>
        </form>
      </Modal>

      {/* QR Code Viewer Modal */}
      <Modal
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
        title="Kartu Elektronik QR Code Perizinan"
      >
        {selectedIzin && (
          <div className="flex flex-col items-center text-center space-y-6">
            <p className="text-xs text-slate-500 max-w-sm">
              Tunjukkan QR Code ini ke Pos Keamanan Gerbang Pondok untuk dipindai saat santri meninggalkan lokasi atau kembali.
            </p>

            <div className="grid grid-cols-2 gap-6 w-full">
              {/* QR Out */}
              <div className="border border-slate-100 p-4 rounded-2xl bg-slate-50 flex flex-col items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">1. QR KELUAR</span>
                <img
                  src={getQrUrl(selectedIzin.id, "keluar")}
                  alt="QR Keluar"
                  className="w-32 h-32 border border-slate-200 rounded-xl"
                />

                <button
                  type="button"
                  onClick={() => downloadQrCode(selectedIzin.id, "keluar")}
                  className="mt-3 w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <Download size={12} />
                  Unduh Gambar
                </button>

                {/* Simulated Copy Code */}
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedIzin.qr_code_keluar);
                    toast.success("Kode disalin: " + selectedIzin.qr_code_keluar);
                  }}
                  className="text-[10px] text-slate-450 hover:text-slate-500 mt-2.5 flex items-center gap-1"
                >
                  <ClipboardCopy size={10} />
                  Salin Kode
                </button>
              </div>

              {/* QR In */}
              <div className="border border-slate-100 p-4 rounded-2xl bg-slate-50 flex flex-col items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">2. QR KEMBALI</span>
                <img
                  src={getQrUrl(selectedIzin.id, "kembali")}
                  alt="QR Kembali"
                  className="w-32 h-32 border border-slate-200 rounded-xl"
                />

                <button
                  type="button"
                  onClick={() => downloadQrCode(selectedIzin.id, "kembali")}
                  className="mt-3 w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <Download size={12} />
                  Unduh Gambar
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedIzin.qr_code_kembali);
                    toast.success("Kode disalin: " + selectedIzin.qr_code_kembali);
                  }}
                  className="text-[10px] text-slate-450 hover:text-slate-500 mt-2.5 flex items-center gap-1"
                >
                  <ClipboardCopy size={10} />
                  Salin Kode
                </button>
              </div>
            </div>

            <button
              onClick={() => setQrOpen(false)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm"
            >
              Tutup
            </button>
          </div>
        )}
      </Modal>

      {/* Admin QR Scanner Simulator Modal */}
      <Modal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        title="Simulasi Scanner Pintu Gerbang Pos"
      >
        <form onSubmit={handleScanSubmit} className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Simulasi pemindaian QR Code perizinan santri. Tempelkan kode string yang didapat dari salin kartu perizinan di atas.
          </p>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Kode QR Code</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Smartphone size={16} />
              </span>
              <input
                type="text"
                value={scannedCode}
                onChange={(e) => setScannedCode(e.target.value)}
                placeholder="Tempel: QR-OUT-x-xxxx atau QR-IN-x-xxxx"
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-50">
            <button
              type="button"
              onClick={() => {
                setScannerOpen(false);
                setScannedCode("");
              }}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={actionLoading || !scannedCode}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              {actionLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : null}
              Kirim Pindai / Scan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PerizinanAdmin;
