import { ReactNode, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const { branchId } = useParams();
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
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out",
          sidebarOpen ? "w-64" : "w-0 lg:w-16"
        )}
      >
        <div className="h-full bg-sidebar-background border-r border-sidebar-border flex flex-col">
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

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = window.location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-sidebar-border">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-3 rounded-lg text-sidebar-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
            >
              <FaSignOutAlt className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="lg:hidden p-4 border-b border-border">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-muted"
          >
            <FaBars className="w-6 h-6" />
          </button>
        </div>
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
