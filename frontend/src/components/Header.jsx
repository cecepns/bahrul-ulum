import React from "react";
import { Menu, LogOut, User, School } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const Header = ({ toggleSidebar, user, pageTitle }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logout berhasil");
    navigate("/login");
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "superadmin":
        return "Super Admin";
      case "admin":
        return "Administrator";
      case "walisantri":
        return "Wali Santri";
      case "alumni":
        return "Alumni";
      default:
        return "User";
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-white/80 backdrop-blur-md border-b border-slate-100">
      {/* Left section: Burger + Page Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-1 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-50 lg:hidden"
        >
          <Menu size={20} />
        </button>
        
        <h2 className="hidden sm:block text-lg font-bold text-slate-800">
          {pageTitle}
        </h2>
      </div>

      {/* Right section: Profile & Logout */}
      <div className="flex items-center gap-4">
        {/* User Badge */}
        <div className="flex items-center gap-3 pr-3 border-r border-slate-100">
          <div className="flex flex-col text-right">
            <span className="text-sm font-semibold text-slate-800">
              {user?.username ? user.username.replace(/_/g, ' ') : "Admin"}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {getRoleLabel(user?.role)}
            </span>
          </div>
          
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
            <User size={16} />
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          title="Keluar"
          className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};

export default Header;
