import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Layout
import AdminLayout from "./layouts/AdminLayout";

// Pages
import Login from "./pages/Login";
import RegisterWali from "./pages/RegisterWali";
import RegisterAlumni from "./pages/RegisterAlumni";
import PpdbRegister from "./pages/PpdbRegister";
import Dashboard from "./pages/Dashboard";
import PpdbAdmin from "./pages/PpdbAdmin";
import SantriAdmin from "./pages/SantriAdmin";
import KelasAdmin from "./pages/KelasAdmin";
import MapelAdmin from "./pages/MapelAdmin";
import RaportNilai from "./pages/RaportNilai";
import TagihanAdmin from "./pages/TagihanAdmin";
import AbsensiAdmin from "./pages/AbsensiAdmin";
import PelanggaranAdmin from "./pages/PelanggaranAdmin";
import PerizinanAdmin from "./pages/PerizinanAdmin";
import AlumniAdmin from "./pages/AlumniAdmin";
import SettingsAdmin from "./pages/SettingsAdmin";
import WalisantriAdmin from "./pages/WalisantriAdmin";

function App() {
  return (
    <Router>
      {/* Toast notifications */}
      <Toaster position="top-right" toastOptions={{ duration: 4000, style: { whiteSpace: "pre-line" } }} />

      <Routes>
        {/* Guest Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register-wali" element={<RegisterWali />} />
        <Route path="/register-alumni" element={<RegisterAlumni />} />
        <Route path="/ppdb" element={<PpdbRegister />} />

        {/* Authenticated Dashboard Routes */}
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* PPDB Admin */}
          <Route path="/ppdb/list" element={<PpdbAdmin />} />
          <Route path="/ppdb/admin" element={<PpdbAdmin />} />
          <Route path="/ppdb-admin" element={<PpdbAdmin />} />
          
          {/* Santri */}
          <Route path="/santri" element={<SantriAdmin />} />
          <Route path="/santri/biodata" element={<Dashboard />} /> {/* Wali/alumni profile fallback */}
          
          {/* Kelas */}
          <Route path="/kelas" element={<KelasAdmin />} />
          
          {/* Mapel & Raport */}
          <Route path="/mapel" element={<MapelAdmin />} />
          <Route path="/raport/nilai" element={<RaportNilai />} />
          
          {/* Tagihan / SPP */}
          <Route path="/pembayaran" element={<TagihanAdmin />} />
          <Route path="/tagihan/bayar" element={<TagihanAdmin />} />
          
          {/* Absensi */}
          <Route path="/absensi" element={<AbsensiAdmin />} />
          <Route path="/absensi/riwayat" element={<AbsensiAdmin />} />
          
          {/* Pelanggaran */}
          <Route path="/pelanggaran" element={<PelanggaranAdmin />} />
          <Route path="/pelanggaran/riwayat" element={<PelanggaranAdmin />} />
          
          {/* Perizinan */}
          <Route path="/perizinan" element={<PerizinanAdmin />} />
          <Route path="/perizinan/pengajuan" element={<PerizinanAdmin />} />
          
          {/* Alumni */}
          <Route path="/alumni" element={<AlumniAdmin />} />
          <Route path="/alumni/donasi" element={<AlumniAdmin />} />

          {/* Pengumuman and Settings */}
          <Route path="/pengumuman" element={<SettingsAdmin />} />
          <Route path="/settings" element={<SettingsAdmin />} />

          {/* Wali Santri */}
          <Route path="/walisantri" element={<WalisantriAdmin />} />
        </Route>

        {/* Fallbacks */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
