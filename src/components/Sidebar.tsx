import { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  FaChartLine,
  FaClipboardList,
  FaUsers,
  FaUserFriends,
  FaUserTie,
  FaBars,
  FaTimes,
  FaSignOutAlt
} from "react-icons/fa";
import { cn } from "@/lib/utils";

const Sidebar = () => {
  const navigate = useNavigate();
  const { branchId } = useParams();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { icon: FaChartLine, label: "Attendance Dashboard", path: `/dashboard/${branchId}` },
    { icon: FaClipboardList, label: "Attendance", path: `/dashboard/${branchId}/attendance` },
    { icon: FaUsers, label: "Customers Dashboard", path: `/dashboard/${branchId}/customers-dashboard` },
    { icon: FaUserFriends, label: "Customers", path: `/dashboard/${branchId}/customers` },
    { icon: FaUserTie, label: "Staffs", path: `/dashboard/${branchId}/staffs` },
  ];

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("branchId");
    navigate("/");
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out bg-sidebar-background border-r border-sidebar-border",
          sidebarOpen ? "w-64" : "w-0 lg:w-16"
        )}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
            {sidebarOpen && (
              <h2 className="text-xl font-bold text-sidebar-foreground">Dashboard</h2>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground"
            >
              {sidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent",
                    !sidebarOpen && "lg:justify-center"
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-sidebar-border">
            <button
              onClick={handleLogout}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg text-sidebar-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors",
                !sidebarOpen && "lg:justify-center"
              )}
            >
              <FaSignOutAlt className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Toggle Button */}
      <div className="lg:hidden fixed top-4 left-4 z-40">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-3 rounded-lg bg-card shadow-lg hover:bg-muted border border-border"
        >
          <FaBars className="w-5 h-5" />
        </button>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
