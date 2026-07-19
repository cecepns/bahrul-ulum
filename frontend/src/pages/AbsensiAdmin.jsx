import React, { useState, useEffect } from "react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import SelectApi from "../components/SelectApi";
import { SkeletonTable } from "../components/Skeleton";
import { Calendar, Users, Save, ListTodo, ClipboardCheck } from "lucide-react";
import toast from "react-hot-toast";

const AbsensiAdmin = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const isWali = user?.role === "walisantri";

  // Admin states
  const [classOption, setClassOption] = useState(null);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceList, setAttendanceList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Wali Santri states
  const [waliData, setWaliData] = useState(null);

  useEffect(() => {
    if (isWali) {
      fetchWaliAttendance();
    }
  }, []);

  const fetchWaliAttendance = async () => {
    setIsLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.ABSENSI.WALI);
      if (res.success) {
        setWaliData(res.data);
      }
    } catch (err) {
      toast.error(err.message || "Gagal memuat rekap absensi.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClassAttendance = async () => {
    if (!classOption) {
      toast.error("Silakan pilih kelas terlebih dahulu");
      return;
    }
    setIsLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.ABSENSI.CLASS, {
        kelas_id: classOption.value,
        tanggal: tanggal
      });
      if (res.success) {
        setAttendanceList(res.data);
      }
    } catch (err) {
      toast.error(err.message || "Gagal memuat absensi kelas.");
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger load when date changes if class is already selected
  useEffect(() => {
    if (classOption) {
      fetchClassAttendance();
    }
  }, [tanggal]);

  const handleStatusChange = (idx, status) => {
    const updated = [...attendanceList];
    updated[idx].status = status;
    setAttendanceList(updated);
  };

  const handleKeteranganChange = (idx, value) => {
    const updated = [...attendanceList];
    updated[idx].keterangan = value;
    setAttendanceList(updated);
  };

  const handleSaveAttendance = async () => {
    if (attendanceList.length === 0) return;
    setActionLoading(true);
    try {
      const formatted = attendanceList.map((item) => ({
        santri_id: item.santri_id,
        status: item.status,
        keterangan: item.keterangan
      }));

      const res = await request.post(API_ENDPOINTS.ABSENSI.BULK, {
        tanggal: tanggal,
        attendances: formatted
      });

      if (res.success) {
        toast.success(res.message);
        fetchClassAttendance();
      }
    } catch (err) {
      toast.error(err.message || "Gagal menyimpan absensi.");
    } finally {
      setActionLoading(false);
    }
  };

  if (isWali) {
    const rekap = waliData?.rekap || { hadir: 0, sakit: 0, izin: 0, alpha: 0 };
    const history = waliData?.history || [];

    return (
      <div className="space-y-6">
        {/* Rekap Cards */}
        {isLoading ? (
          <div className="grid grid-cols-4 gap-4 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-slate-100 rounded-xl"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-center">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Hadir</span>
              <span className="text-2xl font-bold text-emerald-600 block mt-1">{rekap.hadir} Hari</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-center">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Sakit</span>
              <span className="text-2xl font-bold text-amber-500 block mt-1">{rekap.sakit} Hari</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-center">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Izin</span>
              <span className="text-2xl font-bold text-blue-500 block mt-1">{rekap.izin} Hari</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-center">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Alpha</span>
              <span className="text-2xl font-bold text-red-500 block mt-1">{rekap.alpha} Hari</span>
            </div>
          </div>
        )}

        {/* History Table */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 pb-2 border-b border-slate-50">
            <Calendar size={18} className="text-emerald-500" />
            Riwayat Kehadiran Harian Santri
          </h3>

          {isLoading ? (
            <SkeletonTable rows={4} cols={3} />
          ) : history.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-4">Belum ada catatan kehadiran.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">No</th>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                  {history.map((att, idx) => (
                    <tr key={att.id} className="hover:bg-slate-50/20">
                      <td className="px-4 py-3">{idx + 1}</td>
                      <td className="px-4 py-3 font-semibold">{att.tanggal}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                          att.status === "hadir"
                            ? "bg-emerald-50 text-emerald-700"
                            : att.status === "sakit"
                            ? "bg-amber-50 text-amber-700"
                            : att.status === "izin"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-red-50 text-red-700"
                        }`}>
                          {att.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-normal">{att.keterangan || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Admin / Operator View
  return (
    <div className="space-y-6">
      {/* Selection Control Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Pilih Kelas</label>
          <SelectApi
            endpoint={API_ENDPOINTS.KELAS.SELECT}
            mapOptions={(item) => ({ value: item.id, label: item.nama_kelas })}
            value={classOption}
            placeholder="Cari kelas..."
            onChange={(option) => setClassOption(option)}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Pilih Tanggal</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Calendar size={16} />
            </span>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm font-medium text-slate-700"
            />
          </div>
        </div>

        <button
          onClick={fetchClassAttendance}
          disabled={!classOption || isLoading}
          className="py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1"
        >
          <ClipboardCheck size={16} />
          Muat Absensi
        </button>
      </div>

      {/* Bulk Attendance Form */}
      {isLoading ? (
        <SkeletonTable rows={5} cols={4} />
      ) : attendanceList.length === 0 ? (
        <div className="bg-white border border-slate-100 p-12 rounded-2xl text-center">
          <p className="text-slate-400 text-sm font-medium">Silakan pilih kelas dan tanggal untuk memuat data absensi.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-slide-in space-y-6 p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-50">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <ListTodo size={18} className="text-emerald-500" />
              Presensi Kelas: {classOption?.label} ({tanggal})
            </h3>
            <button
              onClick={handleSaveAttendance}
              disabled={actionLoading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              {actionLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <Save size={14} />
              )}
              Simpan Absensi
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3 w-16">No</th>
                  <th className="px-6 py-3">Nama Lengkap</th>
                  <th className="px-6 py-3 w-72">Status Kehadiran</th>
                  <th className="px-6 py-3">Catatan / Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700 font-medium">
                {attendanceList.map((item, idx) => (
                  <tr key={item.santri_id} className="hover:bg-slate-50/20">
                    <td className="px-6 py-4">{idx + 1}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      <div>{item.nama_lengkap}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">NIS: {item.nis ?? "-"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 bg-slate-50 p-1 rounded-xl w-max border border-slate-100">
                        {["hadir", "sakit", "izin", "alpha"].map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleStatusChange(idx, st)}
                            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                              item.status === st
                                ? st === "hadir"
                                  ? "bg-emerald-500 text-white shadow-sm"
                                  : st === "sakit"
                                  ? "bg-amber-500 text-white shadow-sm"
                                  : st === "izin"
                                  ? "bg-blue-500 text-white shadow-sm"
                                  : "bg-red-500 text-white shadow-sm"
                                : "text-slate-450 text-slate-400 hover:text-slate-650"
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={item.keterangan || ""}
                        onChange={(e) => handleKeteranganChange(idx, e.target.value)}
                        placeholder="Misal: Surat dokter (jika sakit)..."
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs font-semibold text-slate-700"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AbsensiAdmin;
