import React, { useState, useEffect } from "react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import Pagination from "../components/Pagination";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";
import { SkeletonTable } from "../components/Skeleton";
import { Plus, Check, X, Search, FileText, Upload, Calendar, Heart, Edit, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

const AlumniAdmin = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const isAlumni = user?.role === "alumni";

  // Data states
  const [alumniList, setAlumniList] = useState([]);
  const [donations, setDonations] = useState([]);
  const [accountsList, setAccountsList] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState(isAlumni ? "donasi" : "directory");
  const [isLoading, setIsLoading] = useState(true);

  // Alumni Submit Donation Modals
  const [donasiOpen, setDonasiOpen] = useState(false);
  const [donasiFormData, setDonasiFormData] = useState({ nominal: "", tanggal: new Date().toISOString().split("T")[0], catatan: "" });
  const [donasiFile, setDonasiFile] = useState(null);

  // Admin Donation Verification Modals
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);

  // Alumni Directory modals CRUD
  const [alumniModalOpen, setAlumniModalOpen] = useState(false);
  const [selectedAlumni, setSelectedAlumni] = useState(null);
  const [alumniFormData, setAlumniFormData] = useState({
    nama_lengkap: "",
    nis: "",
    alamat: "",
    jenis_kelamin: "Laki-laki",
    tempat_lahir: "",
    tanggal_lahir: "",
    tahun_ajaran_id: ""
  });
  const [alumniDeleteOpen, setAlumniDeleteOpen] = useState(false);
  const [alumniDeleteId, setAlumniDeleteId] = useState(null);
  const [tahunAjaranList, setTahunAjaranList] = useState([]);

  // Alumni account modals CRUD
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accountFormData, setAccountFormData] = useState({
    username: "",
    email: "",
    password: "",
    status_aktif: 1,
    nis_siswa: ""
  });
  const [accountDeleteOpen, setAccountDeleteOpen] = useState(false);
  const [accountDeleteId, setAccountDeleteId] = useState(null);

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
    if (activeTab === "directory") {
      fetchAlumniDirectory();
    } else if (activeTab === "donations" || activeTab === "donasi") {
      fetchDonations();
    } else if (activeTab === "accounts") {
      fetchAlumniAccounts();
    }
  }, [activeTab, pagination.page, pagination.limit, debouncedSearch]);

  useEffect(() => {
    const fetchTahunAjaran = async () => {
      try {
        const res = await request.get(API_ENDPOINTS.TAHUN_AJARAN.LIST);
        if (res.success) {
          setTahunAjaranList(res.data);
        }
      } catch (err) {
        // Fallback
      }
    };
    fetchTahunAjaran();
  }, []);

  const fetchAlumniDirectory = async () => {
    setIsLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.ALUMNI.LIST, {
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch
      });
      if (res.success) {
        setAlumniList(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      toast.error(err.message || "Gagal memuat alumni directory");
    } finally {
      setIsLoading(false);
    }
  };

  const openAlumniCreateModal = () => {
    setSelectedAlumni(null);
    setAlumniFormData({
      nama_lengkap: "",
      nis: "",
      alamat: "",
      jenis_kelamin: "Laki-laki",
      tempat_lahir: "",
      tanggal_lahir: "",
      tahun_ajaran_id: tahunAjaranList[0]?.id || ""
    });
    setAlumniModalOpen(true);
  };

  const openAlumniEditModal = (alumni) => {
    setSelectedAlumni(alumni);
    setAlumniFormData({
      nama_lengkap: alumni.nama_lengkap || "",
      nis: alumni.nis || "",
      alamat: alumni.alamat || "",
      jenis_kelamin: alumni.jenis_kelamin || "Laki-laki",
      tempat_lahir: alumni.tempat_lahir || "",
      tanggal_lahir: alumni.tanggal_lahir || "",
      tahun_ajaran_id: alumni.tahun_ajaran_id || ""
    });
    setAlumniModalOpen(true);
  };

  const handleAlumniSubmit = async (e) => {
    e.preventDefault();
    if (!alumniFormData.nama_lengkap) {
      toast.error("Nama Lengkap alumni wajib diisi.");
      return;
    }

    setActionLoading(true);
    try {
      let res;
      if (selectedAlumni) {
        res = await request.put(API_ENDPOINTS.ALUMNI.UPDATE(selectedAlumni.id), alumniFormData);
      } else {
        res = await request.post(API_ENDPOINTS.ALUMNI.CREATE, alumniFormData);
      }

      if (res.success) {
        toast.success(res.message);
        setAlumniModalOpen(false);
        fetchAlumniDirectory();
      }
    } catch (err) {
      toast.error(err.message || "Gagal menyimpan data alumni.");
    } finally {
      setActionLoading(false);
    }
  };

  const openAlumniDeleteModal = (id) => {
    setAlumniDeleteId(id);
    setAlumniDeleteOpen(true);
  };

  const handleAlumniDeleteConfirm = async () => {
    setActionLoading(true);
    try {
      const res = await request.delete(API_ENDPOINTS.ALUMNI.DELETE(alumniDeleteId));
      if (res.success) {
        toast.success(res.message);
        setAlumniDeleteOpen(false);
        fetchAlumniDirectory();
      }
    } catch (err) {
      toast.error(err.message || "Gagal menghapus data alumni.");
    } finally {
      setActionLoading(false);
    }
  };

  const fetchDonations = async () => {
    setIsLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.ALUMNI.DONASI, {
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch
      });
      if (res.success) {
        setDonations(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      toast.error(err.message || "Gagal memuat log donasi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDonasiSubmit = async (e) => {
    e.preventDefault();
    if (!donasiFormData.nominal || !donasiFile) {
      toast.error("Nominal donasi dan bukti transfer wajib dilampirkan.");
      return;
    }

    setActionLoading(true);
    try {
      const payload = new FormData();
      payload.append("nominal", donasiFormData.nominal);
      payload.append("tanggal", donasiFormData.tanggal);
      payload.append("catatan", donasiFormData.catatan);
      payload.append("bukti_transfer", donasiFile);

      const res = await request.post(API_ENDPOINTS.ALUMNI.DONASI, payload, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.success) {
        toast.success(res.message);
        setDonasiOpen(false);
        fetchDonations();
      }
    } catch (err) {
      toast.error(err.message || "Gagal mengirim donasi.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyDonation = async (id, approve) => {
    setActionLoading(true);
    try {
      const res = await request.post(API_ENDPOINTS.ALUMNI.VERIFIKASI_DONASI(id), {
        status: approve ? "approved" : "rejected"
      });
      if (res.success) {
        toast.success(res.message);
        setVerifyOpen(false);
        fetchDonations();
      }
    } catch (err) {
      toast.error(err.message || "Gagal memproses verifikasi donasi");
    } finally {
      setActionLoading(false);
    }
  };

  const fetchAlumniAccounts = async () => {
    setIsLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.ALUMNI.ACCOUNTS.LIST, {
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch
      });
      if (res.success) {
        setAccountsList(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      toast.error(err.message || "Gagal memuat daftar akun alumni");
    } finally {
      setIsLoading(false);
    }
  };

  const openAccountCreateModal = () => {
    setSelectedAccount(null);
    setAccountFormData({
      username: "",
      email: "",
      password: "",
      status_aktif: 1,
      nis_siswa: ""
    });
    setAccountModalOpen(true);
  };

  const openAccountEditModal = (acc) => {
    setSelectedAccount(acc);
    setAccountFormData({
      username: acc.username,
      email: acc.email,
      password: "",
      status_aktif: Number(acc.status_aktif),
      nis_siswa: (acc.santri && acc.santri.length > 0) ? acc.santri[0].nis : ""
    });
    setAccountModalOpen(true);
  };

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    if (!accountFormData.username || !accountFormData.email) {
      toast.error("Username dan Email wajib diisi.");
      return;
    }
    if (!selectedAccount && !accountFormData.password) {
      toast.error("Password wajib diisi untuk akun baru.");
      return;
    }

    setActionLoading(true);
    try {
      let res;
      if (selectedAccount) {
        res = await request.put(API_ENDPOINTS.ALUMNI.ACCOUNTS.UPDATE(selectedAccount.id), accountFormData);
      } else {
        res = await request.post(API_ENDPOINTS.ALUMNI.ACCOUNTS.CREATE, accountFormData);
      }

      if (res.success) {
        toast.success(res.message);
        setAccountModalOpen(false);
        fetchAlumniAccounts();
      }
    } catch (err) {
      toast.error(err.message || "Gagal menyimpan akun alumni.");
    } finally {
      setActionLoading(false);
    }
  };

  const openAccountDeleteModal = (id) => {
    setAccountDeleteId(id);
    setAccountDeleteOpen(true);
  };

  const handleAccountDeleteConfirm = async () => {
    setActionLoading(true);
    try {
      const res = await request.delete(API_ENDPOINTS.ALUMNI.ACCOUNTS.DELETE(accountDeleteId));
      if (res.success) {
        toast.success(res.message);
        setAccountDeleteOpen(false);
        fetchAlumniAccounts();
      }
    } catch (err) {
      toast.error(err.message || "Gagal menghapus akun alumni.");
    } finally {
      setActionLoading(false);
    }
  };

  const API_URL = import.meta.env.VITE_API_URL || "https://api-ebum.bahrululum.or.id";

  return (
    <div className="space-y-6">
      {/* Selection Tabs Bar (Only for admins, alumni can only see Donations) */}
      {!isAlumni ? (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          {/* Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
            {["directory", "donations"].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className={`flex-1 md:flex-none px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all ${(tab === "directory" && activeTab === "directory") || (tab === "donations" && activeTab === "donations")
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                {tab === "directory" ? "Direktori Alumni" : "Log Donasi / Wakaf"}
              </button>
            ))}
          </div>

          {/* Action buttons & Search */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {activeTab === "directory" && (
              <button
                onClick={openAlumniCreateModal}
                className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus size={16} />
                Tambah Alumni
              </button>
            )}
            <div className="relative w-full md:w-80">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search size={18} />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 text-sm font-medium text-slate-700"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Heart size={20} className="text-red-500 fill-red-500 animate-pulse" />
            Portal Donasi & Wakaf Alumni
          </h2>

          <button
            onClick={() => {
              setDonasiFormData({ nominal: "", tanggal: new Date().toISOString().split("T")[0], catatan: "" });
              setDonasiFile(null);
              setDonasiOpen(true);
            }}
            className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus size={16} />
            Kirim Donasi / Wakaf
          </button>
        </div>
      )}

      {/* Directory Tab View */}
      {activeTab === "directory" && (
        <>
          {isLoading ? (
            <SkeletonTable rows={5} cols={isAlumni ? 5 : 6} />
          ) : alumniList.length === 0 ? (
            <div className="bg-white border border-slate-100 p-12 rounded-2xl text-center">
              <p className="text-slate-400 text-sm font-medium">Tidak ada data alumni.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-slide-in">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-4">No</th>
                      <th className="px-6 py-4">Nama Lengkap</th>
                      <th className="px-6 py-4">NIS</th>
                      <th className="px-6 py-4">Alamat</th>
                      <th className="px-6 py-4">Tahun Keluar</th>
                      {!isAlumni && <th className="px-6 py-4 text-right">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700 font-medium">
                    {alumniList.map((alumni, idx) => (
                      <tr key={alumni.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4">{(pagination.page - 1) * pagination.limit + idx + 1}</td>
                        <td className="px-6 py-4 font-semibold text-slate-800">{alumni.nama_lengkap}</td>
                        <td className="px-6 py-4">{alumni.nis ?? "-"}</td>
                        <td className="px-6 py-4">{alumni.alamat || "-"}</td>
                        <td className="px-6 py-4">{alumni.tahun_ajaran?.tahun ?? "-"}</td>
                        {!isAlumni && (
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openAlumniEditModal(alumni)}
                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-50 rounded-lg transition-colors"
                                title="Edit Alumni"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => openAlumniDeleteModal(alumni.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-50 rounded-lg transition-colors"
                                title="Hapus Alumni"
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
        </>
      )}

      {/* Donations Tab View */}
      {activeTab !== "directory" && (
        <>
          {isLoading ? (
            <SkeletonTable rows={5} cols={5} />
          ) : donations.length === 0 ? (
            <div className="bg-white border border-slate-100 p-12 rounded-2xl text-center">
              <p className="text-slate-400 text-sm font-medium">Belum ada donasi terkirim.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-slide-in">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-4">No</th>
                      {!isAlumni && <th className="px-6 py-4">Pengirim</th>}
                      <th className="px-6 py-4">Nominal</th>
                      <th className="px-6 py-4">Catatan</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700 font-medium">
                    {donations.map((donasi, idx) => (
                      <tr key={donasi.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4">
                          {isAlumni ? idx + 1 : (pagination.page - 1) * pagination.limit + idx + 1}
                        </td>
                        {!isAlumni && (
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-800">{donasi.user?.username.replace(/_/g, ' ')}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{donasi.user?.email}</div>
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">Rp {Number(donasi.nominal).toLocaleString("id-ID")}</div>
                          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                            <Calendar size={12} /> {donasi.tanggal}
                          </div>
                        </td>
                        <td className="px-6 py-4 max-w-[200px] truncate" title={donasi.catatan}>{donasi.catatan || "-"}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${donasi.status === "approved"
                            ? "bg-emerald-50 text-emerald-700"
                            : donasi.status === "rejected"
                              ? "bg-red-50 text-red-700"
                              : "bg-amber-50 text-amber-700"
                            }`}>
                            {donasi.status === "pending" ? "Menunggu" : donasi.status === "approved" ? "Terverifikasi" : "Ditolak"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Verify button for admin */}
                            {!isAlumni && donasi.status === "pending" && (
                              <button
                                onClick={() => {
                                  setSelectedDonation(donasi);
                                  setVerifyOpen(true);
                                }}
                                className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-0.5"
                              >
                                Verify
                              </button>
                            )}

                            {/* View image fallback */}
                            <a
                              href={`${API_URL}/${donasi.bukti_transfer}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-50 rounded-lg transition-colors"
                            >
                              <FileText size={16} />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!isAlumni && (
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
        </>
      )}

      {/* Alumni Submit Donation Modal */}
      <Modal
        isOpen={donasiOpen}
        onClose={() => setDonasiOpen(false)}
        title="Donasi & Kontribusi Alumni"
      >
        <form onSubmit={handleDonasiSubmit} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-650 space-y-1">
            <div className="font-bold text-slate-700">Petunjuk Transfer:</div>
            <div>Bank Mandiri Rekening Yayasan: <strong>1420007654321</strong></div>
            <div>a.n <strong>Yayasan Bahrul Ulum Jombang</strong></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Nominal Donasi (Rupiah)</label>
              <input
                type="number"
                value={donasiFormData.nominal}
                onChange={(e) => setDonasiFormData({ ...donasiFormData, nominal: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
                placeholder="Misal: 500000"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Tanggal Transfer</label>
              <input
                type="date"
                value={donasiFormData.tanggal}
                onChange={(e) => setDonasiFormData({ ...donasiFormData, tanggal: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Catatan / Peruntukan Donasi</label>
            <textarea
              value={donasiFormData.catatan}
              onChange={(e) => setDonasiFormData({ ...donasiFormData, catatan: e.target.value })}
              rows="3"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none text-sm text-slate-700"
              placeholder="Contoh: Wakaf perluasan masjid / pembelian karpet..."
            ></textarea>
          </div>

          <div className="border border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <Upload className="text-slate-400 mb-2" size={24} />
            <span className="text-xs font-semibold text-slate-700 mb-2">Upload Bukti Transfer</span>
            <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 transition-colors">
              Pilih Berkas
              <input
                type="file"
                onChange={(e) => setDonasiFile(e.target.files[0])}
                className="hidden"
                accept="image/*"
              />
            </label>
            {donasiFile && (
              <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-1 rounded font-bold mt-3 truncate max-w-full">
                {donasiFile.name}
              </span>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-50">
            <button
              type="button"
              onClick={() => setDonasiOpen(false)}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={actionLoading || !donasiFile}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              {actionLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : null}
              Kirim Kontribusi
            </button>
          </div>
        </form>
      </Modal>

      {/* Admin Verify Donation Modal */}
      <Modal
        isOpen={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        title="Verifikasi Donasi Alumni"
      >
        {selectedDonation && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-xs text-slate-700">
              <div>Donatur: <strong>{selectedDonation.user?.username.replace(/_/g, ' ')}</strong></div>
              <div>Nominal Transfer: <strong>Rp {Number(selectedDonation.nominal).toLocaleString("id-ID")}</strong></div>
              <div>Tanggal Transfer: <strong>{selectedDonation.tanggal}</strong></div>
              <div>Catatan Donasi: <strong>{selectedDonation.catatan || "-"}</strong></div>
              <div className="mt-3 text-center">
                <a
                  href={`${API_URL}/${selectedDonation.bukti_transfer}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-semibold transition-colors"
                >
                  <FileText size={14} />
                  Lihat Gambar Bukti Transfer
                </a>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-50">
              <button
                onClick={() => handleVerifyDonation(selectedDonation.id, false)}
                disabled={actionLoading}
                className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                Tolak Donasi
              </button>
              <button
                onClick={() => handleVerifyDonation(selectedDonation.id, true)}
                disabled={actionLoading}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {actionLoading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : null}
                Setujui Lunas Kas
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Alumni Create/Edit Modal */}
      <Modal
        isOpen={alumniModalOpen}
        onClose={() => setAlumniModalOpen(false)}
        title={selectedAlumni ? "Edit Data Alumni" : "Tambah Data Alumni Baru"}
      >
        <form onSubmit={handleAlumniSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Lengkap *</label>
            <input
              type="text"
              required
              value={alumniFormData.nama_lengkap}
              onChange={(e) => setAlumniFormData({ ...alumniFormData, nama_lengkap: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Masukkan nama lengkap"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">NIS (Opsional)</label>
              <input
                type="text"
                value={alumniFormData.nis}
                onChange={(e) => setAlumniFormData({ ...alumniFormData, nis: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Nomor Induk Siswa"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
              <select
                value={alumniFormData.jenis_kelamin}
                onChange={(e) => setAlumniFormData({ ...alumniFormData, jenis_kelamin: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Tempat Lahir</label>
              <input
                type="text"
                value={alumniFormData.tempat_lahir}
                onChange={(e) => setAlumniFormData({ ...alumniFormData, tempat_lahir: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Kota Kelahiran"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Tanggal Lahir</label>
              <input
                type="date"
                value={alumniFormData.tanggal_lahir}
                onChange={(e) => setAlumniFormData({ ...alumniFormData, tanggal_lahir: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Tahun Lulus / Keluar</label>
            <select
              value={alumniFormData.tahun_ajaran_id}
              onChange={(e) => setAlumniFormData({ ...alumniFormData, tahun_ajaran_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Pilih Tahun Ajaran / Lulus</option>
              {tahunAjaranList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.tahun} ({t.semester})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Alamat Domisili</label>
            <textarea
              rows="3"
              value={alumniFormData.alamat}
              onChange={(e) => setAlumniFormData({ ...alumniFormData, alamat: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700"
              placeholder="Alamat lengkap alumni..."
            ></textarea>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAlumniModalOpen(false)}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {actionLoading && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              )}
              {selectedAlumni ? "Simpan Perubahan" : "Tambah Alumni"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Alumni Confirm Modal */}
      <ConfirmModal
        isOpen={alumniDeleteOpen}
        onClose={() => setAlumniDeleteOpen(false)}
        onConfirm={handleAlumniDeleteConfirm}
        title="Hapus Data Alumni"
        message="Apakah Anda yakin ingin menghapus data alumni ini dari direktori?"
        isLoading={actionLoading}
      />
    </div>
  );
};

export default AlumniAdmin;
