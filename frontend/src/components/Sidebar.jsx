import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import {
  LayoutDashboard,
  UserCheck,
  Users,
  BookOpen,
  CreditCard,
  History,
  CalendarDays,
  ShieldAlert,
  FileCheck,
  GraduationCap,
  Settings,
  X,
  Bell,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FolderOpen
} from "lucide-react";

const Sidebar = ({ isOpen, toggleSidebar, role }) => {
  const location = useLocation();
  const [logoUrl, setLogoUrl] = useState("/logo.png");
  const [namaPondok, setNamaPondok] = useState("Bahrul Ulum");

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
            const words = res.data.nama_pondok.split(" ");
            const shortName = words.slice(-2).join(" ");
            setNamaPondok(shortName);
          }
        }
      } catch (err) {
        // Fallback
      }
    };
    fetchPublicSettings();
  }, []);

  // Expanded groups state
  const [expandedGroups, setExpandedGroups] = useState({
    kesiswaan: true,
    kurikulum: true,
    administrasi: true,
    alumniGroup: true,
    sistem: true,
    akademikWali: true,
    keuanganWali: true,
    tataTertibWali: true,
    portalAlumniGroup: true
  });

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // Define Groups Data based on roles
  const getGroups = () => {
    if (role === "superadmin" || role === "admin") {
      return [
        {
          id: "dashboard",
          type: "single",
          label: "Dashboard",
          path: "/dashboard",
          icon: LayoutDashboard
        },
        {
          id: "kesiswaan",
          type: "group",
          label: "Kesiswaan & PPDB",
          icon: FolderOpen,
          items: [
            { path: "/ppdb/list", label: "PPDB Online", icon: UserCheck },
            { path: "/santri", label: "Data Santri", icon: Users },
            { path: "/kelas", label: "Manajemen Kelas", icon: History }
          ]
        },
        {
          id: "kurikulum",
          type: "group",
          label: "Kurikulum & Nilai",
          icon: BookOpen,
          items: [
            { path: "/mapel", label: "Mata Pelajaran", icon: BookOpen },
            { path: "/raport/nilai", label: "Raport Nilai", icon: ClipboardList }
          ]
        },
        {
          id: "administrasi",
          type: "group",
          label: "Administrasi & Keuangan",
          icon: CreditCard,
          items: [
            { path: "/pembayaran", label: "Keuangan & SPP", icon: CreditCard },
            { path: "/absensi", label: "Absensi Santri", icon: CalendarDays },
            { path: "/pelanggaran", label: "Pelanggaran & Poin", icon: ShieldAlert },
            { path: "/perizinan", label: "Perizinan Keluar", icon: FileCheck }
          ]
        },
        {
          id: "alumniGroup",
          type: "group",
          label: "Sosial Alumni",
          icon: GraduationCap,
          items: [
            { path: "/alumni", label: "Portal Alumni", icon: GraduationCap }
          ]
        },
        {
          id: "sistem",
          type: "group",
          label: "Pengaturan & Info",
          icon: Settings,
          items: [
            { path: "/pengumuman", label: "Pengumuman", icon: Bell },
            { path: "/walisantri", label: "Manajemen Wali", icon: Users },
            { path: "/settings", label: "Pengaturan Sistem", icon: Settings }
          ]
        }
      ];
    }

    if (role === "walisantri") {
      return [
        {
          id: "dashboard",
          type: "single",
          label: "Dashboard",
          path: "/dashboard",
          icon: LayoutDashboard
        },
        {
          id: "akademikWali",
          type: "group",
          label: "Akademik & Raport",
          icon: BookOpen,
          items: [
            { path: "/santri/biodata", label: "Biodata Santri", icon: Users },
            { path: "/raport/nilai", label: "Raport Nilai", icon: ClipboardList }
          ]
        },
        {
          id: "keuanganWali",
          type: "group",
          label: "Keuangan & Absen",
          icon: CreditCard,
          items: [
            { path: "/tagihan/bayar", label: "Pembayaran & SPP", icon: CreditCard },
            { path: "/absensi/riwayat", label: "Kehadiran / Absen", icon: CalendarDays }
          ]
        },
        {
          id: "tataTertibWali",
          type: "group",
          label: "Ketertiban & Izin",
          icon: ShieldAlert,
          items: [
            { path: "/pelanggaran/riwayat", label: "Catatan Poin", icon: ShieldAlert },
            { path: "/perizinan/pengajuan", label: "Izin Keluar", icon: FileCheck }
          ]
        }
      ];
    }

    if (role === "alumni") {
      return [
        {
          id: "dashboard",
          type: "single",
          label: "Dashboard",
          path: "/dashboard",
          icon: LayoutDashboard
        },
        {
          id: "portalAlumniGroup",
          type: "group",
          label: "Portal Alumni",
          icon: GraduationCap,
          items: [
            { path: "/santri/biodata", label: "Profil Alumni", icon: Users },
            { path: "/alumni/donasi", label: "Donasi & Wakaf", icon: GraduationCap }
          ]
        }
      ];
    }

    return [
      {
        id: "dashboard",
        type: "single",
        label: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard
      }
    ];
  };

  const groups = getGroups();

  // Helper to check active state
  const isRouteActive = (path) => location.pathname === path;
  const isGroupActive = (group) => {
    if (group.type === "single") return isRouteActive(group.path);
    return group.items.some((item) => isRouteActive(item.path));
  };

  // Expand group that has active route on mount/route change
  useEffect(() => {
    const nextExpanded = { ...expandedGroups };
    groups.forEach((g) => {
      if (g.type === "group" && isGroupActive(g)) {
        nextExpanded[g.id] = true;
      }
    });
    setExpandedGroups(nextExpanded);
  }, [location.pathname]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
        ></div>
      )}

      {/* Sidebar Container - Premium Deep Dark Slate Background */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col w-72 bg-[#0f172a] border-r border-slate-800 transition-transform duration-300 lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain ring-4 ring-emerald-500/10 p-0.5 rounded-full" />
            <div>
              <h1 className="font-black text-white text-sm leading-tight tracking-wider">E-BUM</h1>
              <p className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase mt-0.5">{namaPondok || 'Bahrul Ulum Muliasari'}</p>
            </div>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={toggleSidebar}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 lg:hidden transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 px-3 py-6 overflow-y-auto space-y-4">
          {groups.map((group) => {
            if (group.type === "single") {
              const active = isRouteActive(group.path);
              const Icon = group.icon;
              return (
                <Link
                  key={group.id}
                  to={group.path}
                  onClick={() => {
                    if (window.innerWidth < 1024) toggleSidebar();
                  }}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${active
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/10 font-bold"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/40"
                    }`}
                >
                  <Icon size={16} className={active ? "text-white" : "text-slate-400"} />
                  {group.label}
                </Link>
              );
            }

            // Collapsible Group
            const isExpanded = expandedGroups[group.id];
            const groupActive = isGroupActive(group);
            const GroupIcon = group.icon;

            return (
              <div key={group.id} className="space-y-1">
                {/* Accordion Header */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all ${groupActive
                      ? "text-emerald-450 text-emerald-400"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/30"
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <GroupIcon size={15} className={groupActive ? "text-emerald-400" : "text-slate-500"} />
                    <span className="text-[11px] font-bold uppercase tracking-wider">{group.label}</span>
                  </div>
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                {/* Sub Menu Items */}
                {isExpanded && (
                  <div className="pl-4 space-y-1 border-l border-slate-800/50 ml-6 mt-1 animate-fade-in">
                    {group.items.map((item) => {
                      const active = isRouteActive(item.path);
                      const SubIcon = item.icon;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => {
                            if (window.innerWidth < 1024) toggleSidebar();
                          }}
                          className={`flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg transition-all ${active
                              ? "bg-slate-800 text-white font-bold border-l-2 border-emerald-500"
                              : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/20"
                            }`}
                        >
                          <SubIcon size={12} className={active ? "text-emerald-450 text-emerald-450 text-emerald-400" : "text-slate-500"} />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800/60 text-center">
          <p className="text-[10px] text-slate-550 font-bold uppercase tracking-widest text-slate-500">E-BUM v1.0.0</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
