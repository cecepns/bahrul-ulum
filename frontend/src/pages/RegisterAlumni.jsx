import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import { School, User, Lock, Mail, CreditCard } from "lucide-react";
import toast from "react-hot-toast";

const RegisterAlumni = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    nis_alumni: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState("/logo.png");
  const [namaPondok, setNamaPondok] = useState("Bahrul Ulum Jombang");

  useEffect(() => {
    const fetchPublicSettings = async () => {
      try {
        const res = await request.get(API_ENDPOINTS.SETTINGS.PUBLIC);
        if (res.success && res.data) {
          const API_URL = import.meta.env.VITE_API_URL || "https://api-siakad.kingcreativestudio.my.id";
          if (res.data.logo_pondok) {
            setLogoUrl(`${API_URL}/${res.data.logo_pondok}`);
          }
          if (res.data.nama_pondok) {
            setNamaPondok(res.data.nama_pondok);
          }
        }
      } catch (err) {
        // Fallback
      }
    };
    fetchPublicSettings();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.email || !formData.password || !formData.nis_alumni) {
      toast.error("Semua kolom pendaftaran wajib diisi.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await request.post(API_ENDPOINTS.AUTH.REGISTER_ALUMNI, formData);
      if (res.success) {
        toast.success(res.message);
        navigate("/login");
      }
    } catch (err) {
      toast.error(err.message || "Pendaftaran alumni gagal.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 relative overflow-hidden">
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-100 rounded-full blur-3xl opacity-30 translate-x-12 translate-y-12"></div>
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-xl p-8 z-10">
        <div className="flex flex-col items-center text-center mb-8">
          <img src={logoUrl} alt="Logo" className="w-20 h-20 object-contain mb-4" />
          <h2 className="text-2xl font-bold text-slate-800">Registrasi Alumni</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">{namaPondok}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <User size={16} />
              </span>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-750 placeholder:text-slate-400 text-sm"
                placeholder="Buat username"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Mail size={16} />
              </span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-750 placeholder:text-slate-400 text-sm"
                placeholder="Alamat email aktif"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock size={16} />
              </span>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-750 placeholder:text-slate-400 text-sm"
                placeholder="Minimal 6 karakter"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Nomor Induk Santri (NIS) Alumni</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <CreditCard size={16} />
              </span>
              <input
                type="text"
                name="nis_alumni"
                value={formData.nis_alumni}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-750 placeholder:text-slate-400 text-sm"
                placeholder="NIS Anda sewaktu mondok"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : null}
            Daftar Alumni
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-6 font-semibold">
          Sudah punya akun?{" "}
          <Link to="/login" className="text-emerald-600 hover:underline">
            Login di sini
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterAlumni;
