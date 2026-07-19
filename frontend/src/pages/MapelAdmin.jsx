import React, { useState, useEffect } from "react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import Pagination from "../components/Pagination";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";
import { SkeletonTable } from "../components/Skeleton";
import { Plus, Edit2, Trash2, Search, FileDown, Upload } from "lucide-react";
import toast from "react-hot-toast";

const MapelAdmin = () => {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMapel, setSelectedMapel] = useState(null);
  const [formData, setFormData] = useState({ nama_mapel: "", kode_mapel: "" });

  // Import states
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);

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
    fetchMapelList();
  }, [pagination.page, pagination.limit, debouncedSearch]);

  const fetchMapelList = async () => {
    setIsLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.MAPEL.LIST, {
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch
      });
      if (res.success) {
        setData(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      toast.error(err.message || "Gagal memuat mata pelajaran");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openCreateModal = () => {
    setSelectedMapel(null);
    setFormData({
      nama_mapel: "",
      kode_mapel: "MAPEL-" + String(Math.floor(Math.random() * 900) + 100)
    });
    setModalOpen(true);
  };

  const openEditModal = (mapel) => {
    setSelectedMapel(mapel);
    setFormData({ nama_mapel: mapel.nama_mapel, kode_mapel: mapel.kode_mapel });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nama_mapel || !formData.kode_mapel) {
      toast.error("Nama mapel dan kode mapel wajib diisi");
      return;
    }

    setActionLoading(true);
    try {
      let res;
      if (selectedMapel) {
        res = await request.put(API_ENDPOINTS.MAPEL.UPDATE(selectedMapel.id), formData);
      } else {
        res = await request.post(API_ENDPOINTS.MAPEL.CREATE, formData);
      }

      if (res.success) {
        toast.success(res.message);
        setModalOpen(false);
        fetchMapelList();
      }
    } catch (err) {
      toast.error(err.message || "Gagal menyimpan mata pelajaran");
    } finally {
      setActionLoading(false);
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) {
      toast.error("Pilih file excel / csv terlebih dahulu");
      return;
    }

    setActionLoading(true);
    try {
      const payload = new FormData();
      payload.append("file", importFile);

      const res = await request.post(API_ENDPOINTS.MAPEL.IMPORT, payload, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.success) {
        toast.success(res.message);
        setImportOpen(false);
        setImportFile(null);
        fetchMapelList();
      }
    } catch (err) {
      toast.error(err.message || "Gagal mengimpor file");
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
      const res = await request.delete(API_ENDPOINTS.MAPEL.DELETE(deleteId));
      if (res.success) {
        toast.success(res.message);
        setDeleteOpen(false);
        fetchMapelList();
      }
    } catch (err) {
      toast.error(err.message || "Gagal menghapus mata pelajaran");
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
            placeholder="Cari mata pelajaran atau kode..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium text-slate-700"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setImportOpen(true)}
            className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
          >
            <FileDown size={16} />
            Import Excel
          </button>
          
          <button
            onClick={openCreateModal}
            className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus size={16} />
            Tambah Mapel
          </button>
        </div>
      </div>

      {/* Tables list */}
      {isLoading ? (
        <SkeletonTable rows={5} cols={4} />
      ) : data.length === 0 ? (
        <div className="bg-white border border-slate-100 p-12 rounded-2xl text-center">
          <p className="text-slate-400 text-sm font-medium">Belum ada data mata pelajaran.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-slide-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">No</th>
                  <th className="px-6 py-4">Kode Mapel</th>
                  <th className="px-6 py-4">Nama Mata Pelajaran</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700 font-medium">
                {data.map((mapel, idx) => (
                  <tr key={mapel.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">{(pagination.page - 1) * pagination.limit + idx + 1}</td>
                    <td className="px-6 py-4 font-bold text-emerald-700">{mapel.kode_mapel}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{mapel.nama_mapel}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(mapel)}
                          title="Edit Mapel"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(mapel.id)}
                          title="Hapus Mapel"
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

      {/* Mapel Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedMapel ? "Ubah Mata Pelajaran" : "Tambah Mapel Baru"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Kode Mapel</label>
            <input
              type="text"
              name="kode_mapel"
              value={formData.kode_mapel}
              onChange={handleTextChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
              placeholder="MAPEL-00x"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Mata Pelajaran</label>
            <input
              type="text"
              name="nama_mapel"
              value={formData.nama_mapel}
              onChange={handleTextChange}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
              placeholder="Contoh: Kitab Fathul Qorib"
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
              {selectedMapel ? "Simpan Perubahan" : "Tambah Mapel"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Import Modal */}
      <Modal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import Mapel dari Excel"
      >
        <form onSubmit={handleImportSubmit} className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Format file harus berupa Excel (.xls, .xlsx) atau CSV dengan kolom: 
            <strong> kode_mapel, nama_mapel</strong>.
          </p>

          <div className="border border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <Upload className="text-slate-400 mb-2" size={24} />
            <span className="text-xs font-semibold text-slate-700 mb-2">Upload File Excel/CSV</span>
            <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 transition-colors">
              Pilih Berkas
              <input 
                type="file" 
                onChange={(e) => setImportFile(e.target.files[0])} 
                className="hidden" 
                accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
              />
            </label>
            {importFile && (
              <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-1 rounded font-bold mt-3 truncate max-w-full">
                {importFile.name}
              </span>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-50">
            <button
              type="button"
              onClick={() => {
                setImportOpen(false);
                setImportFile(null);
              }}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={actionLoading || !importFile}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              {actionLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : null}
              Mulai Import
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

export default MapelAdmin;
