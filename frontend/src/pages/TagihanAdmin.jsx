import React, { useState, useEffect } from "react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import Pagination from "../components/Pagination";
import Modal from "../components/Modal";
import SelectApi from "../components/SelectApi";
import ConfirmModal from "../components/ConfirmModal";
import { SkeletonTable } from "../components/Skeleton";
import { Plus, Check, X, Search, FileText, Printer, Upload, DollarSign, Calendar, Eye, Edit2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

const TagihanAdmin = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const isWali = user?.role === "walisantri";

  // Data states
  const [bills, setBills] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Modals (Admin - Manage Billing Types)
  const [billingTypesOpen, setBillingTypesOpen] = useState(false);
  const [billingTypes, setBillingTypes] = useState([]);
  const [typeFormOpen, setTypeFormOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [typeFormData, setTypeFormData] = useState({ nama_tagihan: "", nominal: "", tipe: "rutin" });

  // Generate Tagihan Modals
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generateTypeOption, setGenerateTypeOption] = useState(null);
  const [generateData, setGenerateData] = useState({
    jenis_tagihan_id: "",
    tanggal_tagihan: "",
    tanggal_jatuh_tempo: ""
  });

  // Verify Payment Modals (Admin)
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [verifyData, setVerifyData] = useState({ status_verifikasi: "disetujui", alasan_penolakan: "", catatan_admin: "" });

  // Upload Payment Modals (Wali)
  const [payOpen, setPayOpen] = useState(false);
  const [payFormData, setPayFormData] = useState({ nominal_bayar: "", tanggal_bayar: "" });
  const [payFile, setPayFile] = useState(null);

  const [actionLoading, setActionLoading] = useState(false);

  // Individual Tagihan Edit / Delete
  const [editBillOpen, setEditBillOpen] = useState(false);
  const [editBillFormData, setEditBillFormData] = useState({ status: "", tanggal_tagihan: "", tanggal_jatuh_tempo: "" });
  const [deleteBillOpen, setDeleteBillOpen] = useState(false);
  const [deleteBillId, setDeleteBillId] = useState(null);

  // Debounce search effect (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    fetchBills();
  }, [pagination.page, pagination.limit, debouncedSearch, status]);

  const fetchBills = async () => {
    setIsLoading(true);
    try {
      let res;
      if (isWali) {
        res = await request.get(API_ENDPOINTS.TAGIHAN.WALI);
      } else {
        res = await request.get(API_ENDPOINTS.TAGIHAN.LIST, {
          page: pagination.page,
          limit: pagination.limit,
          search: debouncedSearch,
          status: status
        });
      }
      if (res.success) {
        if (isWali) {
          setBills(res.data);
          // simulated pagination
          setPagination({ page: 1, limit: 100, total: res.data.length, totalPages: 1 });
        } else {
          setBills(res.data);
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      toast.error(err.message || "Gagal memuat tagihan");
    } finally {
      setIsLoading(false);
    }
  };

  // Manage Types Workflows
  const fetchBillingTypes = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.JENIS_TAGIHAN.LIST, { limit: 100 });
      if (res.success) {
        setBillingTypes(res.data);
      }
    } catch (err) {
      toast.error("Gagal memuat jenis tagihan");
    }
  };

  const openBillingTypes = () => {
    fetchBillingTypes();
    setBillingTypesOpen(true);
  };

  const openCreateType = () => {
    setSelectedType(null);
    setTypeFormData({ nama_tagihan: "", nominal: "", tipe: "rutin" });
    setTypeFormOpen(true);
  };

  const openEditType = (type) => {
    setSelectedType(type);
    setTypeFormData({ nama_tagihan: type.nama_tagihan, nominal: Number(type.nominal).toFixed(0), tipe: type.tipe });
    setTypeFormOpen(true);
  };

  const handleTypeSubmit = async (e) => {
    e.preventDefault();
    if (!typeFormData.nama_tagihan || !typeFormData.nominal) {
      toast.error("Nama tagihan dan nominal wajib diisi");
      return;
    }

    setActionLoading(true);
    try {
      let res;
      if (selectedType) {
        res = await request.put(API_ENDPOINTS.JENIS_TAGIHAN.UPDATE(selectedType.id), typeFormData);
      } else {
        res = await request.post(API_ENDPOINTS.JENIS_TAGIHAN.CREATE, typeFormData);
      }

      if (res.success) {
        toast.success(res.message);
        setTypeFormOpen(false);
        fetchBillingTypes();
      }
    } catch (err) {
      toast.error(err.message || "Gagal menyimpan jenis tagihan");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteBillingType = async (id) => {
    if (!confirm("Apakah Anda yakin ingin menghapus jenis tagihan ini?")) return;
    try {
      const res = await request.delete(API_ENDPOINTS.JENIS_TAGIHAN.DELETE(id));
      if (res.success) {
        toast.success(res.message);
        fetchBillingTypes();
      }
    } catch (err) {
      toast.error("Gagal menghapus jenis tagihan");
    }
  };

  // Generate Tagihan Rutin
  const openGenerateModal = () => {
    setGenerateTypeOption(null);
    setGenerateData({
      jenis_tagihan_id: "",
      tanggal_tagihan: dateString(0),
      tanggal_jatuh_tempo: dateString(10)
    });
    setGenerateOpen(true);
  };

  const handleGenerateSubmit = async (e) => {
    e.preventDefault();
    if (!generateData.jenis_tagihan_id || !generateData.tanggal_tagihan || !generateData.tanggal_jatuh_tempo) {
      toast.error("Semua kolom generate tagihan wajib diisi.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await request.post(API_ENDPOINTS.TAGIHAN.GENERATE, generateData);
      if (res.success) {
        toast.success(res.message);
        setGenerateOpen(false);
        fetchBills();
      }
    } catch (err) {
      toast.error(err.message || "Gagal meng-generate tagihan.");
    } finally {
      setActionLoading(false);
    }
  };

  // Wali Santri uploads payment
  const openPayModal = (bill) => {
    setSelectedBill(bill);
    setPayFormData({ nominal_bayar: Number(bill.jenis_tagihan.nominal).toFixed(0), tanggal_bayar: dateString(0) });
    setPayFile(null);
    setPayOpen(true);
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    if (!payFormData.nominal_bayar || !payFormData.tanggal_bayar || !payFile) {
      toast.error("Nominal bayar, tanggal, dan bukti transfer wajib diisi");
      return;
    }

    setActionLoading(true);
    try {
      const payload = new FormData();
      payload.append("nominal_bayar", payFormData.nominal_bayar);
      payload.append("tanggal_bayar", payFormData.tanggal_bayar);
      payload.append("bukti_transfer", payFile);

      const res = await request.post(API_ENDPOINTS.TAGIHAN.BAYAR(selectedBill.id), payload, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.success) {
        toast.success(res.message);
        setPayOpen(false);
        fetchBills();
      }
    } catch (err) {
      toast.error(err.message || "Gagal mengupload bukti pembayaran");
    } finally {
      setActionLoading(false);
    }
  };

  // Admin verifies payment
  const openVerifyModal = (bill) => {
    setSelectedBill(bill);
    setVerifyData({ status_verifikasi: "disetujui", alasan_penolakan: "", catatan_admin: "" });
    setVerifyOpen(true);
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (verifyData.status_verifikasi === "ditolak" && !verifyData.alasan_penolakan) {
      toast.error("Alasan penolakan wajib ditulis");
      return;
    }

    setActionLoading(true);
    try {
      const res = await request.post(API_ENDPOINTS.TAGIHAN.VERIFIKASI(selectedBill.id), verifyData);
      if (res.success) {
        toast.success(res.message);
        setVerifyOpen(false);
        fetchBills();
      }
    } catch (err) {
      toast.error(err.message || "Gagal memproses verifikasi");
    } finally {
      setActionLoading(false);
    }
  };

  const downloadKuitansi = (id) => {
    const token = localStorage.getItem("token");
    const url = `${import.meta.env.VITE_API_URL || "https://api-siakad.kingcreativestudio.my.id"}${API_ENDPOINTS.TAGIHAN.KUITANSI(id)}?token=${token}`;
    window.open(url, "_blank");
  };

  // Individual Tagihan Edit / Delete Workflows
  const openEditBillModal = (bill) => {
    setSelectedBill(bill);
    setEditBillFormData({
      status: bill.status,
      tanggal_tagihan: bill.tanggal_tagihan,
      tanggal_jatuh_tempo: bill.tanggal_jatuh_tempo
    });
    setEditBillOpen(true);
  };

  const handleEditBillSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await request.put(API_ENDPOINTS.TAGIHAN.UPDATE(selectedBill.id), editBillFormData);
      if (res.success) {
        toast.success(res.message);
        setEditBillOpen(false);
        fetchBills();
      }
    } catch (err) {
      toast.error(err.message || "Gagal memperbarui tagihan");
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteBillModal = (id) => {
    setDeleteBillId(id);
    setDeleteBillOpen(true);
  };

  const confirmDeleteBill = async () => {
    setActionLoading(true);
    try {
      const res = await request.delete(API_ENDPOINTS.TAGIHAN.DELETE(deleteBillId));
      if (res.success) {
        toast.success(res.message);
        setDeleteBillOpen(false);
        fetchBills();
      }
    } catch (err) {
      toast.error(err.message || "Gagal menghapus tagihan");
    } finally {
      setActionLoading(false);
    }
  };

  // Helpers
  const dateString = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split("T")[0];
  };

  const API_URL = import.meta.env.VITE_API_URL || "https://api-siakad.kingcreativestudio.my.id";

  return (
    <div className="space-y-6">
      {/* Header filter / control panel (different for admin and wali) */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">

        {/* Left Side search / status */}
        {!isWali ? (
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            {/* Search */}
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

            {/* Status Select */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full sm:w-44 px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Semua Status</option>
              <option value="belum_bayar">Belum Bayar</option>
              <option value="menunggu_verifikasi">Menunggu Verifikasi</option>
              <option value="lunas">Lunas / Disetujui</option>
              <option value="ditolak">Pembayaran Ditolak</option>
            </select>
          </div>
        ) : (
          <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <DollarSign size={20} className="text-emerald-500" />
            Daftar Tagihan SPP & Pembangunan Santri
          </h2>
        )}

        {/* Right Side buttons (Admin only) */}
        {!isWali && (
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={openBillingTypes}
              className="flex-1 md:flex-none px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
            >
              Master Tagihan
            </button>
            <button
              onClick={openGenerateModal}
              className="flex-1 md:flex-none px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus size={16} />
              Generate Tagihan
            </button>
          </div>
        )}
      </div>

      {/* Main Bills List Table */}
      {isLoading ? (
        <SkeletonTable rows={5} cols={isWali ? 5 : 6} />
      ) : bills.length === 0 ? (
        <div className="bg-white border border-slate-100 p-12 rounded-2xl text-center">
          <p className="text-slate-400 text-sm font-medium">Tidak ada data tagihan.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-slide-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                  {!isWali && <th className="px-6 py-4">Santri</th>}
                  <th className="px-6 py-4">Nama Tagihan</th>
                  <th className="px-6 py-4">Nominal</th>
                  <th className="px-6 py-4">Tanggal Tagihan</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700 font-medium">
                {bills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-slate-50/50 transition-colors">
                    {!isWali && (
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{bill.santri?.nama_lengkap}</div>
                        <div className="text-xs text-slate-400 mt-0.5">NIS: {bill.santri?.nis ?? "-"}</div>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div>{bill.jenis_tagihan?.nama_tagihan}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{bill.tahun_ajaran?.tahun} - Semester {bill.tahun_ajaran?.semester}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      Rp {Number(bill.jenis_tagihan?.nominal).toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4">
                      <div>{bill.tanggal_tagihan}</div>
                      <div className="text-xs text-red-500 mt-0.5 font-semibold">Jatuh Tempo: {bill.tanggal_jatuh_tempo}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${bill.status === "lunas"
                          ? "bg-emerald-50 text-emerald-700"
                          : bill.status === "menunggu_verifikasi"
                            ? "bg-amber-50 text-amber-700"
                            : bill.status === "ditolak"
                              ? "bg-red-50 text-red-700"
                              : "bg-slate-100 text-slate-600"
                        }`}>
                        {bill.status === "belum_bayar"
                          ? "Belum Bayar"
                          : bill.status === "menunggu_verifikasi"
                            ? "Menunggu Verifikasi"
                            : bill.status === "ditolak"
                              ? "Ditolak"
                              : "Lunas / Lulus"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isWali && (bill.status === "belum_bayar" || bill.status === "ditolak") && (
                          <button
                            onClick={() => openPayModal(bill)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors"
                          >
                            Bayar & Konfirmasi
                          </button>
                        )}

                        {!isWali && bill.status === "menunggu_verifikasi" && (
                          <button
                            onClick={() => openVerifyModal(bill)}
                            title="Verifikasi Bukti Transfer"
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Eye size={12} />
                            Verifikasi
                          </button>
                        )}

                        {bill.status === "lunas" && (
                          <button
                            onClick={() => downloadKuitansi(bill.id)}
                            title="Unduh Kuitansi PDF"
                            className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            <Printer size={16} />
                          </button>
                        )}

                        {!isWali && (
                          <>
                            <button
                              onClick={() => openEditBillModal(bill)}
                              title="Ubah Tagihan"
                              className="p-1.5 text-slate-500 hover:text-indigo-650 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => openDeleteBillModal(bill.id)}
                              title="Hapus Tagihan"
                              className="p-1.5 text-slate-500 hover:text-red-700 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                              <Trash2 size={16} />
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

      {/* Master Jenis Tagihan List Modal (Admin) */}
      <Modal
        isOpen={billingTypesOpen}
        onClose={() => setBillingTypesOpen(false)}
        title="Master Konfigurasi Jenis Tagihan"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-50">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Jenis Tagihan Aktif</span>
            <button
              onClick={openCreateType}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-0.5"
            >
              <Plus size={12} /> Tambah Jenis
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl">
            {billingTypes.map((type) => (
              <div key={type.id} className="flex justify-between items-center p-3 hover:bg-slate-50/50">
                <div>
                  <div className="text-sm font-bold text-slate-800">{type.nama_tagihan}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Nominal: Rp {Number(type.nominal).toLocaleString("id-ID")} | Tipe: {type.tipe === "rutin" ? "Rutin Bulanan" : "Sekali Bayar"}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => openEditType(type)}
                    className="p-1 text-slate-400 hover:text-indigo-650 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    onClick={() => deleteBillingType(type.id)}
                    className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Create / Edit Jenis Tagihan Modal */}
      <Modal
        isOpen={typeFormOpen}
        onClose={() => setTypeFormOpen(false)}
        title={selectedType ? "Ubah Jenis Tagihan" : "Tambah Jenis Tagihan Baru"}
      >
        <form onSubmit={handleTypeSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Tagihan</label>
            <input
              type="text"
              value={typeFormData.nama_tagihan}
              onChange={(e) => setTypeFormData({ ...typeFormData, nama_tagihan: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
              placeholder="Contoh: SPP Syahriyah Juli 2026"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Nominal (Rupiah)</label>
              <input
                type="number"
                value={typeFormData.nominal}
                onChange={(e) => setTypeFormData({ ...typeFormData, nominal: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 text-sm"
                placeholder="350000"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Tipe Tagihan</label>
              <select
                value={typeFormData.tipe}
                onChange={(e) => setTypeFormData({ ...typeFormData, tipe: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white text-slate-750"
              >
                <option value="rutin">Rutin / Bulanan</option>
                <option value="sekali_bayar">Sekali Bayar (Pembangunan / Pendaftaran)</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-50">
            <button
              type="button"
              onClick={() => setTypeFormOpen(false)}
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
              {selectedType ? "Simpan Perubahan" : "Simpan Jenis"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Generate Tagihan Rutin Modal */}
      <Modal
        isOpen={generateOpen}
        onClose={() => setGenerateOpen(false)}
        title="Generate Tagihan Santri Baru"
      >
        <form onSubmit={handleGenerateSubmit} className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Sistem akan secara otomatis menerbitkan tagihan keuangan kepada seluruh santri yang berstatus aktif
            di tahun ajaran yang sedang berjalan.
          </p>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Jenis Tagihan SPP / Keuangan</label>
            <SelectApi
              endpoint={API_ENDPOINTS.JENIS_TAGIHAN.SELECT}
              mapOptions={(item) => ({ value: item.id, label: `${item.nama_tagihan} (Rp ${Number(item.nominal).toLocaleString("id-ID")})` })}
              value={generateTypeOption}
              placeholder="Cari jenis tagihan..."
              onChange={(option) => {
                setGenerateTypeOption(option);
                setGenerateData({ ...generateData, jenis_tagihan_id: option ? option.value : "" });
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Tanggal Terbit</label>
              <input
                type="date"
                value={generateData.tanggal_tagihan}
                onChange={(e) => setGenerateData({ ...generateData, tanggal_tagihan: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Batas Jatuh Tempo</label>
              <input
                type="date"
                value={generateData.tanggal_jatuh_tempo}
                onChange={(e) => setGenerateData({ ...generateData, tanggal_jatuh_tempo: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-50">
            <button
              type="button"
              onClick={() => setGenerateOpen(false)}
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
              Generate Tagihan
            </button>
          </div>
        </form>
      </Modal>

      {/* Wali Santri Payment Upload Modal */}
      <Modal
        isOpen={payOpen}
        onClose={() => setPayOpen(false)}
        title="Konfirmasi Bukti Transfer"
      >
        {selectedBill && (
          <form onSubmit={handlePaySubmit} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
              <div>Tagihan: <strong>{selectedBill.jenis_tagihan.nama_tagihan}</strong></div>
              <div>Nominal SPP: <strong>Rp {Number(selectedBill.jenis_tagihan.nominal).toLocaleString("id-ID")}</strong></div>
              <div className="text-[10px] text-amber-600 font-bold">Transfer ke BSI Rekening Bendahara: 7123456789 a.n Bahrul Ulum</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nominal yang Ditransfer</label>
                <input
                  type="number"
                  value={payFormData.nominal_bayar}
                  onChange={(e) => setPayFormData({ ...payFormData, nominal_bayar: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  placeholder="350000"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tanggal Bayar / Transfer</label>
                <input
                  type="date"
                  value={payFormData.tanggal_bayar}
                  onChange={(e) => setPayFormData({ ...payFormData, tanggal_bayar: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="border border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center">
              <Upload className="text-slate-400 mb-2" size={24} />
              <span className="text-xs font-semibold text-slate-700 mb-2">Upload Bukti Transfer</span>
              <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 transition-colors">
                Pilih Foto
                <input
                  type="file"
                  onChange={(e) => setPayFile(e.target.files[0])}
                  className="hidden"
                  accept="image/*"
                />
              </label>
              {payFile && (
                <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-1 rounded font-bold mt-3 truncate max-w-full">
                  {payFile.name}
                </span>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-50">
              <button
                type="button"
                onClick={() => setPayOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={actionLoading || !payFile}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : null}
                Kirim Bukti Pembayaran
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Admin Verify Payment Upload Modal */}
      <Modal
        isOpen={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        title="Verifikasi Pembayaran Santri"
      >
        {selectedBill && selectedBill.pembayaran && (
          <form onSubmit={handleVerifySubmit} className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Detail Pengiriman Bukti</h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-750">
                <div>Nama Santri: <strong>{selectedBill.santri?.nama_lengkap}</strong></div>
                <div>Jumlah Transfer: <strong>Rp {Number(selectedBill.pembayaran.nominal_bayar).toLocaleString("id-ID")}</strong></div>
                <div>Tanggal Transfer: <strong>{selectedBill.pembayaran.tanggal_bayar}</strong></div>
                <div>Status Tagihan: <strong>{selectedBill.jenis_tagihan?.nama_tagihan}</strong></div>
              </div>

              {/* Bukti Transfer Image Link */}
              <div className="mt-3 text-center">
                <a
                  href={`${API_URL}/${selectedBill.pembayaran.bukti_transfer}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-semibold transition-colors"
                >
                  <FileText size={14} />
                  Lihat Gambar Bukti Transfer
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Verifikasi Tindakan</label>
                <select
                  value={verifyData.status_verifikasi}
                  onChange={(e) => setVerifyData({ ...verifyData, status_verifikasi: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white text-slate-750"
                >
                  <option value="disetujui">Approve / Setuju Lunas</option>
                  <option value="ditolak">Reject / Tolak</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Catatan Admin (Kuitansi)</label>
                <input
                  type="text"
                  value={verifyData.catatan_admin}
                  onChange={(e) => setVerifyData({ ...verifyData, catatan_admin: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
                  placeholder="Lunas terverifikasi via BSI"
                />
              </div>
            </div>

            {verifyData.status_verifikasi === "ditolak" && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Alasan Penolakan Pembayaran</label>
                <textarea
                  value={verifyData.alasan_penolakan}
                  onChange={(e) => setVerifyData({ ...verifyData, alasan_penolakan: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                  placeholder="Nominal tidak sesuai, harap kirim nominal pas..."
                ></textarea>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-slate-50">
              <button
                type="button"
                onClick={() => setVerifyOpen(false)}
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
                Simpan Verifikasi
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Edit Bill Modal */}
      <Modal
        isOpen={editBillOpen}
        onClose={() => setEditBillOpen(false)}
        title="Ubah Detail Tagihan Santri"
      >
        {selectedBill && (
          <form onSubmit={handleEditBillSubmit} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
              <div>Santri: <strong>{selectedBill.santri?.nama_lengkap}</strong></div>
              <div>Tagihan: <strong>{selectedBill.jenis_tagihan?.nama_tagihan}</strong></div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Status Pembayaran</label>
              <select
                value={editBillFormData.status}
                onChange={(e) => setEditBillFormData({ ...editBillFormData, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white text-slate-750"
              >
                <option value="belum_bayar">Belum Bayar</option>
                <option value="menunggu_verifikasi">Menunggu Verifikasi</option>
                <option value="lunas">Lunas / Disetujui</option>
                <option value="ditolak">Pembayaran Ditolak</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tanggal Terbit</label>
                <input
                  type="date"
                  value={editBillFormData.tanggal_tagihan}
                  onChange={(e) => setEditBillFormData({ ...editBillFormData, tanggal_tagihan: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Batas Jatuh Tempo</label>
                <input
                  type="date"
                  value={editBillFormData.tanggal_jatuh_tempo}
                  onChange={(e) => setEditBillFormData({ ...editBillFormData, tanggal_jatuh_tempo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-50">
              <button
                type="button"
                onClick={() => setEditBillOpen(false)}
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
                Simpan Perubahan
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Bill Confirm */}
      <ConfirmModal
        isOpen={deleteBillOpen}
        onClose={() => setDeleteBillOpen(false)}
        onConfirm={confirmDeleteBill}
        isLoading={actionLoading}
      />
    </div>
  );
};

export default TagihanAdmin;
