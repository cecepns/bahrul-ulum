import React, { useState, useEffect } from "react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import Pagination from "../components/Pagination";
import Modal from "../components/Modal";
import { SkeletonTable } from "../components/Skeleton";
import { Check, X, Search, FileText, Phone, Eye } from "lucide-react";
import toast from "react-hot-toast";

const PpdbAdmin = () => {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("pending");
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
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
    fetchPpdbList();
  }, [pagination.page, pagination.limit, debouncedSearch, status]);

  const fetchPpdbList = async () => {
    setIsLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.PPDB.LIST, {
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch,
        status: status
      });
      if (res.success) {
        setData(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      toast.error(err.message || "Gagal memuat data PPDB");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (id, approve, reason = "") => {
    setActionLoading(true);
    try {
      const res = await request.post(API_ENDPOINTS.PPDB.VERIFY(id), {
        status: approve ? "approved" : "rejected",
        alasan_penolakan: reason
      });
      if (res.success) {
        toast.success(res.message);
        setDetailModalOpen(false);
        setRejectModalOpen(false);
        setRejectReason("");
        fetchPpdbList();
      }
    } catch (err) {
      toast.error(err.message || "Gagal memproses verifikasi");
    } finally {
      setActionLoading(false);
    }
  };

  const openDetail = (candidate) => {
    setSelectedCandidate(candidate);
    setDetailModalOpen(true);
  };

  const openRejectModal = (candidate) => {
    setSelectedCandidate(candidate);
    setRejectModalOpen(true);
  };

  const API_URL = import.meta.env.VITE_API_URL || "https://api-siakad.kingcreativestudio.my.id";

  return (
    <div className="space-y-6">
      {/* Filters & Search Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        {/* Status Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          {["pending", "approved", "rejected"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setStatus(tab);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className={`flex-1 md:flex-none px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all ${status === tab
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
                }`}
            >
              {tab === "pending" ? "Menunggu" : tab === "approved" ? "Disetujui" : "Ditolak"}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, ayah, no HP..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium text-slate-700"
          />
        </div>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <SkeletonTable rows={5} cols={5} />
      ) : data.length === 0 ? (
        <div className="bg-white border border-slate-100 p-12 rounded-2xl text-center">
          <p className="text-slate-400 text-sm font-medium">Tidak ada data pendaftaran PPDB.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">No</th>
                  <th className="px-6 py-4">Nama Lengkap</th>
                  <th className="px-6 py-4">JK</th>
                  <th className="px-6 py-4">Wali / HP</th>
                  <th className="px-6 py-4">Tgl Daftar</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700 font-medium">
                {data.map((candidate, idx) => (
                  <tr key={candidate.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">{(pagination.page - 1) * pagination.limit + idx + 1}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{candidate.nama_lengkap}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{candidate.tempat_lahir}, {candidate.tanggal_lahir}</div>
                    </td>
                    <td className="px-6 py-4">{candidate.jk === "L" ? "Laki-laki" : "Perempuan"}</td>
                    <td className="px-6 py-4">
                      <div>Ayah: {candidate.nama_ayah}</div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <Phone size={12} />
                        {candidate.hp_ortu}
                      </div>
                    </td>
                    <td className="px-6 py-4">{candidate.tanggal_daftar}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDetail(candidate)}
                          title="Lihat Berkas & Detail"
                          className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <Eye size={16} />
                        </button>

                        {status === "pending" && (
                          <>
                            <button
                              onClick={() => handleVerify(candidate.id, true)}
                              title="Setujui Pendaftaran"
                              className="p-1.5 text-emerald-500 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => openRejectModal(candidate)}
                              title="Tolak Pendaftaran"
                              className="p-1.5 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
        </div>
      )}

      {/* Detail Berkas Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Detail & Berkas Calon Santri"
      >
        {selectedCandidate && (
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Profil Pribadi</h4>
              <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
                <div>
                  <span className="text-slate-400 block text-xs">Nama Lengkap</span>
                  <strong>{selectedCandidate.nama_lengkap}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">Jenis Kelamin</span>
                  <strong>{selectedCandidate.jk === "L" ? "Laki-laki" : "Perempuan"}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">Tempat, Tanggal Lahir</span>
                  <strong>{selectedCandidate.tempat_lahir}, {selectedCandidate.tanggal_lahir}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">Kontak Ortu</span>
                  <strong>{selectedCandidate.hp_ortu}</strong>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-xs">Alamat</span>
                  <strong>{selectedCandidate.alamat}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">Nama Ayah / Ibu</span>
                  <strong>{selectedCandidate.nama_ayah} / {selectedCandidate.nama_ibu}</strong>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">Berkas Pendukung</h4>
              <div className="grid grid-cols-2 gap-4">
                {/* KK File */}
                <div className="border border-slate-100 rounded-xl p-3 flex flex-col justify-between items-center text-center bg-slate-50/50">
                  <FileText className="text-slate-400 mb-2" size={24} />
                  <span className="text-xs font-semibold text-slate-700">Kartu Keluarga</span>
                  {selectedCandidate.kk_file ? (
                    <a
                      href={`${API_URL}/${selectedCandidate.kk_file}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-600 hover:underline font-bold mt-2 flex items-center gap-1"
                    >
                      Lihat Berkas
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 mt-2">Tidak diupload</span>
                  )}
                </div>

                {/* Akta File */}
                <div className="border border-slate-100 rounded-xl p-3 flex flex-col justify-between items-center text-center bg-slate-50/50">
                  <FileText className="text-slate-400 mb-2" size={24} />
                  <span className="text-xs font-semibold text-slate-700">Akta Kelahiran</span>
                  {selectedCandidate.akta_file ? (
                    <a
                      href={`${API_URL}/${selectedCandidate.akta_file}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-600 hover:underline font-bold mt-2 flex items-center gap-1"
                    >
                      Lihat Berkas
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 mt-2">Tidak diupload</span>
                  )}
                </div>

                {/* Pas Foto */}
                <div className="border border-slate-100 rounded-xl p-3 flex flex-col justify-between items-center text-center bg-slate-50/50">
                  <FileText className="text-slate-400 mb-2" size={24} />
                  <span className="text-xs font-semibold text-slate-700">Pas Foto 3x4</span>
                  {selectedCandidate.foto ? (
                    <a
                      href={`${API_URL}/${selectedCandidate.foto}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-600 hover:underline font-bold mt-2 flex items-center gap-1"
                    >
                      Lihat Berkas
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 mt-2">Tidak diupload</span>
                  )}
                </div>

                {/* Ijazah */}
                <div className="border border-slate-100 rounded-xl p-3 flex flex-col justify-between items-center text-center bg-slate-50/50">
                  <FileText className="text-slate-400 mb-2" size={24} />
                  <span className="text-xs font-semibold text-slate-700">Ijazah Terakhir</span>
                  {selectedCandidate.ijazah_file ? (
                    <a
                      href={`${API_URL}/${selectedCandidate.ijazah_file}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-600 hover:underline font-bold mt-2 flex items-center gap-1"
                    >
                      Lihat Berkas
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 mt-2">Tidak diupload</span>
                  )}
                </div>
              </div>
            </div>

            {status === "pending" && (
              <div className="flex gap-3 pt-4 border-t border-slate-50">
                <button
                  onClick={() => handleVerify(selectedCandidate.id, true)}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
                >
                  Setujui Masuk Data Aktif
                </button>
                <button
                  onClick={() => {
                    setDetailModalOpen(false);
                    openRejectModal(selectedCandidate);
                  }}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
                >
                  Tolak Pendaftaran
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reject Reason Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Alasan Penolakan Pendaftaran"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Tulis alasan penolakan berkas/pendaftaran:
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows="4"
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 text-sm font-medium text-slate-750"
              placeholder="Berkas KK kurang terbaca jelas, silakan daftar ulang dengan foto yang terang..."
            ></textarea>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setRejectModalOpen(false)}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors"
            >
              Batal
            </button>
            <button
              onClick={() => handleVerify(selectedCandidate.id, false, rejectReason)}
              disabled={actionLoading || !rejectReason}
              className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              Kirim Penolakan
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PpdbAdmin;
