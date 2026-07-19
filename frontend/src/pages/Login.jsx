import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import { School, ShieldAlert, Lock, User, Eye, EyeOff, Volume2 } from "lucide-react";
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

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState("/logo.png");
  const [namaPondok, setNamaPondok] = useState("Bahrul Ulum Jombang");
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const fetchPublicSettings = async () => {
      try {
        const res = await request.get(API_ENDPOINTS.SETTINGS.PUBLIC);
        if (res.success && res.data) {
          const API_URL = import.meta.env.VITE_API_URL || "https://api-siakad.kingcreativestudio.my.id";
          if (res.data.logo_pondop || res.data.logo_pondok) {
            setLogoUrl(`${API_URL}/${res.data.logo_pondok || res.data.logo_pondop}`);
          }
          if (res.data.nama_pondok) {
            setNamaPondok(res.data.nama_pondok);
          }
        }
      } catch (err) {
        // Fallback
      }
    };

    const fetchActiveAnnouncements = async () => {
      try {
        const res = await request.get(API_ENDPOINTS.PENGUMUMAN.ACTIVE);
        if (res.success) {
          setAnnouncements(res.data);
        }
      } catch (err) {
        // Fallback
      }
    };

    fetchPublicSettings();
    fetchActiveAnnouncements();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      toast.error("Silakan isi semua bidang");
      return;
    }

    setIsLoading(true);
    try {
      const res = await request.post(API_ENDPOINTS.AUTH.LOGIN, formData);
      if (res.success) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        toast.success(res.message);
        navigate("/dashboard");
      }
    } catch (err) {
      toast.error(err.message || "Login gagal, cek kembali koneksi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-100 rounded-full blur-3xl opacity-30 -translate-x-12 -translate-y-12"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-200 rounded-full blur-3xl opacity-20 translate-x-20 translate-y-20"></div>

      <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-8 items-stretch z-10 justify-center">
        {/* Left Side: Login Card */}
        <div className="w-full lg:w-[450px] bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-100/50 p-8 flex flex-col justify-between">
          <div>
            {/* Logo / Header */}
            <div className="flex flex-col items-center text-center mb-8">
              <img src={logoUrl} alt="Logo" className="w-20 h-20 object-contain mb-4" />
              <h2 className="text-2xl font-bold text-slate-800">SIAKAD Pondok</h2>
              <p className="text-sm text-slate-500 mt-1 font-medium">{namaPondok}</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Username atau Email</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <User size={18} />
                  </span>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-750 placeholder:text-slate-400"
                    placeholder="Masukkan username atau email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Lock size={18} />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-750 placeholder:text-slate-400"
                    placeholder="Masukkan password Anda"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Action button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : null}
                Masuk ke Aplikasi
              </button>
            </form>
          </div>

          {/* Registry links */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-3 text-center text-xs font-semibold text-slate-600">
            <p>
              Belum punya akun? Registrasi khusus:
            </p>
            <div className="flex justify-center gap-4 text-emerald-600 hover:text-emerald-700 font-bold">
              <Link to="/register-wali" className="hover:underline">Wali Santri</Link>
              <span className="text-slate-200">|</span>
              <Link to="/register-alumni" className="hover:underline">Alumni</Link>
              <span className="text-slate-200">|</span>
              <Link to="/ppdb" className="hover:underline">PPDB Baru</Link>
            </div>
          </div>
        </div>

        {/* Right Side: Announcement Board */}
        {announcements && announcements.length > 0 && (
          <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-100/50 p-8 flex flex-col min-w-[320px] max-w-[550px]">
            <div className="flex items-center gap-2 text-emerald-700 mb-6 border-b border-slate-100 pb-4">
              <span className="p-2.5 bg-emerald-50 rounded-xl">
                <Volume2 size={22} className="text-emerald-600 animate-bounce" />
              </span>
              <div>
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800">Papan Pengumuman Resmi</h3>
                <p className="text-[11px] text-slate-400 font-medium">Informasi & Maklumat Pondok Pesantren</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 max-h-[420px] pr-2 scrollbar-thin">
              {announcements.map((ann) => (
                <div key={ann.id} className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl hover:border-emerald-100 transition-colors">
                  <h4 className="font-bold text-slate-800 text-sm mb-1.5">{ann.judul}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{ann.konten}</p>
                  <span className="text-[10px] text-slate-400 font-semibold mt-3 block">
                    Diposting: {formatDate(ann.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
