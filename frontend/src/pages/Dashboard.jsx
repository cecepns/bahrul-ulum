import React, { useState, useEffect } from "react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import { SkeletonDashboard } from "../components/Skeleton";
import {
  Users,
  UserPlus,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  FileSpreadsheet,
  AlertOctagon,
  Calendar,
  AlertCircle,
  School,
  ArrowRight,
  Sparkles
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.DASHBOARD);
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error("Gagal memuat dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  // Wali Santri Dashboard View
  if (user?.role === "walisantri") {
    const stats = data?.stats || {};
    const hasSantri = data?.has_santri;
    const santri = data?.santri;

    if (!hasSantri) {
      return (
        <div className="bg-white border border-slate-100 p-8 rounded-2xl text-center max-w-xl mx-auto mt-10 shadow-xl shadow-slate-100/50">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Akun Belum Ditautkan</h3>
          <p className="text-slate-500 text-sm mt-2 mb-6">
            Akun wali santri Anda belum dikaitkan dengan data santri aktif.
            Silakan logout dan lakukan pendaftaran akun Wali Santri dengan menyertakan NIS anak Anda.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-8 animate-slide-in">
        {/* Welcome card - Rich Gradient Design */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 p-8 rounded-3xl text-white shadow-xl shadow-emerald-900/10">
          {/* Abstract glowing backgrounds */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -translate-y-20 translate-x-20"></div>
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl translate-y-20"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-300 border border-white/5">
                <Sparkles size={12} className="animate-spin" />
                Portal Wali Santri
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Assalamualaikum, Bapak/Ibu {user.username.replace(/_/g, ' ')}
              </h2>
              <p className="text-emerald-100/80 text-sm max-w-xl">
                Berikut adalah laporan perkembangan terpadu untuk santri Anda: <strong className="text-white">{santri?.nama_lengkap}</strong> (NIS: {santri?.nis}) di Pondok Pesantren Bahrul Ulum.
              </p>
            </div>
            
            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <img src="/logo.png" alt="Bahrul Ulum" className="w-12 h-12 object-contain" />
              <div>
                <h4 className="font-bold text-sm">Bahrul Ulum</h4>
                <p className="text-[10px] text-emerald-300 font-semibold tracking-wider uppercase">Jombang, Jawa Timur</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid - Premium Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Kehadiran */}
          <div className="group bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Kehadiran Santri</p>
                <h3 className="text-3xl font-black text-slate-800 mt-1.5">{stats?.absensi?.hadir || 0} Hari</h3>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Calendar size={20} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-slate-100 text-center text-xs">
              <div className="bg-slate-50 p-2 rounded-lg">
                <p className="text-slate-400 font-semibold">Sakit</p>
                <p className="font-bold text-amber-500 mt-0.5">{stats?.absensi?.sakit || 0}</p>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg">
                <p className="text-slate-400 font-semibold">Izin</p>
                <p className="font-bold text-blue-500 mt-0.5">{stats?.absensi?.izin || 0}</p>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg">
                <p className="text-slate-400 font-semibold">Alpha</p>
                <p className="font-bold text-red-500 mt-0.5">{stats?.absensi?.alpha || 0}</p>
              </div>
            </div>
          </div>

          {/* Pelanggaran */}
          <div className="group bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Akumulasi Poin Sanksi</p>
                <h3 className="text-3xl font-black text-red-650 text-red-500 mt-1.5">{stats?.pelanggaran?.poin || 0} Poin</h3>
              </div>
              <div className="p-3 bg-red-50 text-red-500 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <AlertOctagon size={20} />
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg w-full">
                <AlertCircle size={14} className="text-red-500" />
                Tercatat {stats?.pelanggaran?.total || 0} kasus pelanggaran aktif.
              </span>
            </div>
          </div>

          {/* Tagihan */}
          <div className="group bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tunggakan Belum Bayar</p>
                <h3 className="text-3xl font-black text-amber-500 mt-1.5">{stats?.tagihan_belum_bayar || 0} Tagihan</h3>
              </div>
              <div className="p-3 bg-amber-50 text-amber-500 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <TrendingUp size={20} />
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <span className="inline-flex items-center justify-between text-[11px] font-semibold text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg w-full">
                <span>Konfirmasi bayar via upload bukti</span>
                <ArrowRight size={14} className="text-emerald-500" />
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Alumni Dashboard View
  if (user?.role === "alumni") {
    const stats = data?.stats || {};
    const alumni = data?.alumni;

    return (
      <div className="space-y-8 animate-slide-in">
        {/* Welcome card - Rich Gradient Design */}
        <div className="relative overflow-hidden bg-gradient-to-br from-teal-950 via-teal-900 to-slate-950 p-8 rounded-3xl text-white shadow-xl shadow-teal-900/10">
          <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl -translate-y-20 translate-x-20"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-teal-300 border border-white/5">
                <Sparkles size={12} className="animate-spin" />
                Portal Alumni
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Halo, Rekan Alumni {alumni?.nama_lengkap || user.username}!
              </h2>
              <p className="text-teal-100/80 text-sm max-w-xl">
                Jaga tali silaturahmi almamater dan dukung pembangunan sarana prasarana santri Bahrul Ulum melalui donasi/wakaf.
              </p>
            </div>
            
            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <img src="/logo.png" alt="Bahrul Ulum" className="w-12 h-12 object-contain" />
              <div>
                <h4 className="font-bold text-sm">Bahrul Ulum</h4>
                <p className="text-[10px] text-teal-300 font-semibold tracking-wider uppercase">Jombang, Jawa Timur</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-md bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-teal-50 text-teal-650 text-teal-600 rounded-xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Kontribusi Donasi Terverifikasi</p>
            <h3 className="text-3xl font-black text-slate-800 mt-1">
              Rp {stats?.total_donasi ? stats.total_donasi.toLocaleString("id-ID") : "0"}
            </h3>
          </div>
        </div>
      </div>
    );
  }

  // Admin and Superadmin Dashboard View
  const stats = data?.stats || {};
  const charts = data?.charts || {};

  return (
    <div className="space-y-8 animate-slide-in">
      
      {/* Top Banner - Sleek Dark Gradient Hero Panel */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 p-8 rounded-3xl text-white shadow-xl shadow-emerald-900/10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -translate-y-20 translate-x-20"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl translate-y-20"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-300 border border-white/5">
              <Sparkles size={12} className="animate-spin" />
              Sistem Informasi Akademik Terpadu
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Pondok Pesantren Bahrul Ulum Jombang
            </h2>
            <p className="text-emerald-100/80 text-sm max-w-xl">
              Panel administrasi untuk pengelolaan PPDB, biodata santri aktif, raport, perizinan, kehadiran, hingga rekapitulasi keuangan.
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <img src="/logo.png" alt="Bahrul Ulum" className="w-14 h-14 object-contain" />
            <div>
              <h4 className="font-extrabold text-sm tracking-wide">BAHRUL ULUM</h4>
              <p className="text-[10px] text-emerald-300 font-bold tracking-wider uppercase">Jombang, Jawa Timur</p>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Cards - Premium Glassmorphism styling with icon glow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Santri */}
        <div className="group bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Santri Aktif</span>
            <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-6">
            <h3 className="text-3xl font-black text-slate-800">{stats.total_santri || 0}</h3>
            <p className="text-xs text-slate-450 mt-1 font-semibold text-slate-400">
              {stats.total_putra || 0} Putra | {stats.total_putri || 0} Putri
            </p>
          </div>
        </div>

        {/* PPDB Pendaftar */}
        <div className="group bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pendaftar PPDB</span>
            <div className="p-3 bg-indigo-50 text-indigo-500 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <UserPlus size={18} />
            </div>
          </div>
          <div className="mt-6">
            <h3 className="text-3xl font-black text-slate-800">{stats.total_pendaftar || 0}</h3>
            <p className="text-xs text-slate-450 mt-1 font-semibold text-slate-400">Calon santri baru perlu verifikasi</p>
          </div>
        </div>

        {/* Uang Masuk */}
        <div className="group bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kas Masuk Bulan Ini</span>
            <div className="p-3 bg-emerald-50 text-emerald-650 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <ArrowDownLeft size={18} />
            </div>
          </div>
          <div className="mt-6">
            <h3 className="text-2xl font-black text-slate-800 truncate">
              Rp {stats.uang_masuk_bulan_ini ? stats.uang_masuk_bulan_ini.toLocaleString("id-ID") : "0"}
            </h3>
            <p className="text-xs text-slate-450 mt-1 font-semibold text-slate-400">Dari SPP & Pembayaran terverifikasi</p>
          </div>
        </div>

        {/* Belum Verifikasi */}
        <div className="group bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Menunggu Verifikasi</span>
            <div className="p-3 bg-amber-50 text-amber-500 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div className="mt-6">
            <h3 className="text-2xl font-black text-slate-800 truncate">
              Rp {stats.uang_belum_verifikasi ? stats.uang_belum_verifikasi.toLocaleString("id-ID") : "0"}
            </h3>
            <p className="text-xs text-slate-450 mt-1 font-semibold text-slate-400">{stats.tagihan_belum_bayar || 0} Santri belum lunas</p>
          </div>
        </div>
      </div>

      {/* Charts Section - Richer Grid styling */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* PPDB Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-bold text-slate-800 text-sm">Tren Pendaftaran Calon Santri (PPDB)</h4>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Re-realtime</span>
          </div>
          <div className="h-64 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.ppdb || []} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPpdb" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }} />
                <Tooltip contentStyle={{ border: 'none', borderRadius: '12px', backgroundColor: '#0f172a', color: '#fff', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPpdb)" name="Pendaftar" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Finance Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-bold text-slate-800 text-sm">Grafik Total Kas Masuk</h4>
            <span className="text-[10px] font-bold text-indigo-650 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Keuangan</span>
          </div>
          <div className="h-64 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.payment || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }} />
                <Tooltip formatter={(value) => `Rp ${value.toLocaleString("id-ID")}`} contentStyle={{ border: 'none', borderRadius: '12px', backgroundColor: '#0f172a', color: '#fff', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="amount" fill="#10b981" radius={[6, 6, 0, 0]} name="Kas Masuk" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
