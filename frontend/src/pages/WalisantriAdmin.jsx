import React, { useState, useEffect } from "react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";
import Pagination from "../components/Pagination";
import { Search, Plus, Edit2, Trash2, Key, User, Mail, ShieldAlert, Check, X, Users } from "lucide-react";
import toast from "react-hot-toast";

const WalisantriAdmin = () => {
  const [walis, setWalis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedWali, setSelectedWali] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    status_aktif: 1,
    nis_siswa: ""
  });

  // Confirm delete states
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

  // Fetch Wali Santri data
  const fetchWalis = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.WALISANTRI.LIST, {
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch
      });
      if (res.success) {
        setWalis(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      toast.error(err.message || "Gagal memuat data wali santri");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalis();
  }, [pagination.page, pagination.limit, debouncedSearch]);

  const openCreateModal = () => {
    setSelectedWali(null);
    setFormData({
      username: "",
      email: "",
      password: "",
      status_aktif: 1,
      nis_siswa: ""
    });
    setModalOpen(true);
  };

  const openEditModal = (wali) => {
    setSelectedWali(wali);
    setFormData({
      username: wali.username,
      email: wali.email,
      password: "", // empty placeholder on edit
      status_aktif: Number(wali.status_aktif),
      nis_siswa: (wali.santri && wali.santri.length > 0) ? wali.santri[0].nis : ""
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.email) {
      toast.error("Username dan Email wajib diisi.");
      return;
    }
    if (!selectedWali && !formData.password) {
      toast.error("Password wajib diisi untuk akun baru.");
      return;
    }

    setActionLoading(true);
    try {
      let res;
      if (selectedWali) {
        // Edit
        res = await request.put(API_ENDPOINTS.WALISANTRI.UPDATE(selectedWali.id), formData);
      } else {
        // Create
        res = await request.post(API_ENDPOINTS.WALISANTRI.CREATE, formData);
      }

      if (res.success) {
        toast.success(res.message);
        setModalOpen(false);
        fetchWalis();
      }
    } catch (err) {
      toast.error(err.message || "Gagal menyimpan akun wali santri.");
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteModal = (id) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setActionLoading(true);
    try {
      const res = await request.delete(API_ENDPOINTS.WALISANTRI.DELETE(deleteId));
      if (res.success) {
        toast.success(res.message);
        setDeleteOpen(false);
        fetchWalis();
      }
    } catch (err) {
      toast.error(err.message || "Gagal menghapus wali santri.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="text-emerald-600" size={24} /> Manajemen Akun Wali Santri
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola data login wali santri, edit profil, dan atur ulang/ganti kata sandi secara instan.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Plus size={16} /> Tambah Akun Wali
        </button>
      </div>

      {/* Main Filter & Table Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-5 border-b border-slate-50 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Cari wali santri (username / email)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 w-full border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/50"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-4">Nama Akun / Username</th>
                <th className="px-6 py-4">Kontak Email</th>
                <th className="px-6 py-4">Hubungan Santri</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700 font-medium">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-2/3"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-3/4"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-1/2"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-full w-16"></div></td>
                    <td className="px-6 py-4 text-right"><div className="h-8 bg-slate-100 rounded w-16 ml-auto"></div></td>
                  </tr>
                ))
              ) : walis.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                    <ShieldAlert className="mx-auto text-slate-300 mb-2" size={40} />
                    Tidak ada data wali santri yang ditemukan.
                  </td>
                </tr>
              ) : (
                walis.map((wali) => (
                  <tr key={wali.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{wali.username}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">ID: {wali.id}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-650">{wali.email}</td>
                    <td className="px-6 py-4">
                      {wali.santri && wali.santri.length > 0 ? (
                        <div className="space-y-1">
                          {wali.santri.map((s) => (
                            <span key={s.id} className="inline-block bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded-md font-semibold mr-1.5 mb-1">
                              {s.nama_lengkap} (NIS: {s.nis ?? "-"})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-normal">Belum ditautkan ke santri</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        wali.status_aktif === 1
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}>
                        {wali.status_aktif === 1 ? (
                          <>
                            <Check size={12} /> Aktif
                          </>
                        ) : (
                          <>
                            <X size={12} /> Nonaktif
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(wali)}
                          title="Edit Akun & Reset Password"
                          className="p-1.5 text-slate-500 hover:text-indigo-650 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(wali.id)}
                          title="Hapus Akun"
                          className="p-1.5 text-slate-500 hover:text-red-700 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        {walis.length > 0 && (
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

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedWali ? "Ubah Akun Wali Santri" : "Tambah Akun Wali Santri"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Username / Nama Akun</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User size={16} />
              </span>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="pl-9 pr-4 py-2 w-full border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="misal: wali_ahmad"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Alamat Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail size={16} />
              </span>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="pl-9 pr-4 py-2 w-full border border-slate-200 rounded-xl text-sm focus:outline-none"
                placeholder="misal: wali.ahmad@gmail.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Tautkan NIS Santri (Anak)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Users size={16} />
              </span>
              <input
                type="text"
                value={formData.nis_siswa}
                onChange={(e) => setFormData({ ...formData, nis_siswa: e.target.value })}
                className="pl-9 pr-4 py-2 w-full border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="misal: 20250001 (Kosongkan jika belum/tidak ingin ditautkan)"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Masukkan NIS santri untuk menghubungkan wali dengan anak. Kosongkan jika ingin memutuskan hubungan.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              {selectedWali ? "Ganti Password (Opsional)" : "Password Baru"}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Key size={16} />
              </span>
              <input
                type="password"
                required={!selectedWali}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="pl-9 pr-4 py-2 w-full border border-slate-200 rounded-xl text-sm focus:outline-none"
                placeholder={selectedWali ? "Kosongkan jika tidak ingin ganti sandi" : "Minimal 6 karakter..."}
              />
            </div>
            {selectedWali && (
              <p className="text-[10px] text-slate-400 mt-1">
                Tulis sandi baru jika ingin membantu mengatur ulang sandi wali santri bersangkutan.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Status Keaktifan Akun</label>
            <select
              value={formData.status_aktif}
              onChange={(e) => setFormData({ ...formData, status_aktif: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white text-slate-700 focus:outline-none"
            >
              <option value={1}>Aktif (Bisa Login)</option>
              <option value={0}>Nonaktif (Ditangguhkan)</option>
            </select>
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
              Simpan Akun
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        isLoading={actionLoading}
      />
    </div>
  );
};

export default WalisantriAdmin;
