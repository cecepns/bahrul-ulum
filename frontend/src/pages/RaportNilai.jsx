import React, { useState, useEffect } from "react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import SelectApi from "../components/SelectApi";
import Modal from "../components/Modal";
import { SkeletonTable } from "../components/Skeleton";
import { BookOpen, User, Plus, Printer, ShieldAlert, Award } from "lucide-react";
import toast from "react-hot-toast";

const RaportNilai = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const isWali = user?.role === "walisantri";

  // Admin select states
  const [classOption, setClassOption] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Scores state
  const [scores, setScores] = useState([]);

  // Grade Input Modal
  const [inputOpen, setInputOpen] = useState(false);
  const [mapelOption, setMapelOption] = useState(null);
  const [formData, setFormData] = useState({
    mapel_id: "",
    nilai_angka: "",
    kkm: "70.00",
    catatan: ""
  });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (isWali) {
      fetchWaliSantriScores();
    }
  }, []);

  const fetchWaliSantriScores = async () => {
    setIsLoading(true);
    try {
      // Find associated santri first from profile / user object
      const resProfile = await request.get(API_ENDPOINTS.AUTH.PROFILE);
      const santriId = resProfile.data.santri?.id;
      if (santriId) {
        setSelectedStudent(resProfile.data.santri);
        const resScores = await request.get(API_ENDPOINTS.NILAI.SANTRI(santriId));
        if (resScores.success) {
          setScores(resScores.data);
        }
      } else {
        toast.error("Akun belum dikaitkan dengan data santri.");
      }
    } catch (err) {
      toast.error(err.message || "Gagal memuat raport");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClassChange = async (option) => {
    setClassOption(option);
    setSelectedStudent(null);
    setScores([]);
    if (!option) {
      setStudents([]);
      return;
    }

    setIsLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.KELAS.DETAIL(option.value));
      if (res.success) {
        setStudents(res.data.students);
      }
    } catch (err) {
      toast.error(err.message || "Gagal memuat daftar kelas");
    } finally {
      setIsLoading(false);
    }
  };

  const loadStudentScores = async (student) => {
    setSelectedStudent(student);
    setIsLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.NILAI.SANTRI(student.id));
      if (res.success) {
        setScores(res.data);
      }
    } catch (err) {
      toast.error(err.message || "Gagal memuat nilai raport");
    } finally {
      setIsLoading(false);
    }
  };

  const openInputModal = () => {
    setMapelOption(null);
    setFormData({
      mapel_id: "",
      nilai_angka: "",
      kkm: "70.00",
      catatan: ""
    });
    setInputOpen(true);
  };

  const handleInputSubmit = async (e) => {
    e.preventDefault();
    if (!formData.mapel_id || !formData.nilai_angka) {
      toast.error("Silakan pilih mata pelajaran dan masukkan nilai angka");
      return;
    }

    setActionLoading(true);
    try {
      const res = await request.post(API_ENDPOINTS.NILAI.INPUT, {
        santri_id: selectedStudent.id,
        ...formData
      });
      if (res.success) {
        toast.success(res.message);
        setInputOpen(false);
        // Refresh scores list
        loadStudentScores(selectedStudent);
      }
    } catch (err) {
      toast.error(err.message || "Gagal menginput nilai");
    } finally {
      setActionLoading(false);
    }
  };

  const printRaport = () => {
    if (!selectedStudent) return;
    const token = localStorage.getItem("token");
    const url = `${import.meta.env.VITE_API_URL || "https://api-ebum.bahrululum.or.id"}${API_ENDPOINTS.NILAI.PRINT_RAPORT(selectedStudent.id)}?token=${token}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Search Header for Admin */}
      {!isWali && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <label className="block text-sm font-semibold text-slate-700">Pilih Kelas Terlebih Dahulu</label>
          <div className="w-full sm:w-80">
            <SelectApi
              endpoint={API_ENDPOINTS.KELAS.SELECT}
              mapOptions={(item) => ({ value: item.id, label: item.nama_kelas })}
              value={classOption}
              placeholder="Ketik untuk mencari kelas..."
              onChange={handleClassChange}
            />
          </div>
        </div>
      )}

      {/* Main Body Split Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* Left Side: Students List (Admin only) */}
        {!isWali && (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 lg:col-span-1">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-50 pb-2 flex items-center gap-1.5">
              <User size={16} className="text-emerald-500" />
              Daftar Santri Kelas
            </h3>

            {students.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium py-4 text-center">
                {classOption ? "Tidak ada santri di kelas ini." : "Pilih kelas untuk menampilkan santri."}
              </p>
            ) : (
              <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
                {students.map((student) => {
                  const isCurrent = selectedStudent?.id === student.id;
                  return (
                    <button
                      key={student.id}
                      onClick={() => loadStudentScores(student)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all font-semibold text-sm flex flex-col gap-0.5 ${isCurrent
                        ? "bg-emerald-50 text-emerald-700 shadow-sm border-l-4 border-emerald-500 rounded-l-none"
                        : "text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                      <span>{student.nama_lengkap}</span>
                      <span className="text-[10px] text-slate-400 font-medium">NIS: {student.nis ?? "-"}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Right Side: Score Reports Card */}
        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 ${isWali ? "lg:col-span-3" : "lg:col-span-2"
          }`}>
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <BookOpen size={16} className="text-emerald-500" />
                Laporan Hasil Belajar (Raport)
              </h3>
              {selectedStudent && (
                <p className="text-xs text-slate-500 mt-1 font-semibold">
                  Santri: {selectedStudent.nama_lengkap} ({selectedStudent.nis ?? "-"})
                </p>
              )}
            </div>

            {selectedStudent && (
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={printRaport}
                  disabled={scores.length === 0}
                  className="flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  <Printer size={14} />
                  Cetak PDF
                </button>

                {!isWali && (
                  <button
                    onClick={openInputModal}
                    className="flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus size={14} />
                    Input Nilai
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Scores Table */}
          {isLoading ? (
            <SkeletonTable rows={4} cols={5} />
          ) : !selectedStudent ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              {isWali ? "Data profil santri tidak ditemukan." : "Silakan pilih salah satu nama santri untuk melihat nilai."}
            </div>
          ) : scores.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Belum ada nilai raport yang dimasukkan untuk tahun ajaran ganjil ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">No</th>
                    <th className="px-4 py-3">Mata Pelajaran</th>
                    <th className="px-4 py-3">KKM</th>
                    <th className="px-4 py-3">Nilai Angka</th>
                    <th className="px-4 py-3">Predikat</th>
                    <th className="px-4 py-3">Catatan / Deskripsi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                  {scores.map((score, idx) => (
                    <tr key={score.id} className="hover:bg-slate-50/20">
                      <td className="px-4 py-3">{idx + 1}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{score.mapel?.nama_mapel}</td>
                      <td className="px-4 py-3">{Number(score.kkm).toFixed(0)}</td>
                      <td className={`px-4 py-3 font-bold ${Number(score.nilai_angka) < Number(score.kkm) ? "text-red-500" : "text-emerald-700"
                        }`}>
                        {Number(score.nilai_angka).toFixed(0)}
                      </td>
                      <td className="px-4 py-3 font-bold">{score.nilai_huruf}</td>
                      <td className="px-4 py-3 text-slate-500 font-normal leading-relaxed">{score.catatan || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Input Nilai Modal (Admin Only) */}
      <Modal
        isOpen={inputOpen}
        onClose={() => setInputOpen(false)}
        title="Input Nilai Raport Santri"
      >
        <form onSubmit={handleInputSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Mata Pelajaran</label>
            <SelectApi
              endpoint={API_ENDPOINTS.MAPEL.SELECT}
              mapOptions={(item) => ({ value: item.id, label: item.nama_mapel })}
              value={mapelOption}
              placeholder="Cari mata pelajaran..."
              onChange={(option) => {
                setMapelOption(option);
                setFormData({ ...formData, mapel_id: option ? option.value : "" });
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Nilai Angka (0-100)</label>
              <input
                type="number"
                name="nilai_angka"
                value={formData.nilai_angka}
                onChange={(e) => setFormData({ ...formData, nilai_angka: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                placeholder="Misal: 85"
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Kriteria Kelulusan (KKM)</label>
              <input
                type="number"
                name="kkm"
                value={formData.kkm}
                onChange={(e) => setFormData({ ...formData, kkm: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
                placeholder="Misal: 70"
                min="0"
                max="100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Deskripsi Pencapaian / Catatan</label>
            <textarea
              name="catatan"
              value={formData.catatan}
              onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
              rows="3"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1"
              placeholder="Catatan perkembangan hafalan / materi pelajaran..."
            ></textarea>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-50">
            <button
              type="button"
              onClick={() => setInputOpen(false)}
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
              Simpan Nilai
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RaportNilai;
