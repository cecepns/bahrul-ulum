import React, { useState, useEffect } from "react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import Pagination from "../components/Pagination";
import Modal from "../components/Modal";
import SelectApi from "../components/SelectApi";
import ConfirmModal from "../components/ConfirmModal";
import { SkeletonTable } from "../components/Skeleton";
import { Plus, Edit2, Trash2, Search, ArrowUpCircle, UserMinus, Users, Eye } from "lucide-react";
import toast from "react-hot-toast";

const KelasAdmin = () => {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedKelas, setSelectedKelas] = useState(null);
  const [formData, setFormData] = useState({ nama_kelas: "", wali_kelas: "" });

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);

  // Kenaikan Kelas Modals
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [targetClassOption, setTargetClassOption] = useState(null);
  const [targetClassId, setTargetClassId] = useState("");

  // Mutasi Modals
  const [mutasiOpen, setMutasiOpen] = useState(false);
  const [mutasiStudent, setMutasiStudent] = useState(null);
  const [mutasiStatus, setMutasiStatus] = useState("alumni");

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
    fetchKelasList();
  }, [pagination.page, pagination.limit, debouncedSearch]);

  const fetchKelasList = async () => {
    setIsLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.KELAS.LIST, {
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch
      });
      if (res.success) {
        setData(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      toast.error(err.message || "Gagal memuat data kelas");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openCreateModal = () => {
    setSelectedKelas(null);
    setFormData({ nama_kelas: "", wali_kelas: "" });
    setModalOpen(true);
  };

  const openEditModal = (kelas) => {
    setSelectedKelas(kelas);
    setFormData({ nama_kelas: kelas.nama_kelas, wali_kelas: kelas.wali_kelas || "" });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nama_kelas) {
      toast.error("Nama kelas wajib diisi");
      return;
    }

    setActionLoading(true);
    try {
      let res;
      if (selectedKelas) {
        res = await request.put(API_ENDPOINTS.KELAS.UPDATE(selectedKelas.id), formData);
      } else {
        res = await request.post(API_ENDPOINTS.KELAS.CREATE, formData);
      }

      if (res.success) {
        toast.success(res.message);
        setModalOpen(false);
        fetchKelasList();
      }
    } catch (err) {
      toast.error(err.message || "Gagal menyimpan kelas");
    } finally {
      setActionLoading(false);
    }
  };

  const openDetails = async (id) => {
    setIsLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.KELAS.DETAIL(id));
      if (res.success) {
        setDetailData(res.data);
        setSelectedStudents([]);
        setDetailOpen(true);
      }
    } catch (err) {
      toast.error(err.message || "Gagal memuat detail kelas");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectStudent = (studentId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAllStudents = () => {
    if (!detailData) return;
    if (selectedStudents.length === detailData.students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(detailData.students.map((s) => s.id));
    }
  };

  const handlePromoteSubmit = async (e) => {
    e.preventDefault();
    if (selectedStudents.length === 0) {
      toast.error("Pilih minimal satu santri untuk kenaikan kelas");
      return;
    }

    setActionLoading(true);
    try {
      const res = await request.post(API_ENDPOINTS.KELAS.KENAIKAN, {
        student_ids: selectedStudents,
        target_kelas_id: targetClassId || null,
        tinggal_kelas: !targetClassId
      });
      if (res.success) {
        toast.success(res.message);
        setPromoteOpen(false);
        setDetailOpen(false);
        setTargetClassOption(null);
        setTargetClassId("");
        fetchKelasList();
      }
    } catch (err) {
      toast.error(err.message || "Gagal memproses kenaikan kelas");
    } finally {
      setActionLoading(false);
    }
  };

  const openMutasiModal = (student) => {
    setMutasiStudent(student);
    setMutasiStatus("alumni");
    setMutasiOpen(true);
  };

  const handleMutasiSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await request.post(API_ENDPOINTS.KELAS.MUTASI, {
        student_id: mutasiStudent.id,
        status_aktif: mutasiStatus
      });
      if (res.success) {
        toast.success(res.message);
        setMutasiOpen(false);
        setDetailOpen(false);
        fetchKelasList();
      }
    } catch (err) {
      toast.error(err.message || "Gagal menyimpan mutasi");
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
      const res = await request.delete(API_ENDPOINTS.KELAS.DELETE(deleteId));
      if (res.success) {
        toast.success(res.message);
        setDeleteOpen(false);
        fetchKelasList();
      }
    } catch (err) {
      toast.error(err.message || "Gagal menghapus kelas");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama kelas atau wali kelas..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium text-slate-700"
          />
        </div>

        <button
          onClick={openCreateModal}
          className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5"
        >
          <Plus size={16} />
          Buat Kelas Baru
        </button>
      </div>

      {/* Tables list */}
      {isLoading ? (
        <SkeletonTable rows={5} cols={4} />
      ) : data.length === 0 ? (
        <div className="bg-white border border-slate-100 p-12 rounded-2xl text-center">
          <p className="text-slate-400 text-sm font-medium">Belum ada data kelas aktif.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-slide-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">No</th>
                  <th className="px-6 py-4">Nama Kelas</th>
                  <th className="px-6 py-4">Wali Kelas</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700 font-medium">
                {data.map((kelas, idx) => (
                  <tr key={kelas.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">{(pagination.page - 1) * pagination.limit + idx + 1}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{kelas.nama_kelas}</td>
                    <td className="px-6 py-4">{kelas.wali_kelas ?? <span className="text-slate-400 font-normal">Belum ditentukan</span>}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDetails(kelas.id)}
                          title="Lihat Daftar Santri & Kenaikan"
                          className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => openEditModal(kelas)}
                          title="Edit Kelas"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(kelas.id)}
                          title="Hapus Kelas"
                          className="p-1.5 text-slate-500 hover:text-red-700 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
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

      {/* Class Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedKelas ? "Ubah Data Kelas" : "Buat Kelas Baru"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Kelas</label>
            <input
              type="text"
              name="nama_kelas"
              value={formData.nama_kelas}
              onChange={handleTextChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
              placeholder="Contoh: Kelas VII A (Putra)"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Wali Kelas</label>
            <input
              type="text"
              name="wali_kelas"
              value={formData.wali_kelas}
              onChange={handleTextChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
              placeholder="Nama Ustadz / Ustadzah"
            />
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
              {selectedKelas ? "Simpan Perubahan" : "Buat Kelas"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Class Detail & Batch Promotion Panel Modal */}
      <Modal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={detailData ? `Daftar Santri: ${detailData.kelas.nama_kelas}` : "Detail Kelas"}
      >
        {detailData && (
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-150">
              <span className="text-sm font-semibold text-slate-600">
                Total Santri Aktif: <strong className="text-slate-800">{detailData.students.length} Santri</strong>
              </span>

              {detailData.students.length > 0 && (
                <button
                  onClick={() => setPromoteOpen(true)}
                  disabled={selectedStudents.length === 0}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                >
                  <ArrowUpCircle size={14} />
                  Kenaikan Kelas ({selectedStudents.length})
                </button>
              )}
            </div>

            {detailData.students.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-4">Belum ada santri aktif di kelas ini.</p>
            ) : (
              <div className="max-h-60 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-100">
                {/* Select All */}
                <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 text-xs font-bold text-slate-500">
                  <input
                    type="checkbox"
                    checked={selectedStudents.length === detailData.students.length}
                    onChange={handleSelectAllStudents}
                    className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                  />
                  <span>Pilih Semua Santri</span>
                </div>
                {detailData.students.map((student) => (
                  <div key={student.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleSelectStudent(student.id)}
                        className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                      />
                      <div>
                        <div className="text-sm font-bold text-slate-800">{student.nama_lengkap}</div>
                        <div className="text-[10px] text-slate-400">NIS: {student.nis ?? "-"}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => openMutasiModal(student)}
                      title="Mutasi / Luluskan Santri"
                      className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      <UserMinus size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Kenaikan Kelas Target Modal */}
      <Modal
        isOpen={promoteOpen}
        onClose={() => setPromoteOpen(false)}
        title="Proses Kenaikan Kelas"
      >
        <form onSubmit={handlePromoteSubmit} className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Anda akan memindahkan <strong className="text-slate-700">{selectedStudents.length} santri</strong> terpilih. 
            Pilih kelas tujuan baru atau biarkan kosong jika status santri dinyatakan tinggal kelas.
          </p>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Kelas Tujuan Kenaikan</label>
            <SelectApi
              endpoint={API_ENDPOINTS.KELAS.SELECT}
              mapOptions={(item) => ({ value: item.id, label: item.nama_kelas })}
              value={targetClassOption}
              placeholder="Tinggal kelas (kosongkan) atau pilih kelas tujuan..."
              onChange={(option) => {
                setTargetClassOption(option);
                setTargetClassId(option ? option.value : "");
              }}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-50">
            <button
              type="button"
              onClick={() => setPromoteOpen(false)}
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
              Proses Kenaikan
            </button>
          </div>
        </form>
      </Modal>

      {/* Mutasi / Meluluskan Santri Modal */}
      <Modal
        isOpen={mutasiOpen}
        onClose={() => setMutasiOpen(false)}
        title="Status Kelulusan / Mutasi Santri"
      >
        {mutasiStudent && (
          <form onSubmit={handleMutasiSubmit} className="space-y-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              Mengubah status keaktifan santri <strong>{mutasiStudent.nama_lengkap}</strong> (NIS: {mutasiStudent.nis ?? "-"}). 
              Santri non-aktif otomatis dikeluarkan dari daftar kelas ini.
            </p>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Status Baru</label>
              <select
                value={mutasiStatus}
                onChange={(e) => setMutasiStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm bg-white text-slate-700"
              >
                <option value="alumni">Lulus / Alumni</option>
                <option value="mutasi">Mutasi Keluar</option>
                <option value="keluar">Keluar Pondok</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-50">
              <button
                type="button"
                onClick={() => setMutasiOpen(false)}
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
                Simpan Mutasi
              </button>
            </div>
          </form>
        )}
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

export default KelasAdmin;
