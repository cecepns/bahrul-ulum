import React, { useState, useEffect } from "react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import ConfirmModal from "../components/ConfirmModal";
import { SkeletonTable } from "../components/Skeleton";
import {
  Save,
  Plus,
  Trash2,
  Edit2,
  FileText,
  Calendar,
  Lock,
  Download,
  School,
  Volume2
} from "lucide-react";
import toast from "react-hot-toast";

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch (e) {
    return dateStr;
  }
};

const SettingsAdmin = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const isSuper = user?.role === "superadmin";

  const [activeMenu, setActiveMenu] = useState("general"); // general, academic, announcements

  // General Settings states
  const [settings, setSettings] = useState({
    nama_pondok: "",
    alamat_pondok: "",
    no_telp: "",
    email_pondok: "",
    rekening_spp: "",
    rekening_pembangunan: "",
    logo_pondok: ""
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Tahun Ajaran states
  const [tahunList, setTahunList] = useState([]);
  const [taModalOpen, setTaModalOpen] = useState(false);
  const [taFormData, setTaFormData] = useState({ tahun: "", semester: "ganjil" });

  // Announcement states
  const [announcements, setAnnouncements] = useState([]);
  const [annPagination, setAnnPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [annModalOpen, setAnnModalOpen] = useState(false);
  const [selectedAnn, setSelectedAnn] = useState(null);
  const [annFormData, setAnnFormData] = useState({ judul: "", konten: "", status_aktif: true });

  const [actionLoading, setActionLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    if (activeMenu === "general") {
      fetchSettings();
    } else if (activeMenu === "academic") {
      fetchTahunAjaran();
    } else if (activeMenu === "announcements") {
      fetchAnnouncements();
    }
  }, [activeMenu, annPagination.page, annPagination.limit]);

  // General Settings API workflows
  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.SETTINGS.GET);
      if (res.success && res.data) {
        setSettings({
          nama_pondok: res.data.nama_pondok || "",
          alamat_pondok: res.data.alamat_pondok || "",
          no_telp: res.data.no_telp || "",
          email_pondok: res.data.email_pondok || "",
          rekening_spp: res.data.rekening_spp || "",
          rekening_pembangunan: res.data.rekening_pembangunan || "",
          logo_pondok: res.data.logo_pondok || ""
        });
        if (res.data.logo_pondok) {
          const API_URL = import.meta.env.VITE_API_URL || "https://api-siakad.kingcreativestudio.my.id";
          setLogoPreview(`${API_URL}/${res.data.logo_pondok}`);
        } else {
          setLogoPreview("");
        }
      }
    } catch (err) {
      toast.error("Gagal memuat pengaturan");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = new FormData();
      Object.keys(settings).forEach((key) => {
        if (key !== "logo_pondok") {
          payload.append(key, settings[key]);
        }
      });
      if (logoFile) {
        payload.append("logo_pondok", logoFile);
      } else {
        payload.append("logo_pondok", settings.logo_pondok);
      }

      const res = await request.post(API_ENDPOINTS.SETTINGS.SAVE, payload, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.success) {
        toast.success(res.message);
        fetchSettings();
        setLogoFile(null);
      }
    } catch (err) {
      toast.error("Gagal menyimpan pengaturan");
    } finally {
      setActionLoading(false);
    }
  };

  // Academic Years API workflows
  const fetchTahunAjaran = async () => {
    setSettingsLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.TAHUN_AJARAN.LIST);
      if (res.success) {
        setTahunList(res.data);
      }
    } catch (err) {
      toast.error("Gagal memuat tahun ajaran");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleTaSubmit = async (e) => {
    e.preventDefault();
    if (!taFormData.tahun) {
      toast.error("Tahun ajaran wajib ditulis");
      return;
    }

    setActionLoading(true);
    try {
      const res = await request.post(API_ENDPOINTS.TAHUN_AJARAN.CREATE, taFormData);
      if (res.success) {
        toast.success(res.message);
        setTaModalOpen(false);
        fetchTahunAjaran();
      }
    } catch (err) {
      toast.error("Gagal menyimpan tahun ajaran");
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivateTA = async (id) => {
    setActionLoading(true);
    try {
      const res = await request.post(API_ENDPOINTS.TAHUN_AJARAN.ACTIVATE(id));
      if (res.success) {
        toast.success(res.message);
        fetchTahunAjaran();
      }
    } catch (err) {
      toast.error("Gagal mengaktifkan tahun ajaran");
    } finally {
      setActionLoading(false);
    }
  };

  // Announcements CRUD workflows
  const fetchAnnouncements = async () => {
    setSettingsLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.PENGUMUMAN.LIST, {
        page: annPagination.page,
        limit: annPagination.limit
      });
      if (res.success) {
        setAnnouncements(res.data);
        setAnnPagination(res.pagination);
      }
    } catch (err) {
      toast.error("Gagal memuat pengumuman");
    } finally {
      setSettingsLoading(false);
    }
  };

  const openCreateAnn = () => {
    setSelectedAnn(null);
    setAnnFormData({ judul: "", konten: "", status_aktif: true });
    setAnnModalOpen(true);
  };

  const openEditAnn = (ann) => {
    setSelectedAnn(ann);
    setAnnFormData({ judul: ann.judul, konten: ann.konten, status_aktif: Boolean(ann.status_aktif) });
    setAnnModalOpen(true);
  };

  const handleAnnSubmit = async (e) => {
    e.preventDefault();
    if (!annFormData.judul || !annFormData.konten) {
      toast.error("Judul dan konten pengumuman wajib diisi");
      return;
    }

    setActionLoading(true);
    try {
      let res;
      if (selectedAnn) {
        res = await request.put(API_ENDPOINTS.PENGUMUMAN.UPDATE(selectedAnn.id), annFormData);
      } else {
        res = await request.post(API_ENDPOINTS.PENGUMUMAN.CREATE, annFormData);
      }

      if (res.success) {
        toast.success(res.message);
        setAnnModalOpen(false);
        fetchAnnouncements();
      }
    } catch (err) {
      toast.error("Gagal menyimpan pengumuman");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAnnDeleteClick = (id) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const confirmDeleteAnn = async () => {
    setActionLoading(true);
    try {
      const res = await request.delete(API_ENDPOINTS.PENGUMUMAN.DELETE(deleteId));
      if (res.success) {
        toast.success(res.message);
        setDeleteOpen(false);
        fetchAnnouncements();
      }
    } catch (err) {
      toast.error("Gagal menghapus pengumuman");
    } finally {
      setActionLoading(false);
    }
  };



  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start animate-slide-in">
      {/* Settings Navigation Menu */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-1 lg:col-span-1">
        <button
          onClick={() => setActiveMenu("general")}
          className={`w-full text-left px-4 py-3 rounded-xl transition-all font-semibold text-sm flex items-center gap-2 ${activeMenu === "general"
              ? "bg-emerald-50 text-emerald-700 font-bold"
              : "text-slate-650 text-slate-600 hover:bg-slate-50"
            }`}
        >
          <School size={16} /> Identitas Pondok
        </button>
        <button
          onClick={() => setActiveMenu("academic")}
          className={`w-full text-left px-4 py-3 rounded-xl transition-all font-semibold text-sm flex items-center gap-2 ${activeMenu === "academic"
              ? "bg-emerald-50 text-emerald-700 font-bold"
              : "text-slate-650 text-slate-600 hover:bg-slate-50"
            }`}
        >
          <Calendar size={16} /> Tahun Ajaran
        </button>
        <button
          onClick={() => setActiveMenu("announcements")}
          className={`w-full text-left px-4 py-3 rounded-xl transition-all font-semibold text-sm flex items-center gap-2 ${activeMenu === "announcements"
              ? "bg-emerald-50 text-emerald-700 font-bold"
              : "text-slate-650 text-slate-600 hover:bg-slate-50"
            }`}
        >
          <Volume2 size={16} /> Pengumuman Resmi
        </button>

      </div>

      {/* Settings Forms Body Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-3">
        {/* Menu: General Settings */}
        {activeMenu === "general" && (
          <form onSubmit={handleSettingsSubmit} className="space-y-6">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-50 pb-2">
              Pengaturan Identitas & Konfigurasi Pondok
            </h3>

            {settingsLoading ? (
              <div className="space-y-4 animate-pulse">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-10 bg-slate-150 rounded bg-slate-100"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50/55 rounded-2xl border border-slate-100 mb-2">
                  <div className="flex-shrink-0 w-20 h-20 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center p-1">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo Lembaga" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">NO LOGO</span>
                    )}
                  </div>
                  <div className="flex-1 w-full">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Logo Lembaga / Pondok</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setLogoFile(file);
                          setLogoPreview(URL.createObjectURL(file));
                        }
                      }}
                      className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-400 mt-1.5">Format: JPG, PNG, atau SVG (Maks. 2MB). Logo ini akan tercetak pada Kop surat Kuitansi, Raport, dan Buku Induk.</p>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Pondok Pesantren</label>
                  <input
                    type="text"
                    value={settings.nama_pondok}
                    onChange={(e) => setSettings({ ...settings, nama_pondok: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Alamat Lembaga</label>
                  <textarea
                    value={settings.alamat_pondok}
                    onChange={(e) => setSettings({ ...settings, alamat_pondok: e.target.value })}
                    rows="2"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 text-sm text-slate-700"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">No. Telpon Kantor</label>
                  <input
                    type="text"
                    value={settings.no_telp}
                    onChange={(e) => setSettings({ ...settings, no_telp: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email Resmi</label>
                  <input
                    type="email"
                    value={settings.email_pondok}
                    onChange={(e) => setSettings({ ...settings, email_pondok: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Rekening SPP (Bulanan)</label>
                  <input
                    type="text"
                    value={settings.rekening_spp}
                    onChange={(e) => setSettings({ ...settings, rekening_spp: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                    placeholder="Contoh: BSI 7123456789 a.n Bahrul Ulum"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Rekening Uang Pembangunan</label>
                  <input
                    type="text"
                    value={settings.rekening_pembangunan}
                    onChange={(e) => setSettings({ ...settings, rekening_pembangunan: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                    placeholder="Contoh: Mandiri 1420007654321 a.n Yayasan"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <Save size={14} />
              Simpan Pengaturan
            </button>
          </form>
        )}

        {/* Menu: Tahun Ajaran */}
        {activeMenu === "academic" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-2 border-b border-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">Tahun Ajaran & Semester</h3>
              <button
                onClick={() => setTaModalOpen(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-0.5"
              >
                <Plus size={14} /> Tambah Tahun
              </button>
            </div>

            {settingsLoading ? (
              <SkeletonTable rows={3} cols={4} />
            ) : (
              <div className="overflow-x-auto border border-slate-100 rounded-xl divide-y divide-slate-100">
                {tahunList.map((ta) => (
                  <div key={ta.id} className="flex justify-between items-center p-4 hover:bg-slate-50/20">
                    <div>
                      <div className="text-sm font-bold text-slate-800">Tahun Ajaran {ta.tahun}</div>
                      <div className="text-xs text-slate-400 mt-0.5 uppercase tracking-wide">Semester: {ta.semester}</div>
                    </div>
                    <div>
                      {ta.status_aktif ? (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full">
                          Aktif Digunakan
                        </span>
                      ) : (
                        <button
                          onClick={() => handleActivateTA(ta.id)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 text-xs font-bold rounded-xl transition-colors"
                        >
                          Aktifkan
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Menu: Announcements */}
        {activeMenu === "announcements" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-2 border-b border-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">Manajemen Pengumuman</h3>
              <button
                onClick={openCreateAnn}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-0.5"
              >
                <Plus size={14} /> Terbitkan
              </button>
            </div>

            {settingsLoading ? (
              <SkeletonTable rows={3} cols={4} />
            ) : announcements.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-4">Belum ada pengumuman resmi.</p>
            ) : (
              <div className="space-y-4">
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                  {announcements.map((ann) => (
                    <div key={ann.id} className="p-4 flex justify-between items-start hover:bg-slate-50/20">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-800">{ann.judul}</h4>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide ${ann.status_aktif ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                            }`}>
                            {ann.status_aktif ? "Tayang" : "Draft"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{ann.konten}</p>
                        <span className="text-[10px] text-slate-400 font-medium block pt-1">
                          Penulis: {ann.user?.username.replace(/_/g, ' ')} | Tanggal: {formatDate(ann.created_at)}
                        </span>
                      </div>
                      <div className="flex gap-1.5 ml-4">
                        <button
                          onClick={() => openEditAnn(ann)}
                          className="p-1.5 text-slate-400 hover:text-indigo-650 hover:bg-slate-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleAnnDeleteClick(ann.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <Pagination
                  page={annPagination.page}
                  limit={annPagination.limit}
                  total={annPagination.total}
                  totalPages={annPagination.totalPages}
                  onPageChange={(p) => setAnnPagination({ ...annPagination, page: p })}
                  onLimitChange={(l) => setAnnPagination({ ...annPagination, limit: l, page: 1 })}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tahun Ajaran Modal */}
      <Modal
        isOpen={taModalOpen}
        onClose={() => setTaModalOpen(false)}
        title="Tambah Tahun Ajaran Baru"
      >
        <form onSubmit={handleTaSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Tahun Ajaran</label>
            <input
              type="text"
              value={taFormData.tahun}
              onChange={(e) => setTaFormData({ ...taFormData, tahun: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
              placeholder="Contoh: 2026/2027"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Semester</label>
            <select
              value={taFormData.semester}
              onChange={(e) => setTaFormData({ ...taFormData, semester: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white text-slate-750"
            >
              <option value="ganjil">Semester Ganjil</option>
              <option value="genap">Semester Genap</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-50">
            <button
              type="button"
              onClick={() => setTaModalOpen(false)}
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
              Simpan Tahun
            </button>
          </div>
        </form>
      </Modal>

      {/* Announcement Create / Edit Modal */}
      <Modal
        isOpen={annModalOpen}
        onClose={() => setAnnModalOpen(false)}
        title={selectedAnn ? "Ubah Pengumuman" : "Terbitkan Pengumuman Resmi"}
      >
        <form onSubmit={handleAnnSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Judul Pengumuman</label>
            <input
              type="text"
              value={annFormData.judul}
              onChange={(e) => setAnnFormData({ ...annFormData, judul: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 text-sm text-slate-750"
              placeholder="Contoh: Jadwal Libur Semester Ganjil"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Isi / Konten Pengumuman</label>
            <textarea
              value={annFormData.konten}
              onChange={(e) => setAnnFormData({ ...annFormData, konten: e.target.value })}
              rows="6"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 text-sm text-slate-700"
              placeholder="Tuliskan berita / rincian pengumuman secara lengkap..."
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Status Publikasi</label>
            <select
              value={String(annFormData.status_aktif)}
              onChange={(e) => setAnnFormData({ ...annFormData, status_aktif: e.target.value === "true" })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white text-slate-700"
            >
              <option value="true">Langsung Tayang (Aktif)</option>
              <option value="false">Simpan sebagai Draft</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-50">
            <button
              type="button"
              onClick={() => setAnnModalOpen(false)}
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
              {selectedAnn ? "Simpan Perubahan" : "Terbitkan"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDeleteAnn}
        isLoading={actionLoading}
      />
    </div>
  );
};

export default SettingsAdmin;
