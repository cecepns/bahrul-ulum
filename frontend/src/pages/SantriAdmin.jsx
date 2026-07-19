import React, { useState, useEffect } from "react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import Pagination from "../components/Pagination";
import Modal from "../components/Modal";
import SelectApi from "../components/SelectApi";
import ConfirmModal from "../components/ConfirmModal";
import { SkeletonTable } from "../components/Skeleton";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  FileDown,
  Printer,
  Upload,
  UserCheck
} from "lucide-react";
import toast from "react-hot-toast";

const SantriAdmin = () => {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSantri, setSelectedSantri] = useState(null);
  const [formData, setFormData] = useState({
    nama_lengkap: "",
    nis: "",
    nisn: "",
    jk: "L",
    tempat_lahir: "",
    tanggal_lahir: "",
    alamat: "",
    nama_ayah: "",
    nama_ibu: "",
    hp_ortu: "",
    kelas_id: "",
    status_aktif: "aktif"
  });

  // Selected options for React Select Async loading labels
  const [selectedClassOption, setSelectedClassOption] = useState(null);

  const [files, setFiles] = useState({
    foto: null,
    kk_file: null,
    akta_file: null,
    ijazah_file: null
  });

  // Delete confirm modal states
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
    fetchSantriList();
  }, [pagination.page, pagination.limit, debouncedSearch]);

  const fetchSantriList = async () => {
    setIsLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.SANTRI.LIST, {
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch
      });
      if (res.success) {
        setData(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      toast.error(err.message || "Gagal memuat data santri");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFiles({ ...files, [e.target.name]: e.target.files[0] });
  };

  const openCreateModal = () => {
    setSelectedSantri(null);
    setSelectedClassOption(null);
    setFormData({
      nama_lengkap: "",
      nis: "",
      nisn: "",
      jk: "L",
      tempat_lahir: "",
      tanggal_lahir: "",
      alamat: "",
      nama_ayah: "",
      nama_ibu: "",
      hp_ortu: "",
      kelas_id: "",
      status_aktif: "aktif"
    });
    setFiles({ foto: null, kk_file: null, akta_file: null, ijazah_file: null });
    setModalOpen(true);
  };

  const openEditModal = (santri) => {
    setSelectedSantri(santri);
    setFormData({
      nama_lengkap: santri.nama_lengkap,
      nis: santri.nis || "",
      nisn: santri.nisn || "",
      jk: santri.jk,
      tempat_lahir: santri.tempat_lahir,
      tanggal_lahir: santri.tanggal_lahir,
      alamat: santri.alamat,
      nama_ayah: santri.nama_ayah,
      nama_ibu: santri.nama_ibu,
      hp_ortu: santri.hp_ortu,
      kelas_id: santri.kelas_id || "",
      status_aktif: santri.status_aktif
    });
    setSelectedClassOption(
      santri.kelas
        ? { value: santri.kelas.id, label: santri.kelas.nama_kelas }
        : null
    );
    setFiles({ foto: null, kk_file: null, akta_file: null, ijazah_file: null });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nama_lengkap || !formData.nis || !formData.tempat_lahir || !formData.tanggal_lahir) {
      toast.error("Silakan isi nama lengkap, NIS, tempat lahir, dan tanggal lahir.");
      return;
    }

    setActionLoading(true);
    try {
      const payload = new FormData();
      Object.keys(formData).forEach((key) => {
        payload.append(key, formData[key]);
      });
      // Append files
      Object.keys(files).forEach((key) => {
        if (files[key]) {
          payload.append(key, files[key]);
        }
      });

      let res;
      if (selectedSantri) {
        // Edit
        res = await request.post(API_ENDPOINTS.SANTRI.UPDATE(selectedSantri.id), payload, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      } else {
        // Create
        // Set tahun ajaran aktif fallback in backend, or retrieve first
        res = await request.post(API_ENDPOINTS.SANTRI.CREATE, payload, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }

      if (res.success) {
        toast.success(res.message);
        setModalOpen(false);
        fetchSantriList();
      }
    } catch (err) {
      toast.error(err.message || "Gagal menyimpan data santri.");
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
      const res = await request.delete(API_ENDPOINTS.SANTRI.DELETE(deleteId));
      if (res.success) {
        toast.success(res.message);
        setDeleteOpen(false);
        fetchSantriList();
      }
    } catch (err) {
      toast.error(err.message || "Gagal menghapus santri.");
    } finally {
      setActionLoading(false);
    }
  };

  // Helper download links
  const downloadBukuInduk = (id) => {
    const token = localStorage.getItem("token");
    const url = `${import.meta.env.VITE_API_URL || "https://api-siakad.kingcreativestudio.my.id"}${API_ENDPOINTS.SANTRI.BUKU_INDUK(id)}?token=${token}`;
    window.open(url, "_blank");
  };

  const exportCSV = () => {
    const token = localStorage.getItem("token");
    const url = `${import.meta.env.VITE_API_URL || "https://api-siakad.kingcreativestudio.my.id"}${API_ENDPOINTS.SANTRI.EXPORT_CSV}?token=${token}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari santri: Nama, NIS..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium text-slate-700"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={exportCSV}
            className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
          >
            <FileDown size={16} />
            Export CSV
          </button>

          <button
            onClick={openCreateModal}
            className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus size={16} />
            Tambah Santri
          </button>
        </div>
      </div>

      {/* Tables list */}
      {isLoading ? (
        <SkeletonTable rows={5} cols={5} />
      ) : data.length === 0 ? (
        <div className="bg-white border border-slate-100 p-12 rounded-2xl text-center">
          <p className="text-slate-400 text-sm font-medium">Belum ada data santri aktif.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-slide-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">NIS / NISN</th>
                  <th className="px-6 py-4">Nama Lengkap</th>
                  <th className="px-6 py-4">JK</th>
                  <th className="px-6 py-4">Kelas</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700 font-medium">
                {data.map((santri) => (
                  <tr key={santri.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>{santri.nis ?? "-"}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{santri.nisn ?? "-"}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{santri.nama_lengkap}</td>
                    <td className="px-6 py-4">{santri.jk === "L" ? "Laki-laki" : "Perempuan"}</td>
                    <td className="px-6 py-4">{santri.kelas?.nama_kelas ?? <span className="text-slate-400 font-normal">Belum Ditentukan</span>}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${santri.status_aktif === "aktif"
                          ? "bg-emerald-50 text-emerald-700"
                          : santri.status_aktif === "alumni"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-red-50 text-red-700"
                        }`}>
                        {santri.status_aktif}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => downloadBukuInduk(santri.id)}
                          title="Cetak Buku Induk PDF"
                          className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <Printer size={16} />
                        </button>
                        <button
                          onClick={() => openEditModal(santri)}
                          title="Edit Santri"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(santri.id)}
                          title="Hapus Santri"
                          className="p-1.5 text-slate-500 hover:text-red-650 rounded-lg hover:bg-slate-50 transition-colors"
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

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedSantri ? "Ubah Data Santri" : "Tambah Santri Baru"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                name="nama_lengkap"
                value={formData.nama_lengkap}
                onChange={handleTextChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                placeholder="Nama lengkap santri"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">NIS (Nomor Induk)</label>
              <input
                type="text"
                name="nis"
                value={formData.nis}
                onChange={handleTextChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                placeholder="2025xxx"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">NISN</label>
              <input
                type="text"
                name="nisn"
                value={formData.nisn}
                onChange={handleTextChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                placeholder="00xxxxxx"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
              <select
                name="jk"
                value={formData.jk}
                onChange={handleTextChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm bg-white text-slate-700"
              >
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Kelas Santri</label>
              <SelectApi
                endpoint={API_ENDPOINTS.KELAS.SELECT}
                mapOptions={(item) => ({ value: item.id, label: item.nama_kelas })}
                value={selectedClassOption}
                placeholder="Pilih kelas..."
                onChange={(option) => {
                  setSelectedClassOption(option);
                  setFormData({ ...formData, kelas_id: option ? option.value : "" });
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tempat Lahir</label>
                <input
                  type="text"
                  name="tempat_lahir"
                  value={formData.tempat_lahir}
                  onChange={handleTextChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tanggal Lahir</label>
                <input
                  type="date"
                  name="tanggal_lahir"
                  value={formData.tanggal_lahir}
                  onChange={handleTextChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm text-slate-705"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Status Keaktifan</label>
              <select
                name="status_aktif"
                value={formData.status_aktif}
                onChange={handleTextChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm bg-white text-slate-700"
              >
                <option value="aktif">Aktif</option>
                <option value="alumni">Alumni / Lulus</option>
                <option value="mutasi">Mutasi</option>
                <option value="keluar">Keluar</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Alamat Lengkap</label>
              <textarea
                name="alamat"
                value={formData.alamat}
                onChange={handleTextChange}
                rows="2"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Ayah</label>
              <input
                type="text"
                name="nama_ayah"
                value={formData.nama_ayah}
                onChange={handleTextChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Ibu</label>
              <input
                type="text"
                name="nama_ibu"
                value={formData.nama_ibu}
                onChange={handleTextChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">No. HP Orang Tua</label>
              <input
                type="text"
                name="hp_ortu"
                value={formData.hp_ortu}
                onChange={handleTextChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1"
              />
            </div>

            {/* Pas Foto Upload */}
            <div className="md:col-span-2 border border-dashed border-slate-250 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-slate-700 block">Pas Foto</span>
                <span className="text-[10px] text-slate-400">JPG/PNG maks. 2MB</span>
              </div>
              <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors text-slate-700">
                <Upload size={12} />
                Pilih Foto
                <input type="file" name="foto" onChange={handleFileChange} className="hidden" accept="image/*" />
              </label>
              {files.foto && <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded truncate max-w-[100px]">{files.foto.name}</span>}
            </div>
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
              {selectedSantri ? "Simpan Perubahan" : "Tambah Santri"}
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

export default SantriAdmin;
