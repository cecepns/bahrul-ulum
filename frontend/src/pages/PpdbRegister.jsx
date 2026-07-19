import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import { School, User, Calendar, MapPin, Phone, Upload, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

const PpdbRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nama_lengkap: "",
    jk: "L",
    tempat_lahir: "",
    tanggal_lahir: "",
    alamat: "",
    nama_ayah: "",
    nama_ibu: "",
    hp_ortu: ""
  });
  const [files, setFiles] = useState({
    foto: null,
    kk_file: null,
    akta_file: null,
    ijazah_file: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleTextChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFiles({ ...files, [e.target.name]: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.nama_lengkap ||
      !formData.tempat_lahir ||
      !formData.tanggal_lahir ||
      !formData.alamat ||
      !formData.nama_ayah ||
      !formData.nama_ibu ||
      !formData.hp_ortu
    ) {
      toast.error("Silakan lengkapi seluruh formulir biodata santri");
      return;
    }

    setIsLoading(true);
    try {
      const payload = new FormData();
      // Append text inputs
      Object.keys(formData).forEach((key) => {
        payload.append(key, formData[key]);
      });
      // Append files
      Object.keys(files).forEach((key) => {
        if (files[key]) {
          payload.append(key, files[key]);
        }
      });

      const res = await request.post(API_ENDPOINTS.PPDB.REGISTER, payload, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.success) {
        setIsSuccess(true);
        toast.success(res.message);
      }
    } catch (err) {
      toast.error(err.message || "Gagal mengirimkan pendaftaran.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 relative overflow-hidden">
        <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-100 shadow-xl p-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-6">
            <CheckCircle size={36} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Pendaftaran Berhasil Dikirim!</h2>
          <p className="text-slate-500 text-sm max-w-md mb-8">
            Data calon santri sedang dalam proses peninjauan oleh Panitia PPDB Bahrul Ulum.
            Informasi status pendaftaran dan NIS santri dapat ditanyakan via WhatsApp Ortus yang terdaftar.
          </p>
          <div className="flex gap-4 w-full">
            <Link to="/login" className="flex-1 py-3 text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors text-sm shadow-md">
              Halaman Login
            </Link>
            <button onClick={() => setIsSuccess(false)} className="flex-1 py-3 text-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors text-sm">
              Daftar Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden z-10 relative">
        {/* Banner */}
        <div className="bg-emerald-600 px-8 py-10 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Pendaftaran Santri Baru</h2>
            <p className="text-emerald-100 text-sm mt-1">Pondok Pesantren Bahrul Ulum Jombang</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-750/30 bg-emerald-500/20 backdrop-blur-sm rounded-xl border border-emerald-400/20 text-sm font-semibold">
            <School size={18} />
            PPDB Online
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          {/* Section 1: Biodata Santri */}
          <div>
            <h3 className="text-base font-bold text-emerald-700 border-b border-slate-100 pb-2 mb-4">
              I. Data Pribadi Calon Santri
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  name="nama_lengkap"
                  value={formData.nama_lengkap}
                  onChange={handleTextChange}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                  placeholder="Masukkan nama lengkap calon santri"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
                <select
                  name="jk"
                  value={formData.jk}
                  onChange={handleTextChange}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-white text-slate-700"
                >
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tempat Lahir</label>
                  <input
                    type="text"
                    name="tempat_lahir"
                    value={formData.tempat_lahir}
                    onChange={handleTextChange}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Kota"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tanggal Lahir</label>
                  <input
                    type="date"
                    name="tanggal_lahir"
                    value={formData.tanggal_lahir}
                    onChange={handleTextChange}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Alamat Lengkap</label>
                <textarea
                  name="alamat"
                  value={formData.alamat}
                  onChange={handleTextChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                  placeholder="Nama jalan, RT/RW, Dusun, Desa, Kecamatan, Kota/Kabupaten"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Section 2: Data Orang Tua */}
          <div>
            <h3 className="text-base font-bold text-emerald-700 border-b border-slate-100 pb-2 mb-4">
              II. Data Orang Tua / Wali
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Ayah</label>
                <input
                  type="text"
                  name="nama_ayah"
                  value={formData.nama_ayah}
                  onChange={handleTextChange}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                  placeholder="Nama lengkap ayah kandung"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Ibu</label>
                <input
                  type="text"
                  name="nama_ibu"
                  value={formData.nama_ibu}
                  onChange={handleTextChange}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                  placeholder="Nama lengkap ibu kandung"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1">No. HP Orang Tua / WhatsApp</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Phone size={16} />
                  </span>
                  <input
                    type="tel"
                    name="hp_ortu"
                    value={formData.hp_ortu}
                    onChange={handleTextChange}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                    placeholder="Contoh: 0812xxxxxxxx"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Upload Berkas */}
          <div>
            <h3 className="text-base font-bold text-emerald-700 border-b border-slate-100 pb-2 mb-4">
              III. Upload Berkas Pendukung (Format: JPG/PNG, Maks. 2MB)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Foto */}
              <div className="border border-dashed border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-700">Pas Foto 3x4</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Latar merah/biru</p>
                </div>
                <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors">
                  <Upload size={14} />
                  Pilih File
                  <input type="file" name="foto" onChange={handleFileChange} className="hidden" accept="image/*" />
                </label>
                {files.foto && <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded font-bold truncate max-w-[100px]">{files.foto.name}</span>}
              </div>

              {/* KK */}
              <div className="border border-dashed border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-700">Kartu Keluarga (KK)</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Scan lembar KK jelas</p>
                </div>
                <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors">
                  <Upload size={14} />
                  Pilih File
                  <input type="file" name="kk_file" onChange={handleFileChange} className="hidden" accept="image/*" />
                </label>
                {files.kk_file && <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded font-bold truncate max-w-[100px]">{files.kk_file.name}</span>}
              </div>

              {/* Akta */}
              <div className="border border-dashed border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-700">Akta Kelahiran</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Scan akta lahir</p>
                </div>
                <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors">
                  <Upload size={14} />
                  Pilih File
                  <input type="file" name="akta_file" onChange={handleFileChange} className="hidden" accept="image/*" />
                </label>
                {files.akta_file && <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded font-bold truncate max-w-[100px]">{files.akta_file.name}</span>}
              </div>

              {/* Ijazah */}
              <div className="border border-dashed border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-700">Ijazah Terakhir</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Scan Ijazah / SKL</p>
                </div>
                <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors">
                  <Upload size={14} />
                  Pilih File
                  <input type="file" name="ijazah_file" onChange={handleFileChange} className="hidden" accept="image/*" />
                </label>
                {files.ijazah_file && <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded font-bold truncate max-w-[100px]">{files.ijazah_file.name}</span>}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
            <Link to="/login" className="text-sm font-bold text-slate-500 hover:underline">
              Batal & Kembali ke Login
            </Link>
            
            <button
              type="submit"
              disabled={isLoading}
              className="py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 text-sm disabled:opacity-50"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : null}
              Kirim Formulir Pendaftaran
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PpdbRegister;
