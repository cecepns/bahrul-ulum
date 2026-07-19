import React, { useState, useEffect } from "react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import Pagination from "../components/Pagination";
import Modal from "../components/Modal";
import SelectApi from "../components/SelectApi";
import ConfirmModal from "../components/ConfirmModal";
import { SkeletonTable } from "../components/Skeleton";
import { Plus, Edit2, Trash2, Search, AlertOctagon, Calendar, Eye } from "lucide-react";
import toast from "react-hot-toast";

const PelanggaranAdmin = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const isWali = user?.role === "walisantri";

  // Data states
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Wali Specific rekap points
  const [totalPoints, setTotalPoints] = useState(0);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedViolation, setSelectedViolation] = useState(null);
  const [formData, setFormData] = useState({
    santri_id: "",
    tanggal: new Date().toISOString().split("T")[0],
    nama_pelanggaran: "",
    point: "5",
    sanksi: "",
    keterangan: ""
  });
  
  // Selected option for SelectApi
  const [studentOption, setStudentOption] = useState(null);

  // Deletions
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
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
    fetchViolations();
  }, [pagination.page, pagination.limit, debouncedSearch]);

  const fetchViolations = async () => {
    setIsLoading(true);
    try {
      let res;
      if (isWali) {
        res = await request.get(API_ENDPOINTS.PELANGGARAN.WALI);
      } else {
        res = await request.get(API_ENDPOINTS.PELANGGARAN.LIST, {
          page: pagination.page,
          limit: pagination.limit,
          search: debouncedSearch
        });
      }
      if (res.success) {
        if (isWali) {
          setData(res.data.violations);
          setTotalPoints(res.data.total_points);
        } else {
          setData(res.data);
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      toast.error(err.message || "Gagal memuat data pelanggaran");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openCreateModal = () => {
    setSelectedViolation(null);
    setStudentOption(null);
    setFormData({
      santri_id: "",
      tanggal: new Date().toISOString().split("T")[0],
      nama_pelanggaran: "",
      point: "5",
      sanksi: "",
      keterangan: ""
    });
    setModalOpen(true);
  };

  const openEditModal = (violation) => {
    setSelectedViolation(violation);
    setFormData({
      santri_id: violation.santri_id,
      tanggal: violation.tanggal,
      nama_pelanggaran: violation.nama_pelanggaran,
      point: Number(violation.point).toFixed(0),
      sanksi: violation.sanksi || "",
      keterangan: violation.keterangan || ""
    });
    setStudentOption(
      violation.santri
        ? { value: violation.santri.id, label: `${violation.santri.nama_lengkap} (NIS: ${violation.santri.nis})` }
        : null
    );
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.santri_id || !formData.nama_pelanggaran || !formData.point) {
      toast.error("Santri, nama pelanggaran, dan poin wajib diisi");
      return;
    }

    setActionLoading(true);
    try {
      let res;
      if (selectedViolation) {
        res = await request.put(API_ENDPOINTS.PELANGGARAN.UPDATE(selectedViolation.id), formData);
      } else {
        res = await request.post(API_ENDPOINTS.PELANGGARAN.CREATE, formData);
      }

      if (res.success) {
        toast.success(res.message);
        setModalOpen(false);
        fetchViolations();
      }
    } catch (err) {
      toast.error(err.message || "Gagal mencatat pelanggaran");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    setActionLoading(true);
    try {
      const res = await request.delete(API_ENDPOINTS.PELANGGARAN.DELETE(deleteId));
      if (res.success) {
        toast.success(res.message);
        setDeleteOpen(false);
        fetchViolations();
      }
    } catch (err) {
      toast.error(err.message || "Gagal menghapus catatan");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Wali Santri total points card */}
      {isWali && !isLoading && (
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-2xl shadow-lg flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Total Akumulasi Poin Pelanggaran</h2>
            <p className="text-red-100 text-xs mt-1">Santri dengan akumulasi poin tinggi akan mendapatkan pembinaan khusus.</p>
          </div>
          <div className="text-3xl font-extrabold bg-white/20 backdrop-blur-md px-5 py-3 rounded-xl border border-white/10">
            {totalPoints} Poin
          </div>
        </div>
      )}

      {/* Control panel */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        {!isWali ? (
          <div className="relative w-full sm:w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari santri atau nama pelanggaran..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm font-medium text-slate-700"
            />
          </div>
        ) : (
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
            <AlertOctagon size={18} className="text-red-500" />
            Catatan Perilaku / Pelanggaran Santri
          </h3>
        )}

        {!isWali && (
          <button
            onClick={openCreateModal}
            className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus size={16} />
            Catat Pelanggaran
          </button>
        )}
      </div>

      {/* Violations List Table */}
      {isLoading ? (
        <SkeletonTable rows={5} cols={isWali ? 4 : 5} />
      ) : data.length === 0 ? (
        <div className="bg-white border border-slate-100 p-12 rounded-2xl text-center">
          <p className="text-slate-400 text-sm font-medium">Alhamdulillah, tidak ada catatan pelanggaran santri.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-slide-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4 w-16">No</th>
                  {!isWali && <th className="px-6 py-4">Santri</th>}
                  <th className="px-6 py-4">Pelanggaran</th>
                  <th className="px-6 py-4">Sanksi / Tindakan</th>
                  <th className="px-6 py-4">Poin</th>
                  {!isWali && <th className="px-6 py-4 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700 font-medium">
                {data.map((violation, idx) => (
                  <tr key={violation.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      {isWali ? idx + 1 : (pagination.page - 1) * pagination.limit + idx + 1}
                    </td>
                    {!isWali && (
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{violation.santri?.nama_lengkap}</div>
                        <div className="text-xs text-slate-400 mt-0.5">Kelas: {violation.santri?.kelas?.nama_kelas ?? "-"}</div>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-850">{violation.nama_pelanggaran}</div>
                      <div className="text-xs text-slate-450 mt-0.5 text-slate-400 flex items-center gap-1">
                        <Calendar size={12} /> {violation.tanggal}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{violation.sanksi || <span className="text-slate-400 font-normal">-</span>}</div>
                      <div className="text-[11px] text-slate-400 font-normal mt-0.5">{violation.keterangan}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-red-50 text-red-700 text-xs font-extrabold rounded">
                        +{violation.point}
                      </span>
                    </td>
                    {!isWali && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(violation)}
                            title="Edit Catatan"
                            className="p-1.5 text-slate-500 hover:text-indigo-650 rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(violation.id)}
                            title="Hapus Catatan"
                            className="p-1.5 text-slate-500 hover:text-red-700 rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
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

      {/* Record Violation Modal (Admin) */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedViolation ? "Ubah Catatan Pelanggaran" : "Catat Pelanggaran Santri"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Cari & Pilih Santri</label>
            <SelectApi
              endpoint={API_ENDPOINTS.SANTRI.LIST}
              mapOptions={(item) => ({ value: item.id, label: `${item.nama_lengkap} (NIS: ${item.nis ?? "-"})` })}
              value={studentOption}
              placeholder="Ketik nama santri..."
              onChange={(option) => {
                setStudentOption(option);
                setFormData({ ...formData, santri_id: option ? option.value : "" });
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Tanggal Pelanggaran</label>
              <input
                type="date"
                name="tanggal"
                value={formData.tanggal}
                onChange={handleTextChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Poin Pelanggaran</label>
              <input
                type="number"
                name="point"
                value={formData.point}
                onChange={handleTextChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 text-sm text-slate-700"
                placeholder="Misal: 5"
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Pelanggaran</label>
            <input
              type="text"
              name="nama_pelanggaran"
              value={formData.nama_pelanggaran}
              onChange={handleTextChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 text-sm text-slate-750"
              placeholder="Contoh: Terlambat kembali ke pondok"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Sanksi / Tindakan Pembinaan</label>
            <input
              type="text"
              name="sanksi"
              value={formData.sanksi}
              onChange={handleTextChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none text-sm"
              placeholder="Contoh: Hafalan Juz 30 / Bersih lingkungan..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Keterangan Tambahan</label>
            <textarea
              name="keterangan"
              value={formData.keterangan}
              onChange={handleTextChange}
              rows="3"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none text-sm"
              placeholder="Tulis kronologi singkat atau rincian pelanggaran..."
            ></textarea>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-50">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
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
              Catat Pelanggaran
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
        isLoading={actionLoading}
      />
    </div>
  );
};

export default PelanggaranAdmin;
