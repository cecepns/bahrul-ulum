import React, { useState, useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Authentication check
  const token = localStorage.getItem("token");
  const userJson = localStorage.getItem("user");
  const user = userJson ? JSON.parse(userJson) : null;

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Get Page Title from path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith("/dashboard")) return "Dashboard";
    if (path.startsWith("/ppdb")) return "PPDB Online";
    if (path.startsWith("/santri")) return "Data Santri";
    if (path.startsWith("/kelas")) return "Manajemen Kelas";
    if (path.startsWith("/mapel")) return "Mata Pelajaran";
    if (path.startsWith("/pembayaran") || path.startsWith("/tagihan")) return "Keuangan & SPP";
    if (path.startsWith("/absensi")) return "Absensi Kehadiran";
    if (path.startsWith("/pelanggaran")) return "Catatan Poin Pelanggaran";
    if (path.startsWith("/perizinan")) return "Perizinan Santri";
    if (path.startsWith("/alumni")) return "Portal Alumni";
    if (path.startsWith("/pengumuman")) return "Pengumuman Resmi";
    if (path.startsWith("/settings")) return "Pengaturan Sistem";
    return "SIAKAD Bahrul Ulum";
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} role={user.role} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen lg:pl-72 transition-all duration-300 w-full max-w-full overflow-x-hidden">
        {/* Header */}
        <Header toggleSidebar={toggleSidebar} user={user} pageTitle={getPageTitle()} />

        {/* Content Outlet */}
        <main className="flex-1 p-6 md:p-8 animate-slide-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
