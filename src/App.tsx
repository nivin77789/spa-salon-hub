import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SelectionPage from "./pages/SelectionPage";
import BranchesPage from "./pages/BranchesPage";
import LoginPage from "./pages/LoginPage";
import AttendanceDashboard from "./pages/AttendanceDashboard";
import AttendancePage from "./pages/AttendancePage";
import CustomersDashboard from "./pages/CustomersDashboard";
import CustomersPage from "./pages/CustomersPage";
import StaffsPage from "./pages/StaffsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SelectionPage />} />
          <Route path="/branches/:type" element={<BranchesPage />} />
          <Route path="/login/:branchId" element={<LoginPage />} />
          <Route path="/dashboard/:branchId" element={<AttendanceDashboard />} />
          <Route path="/dashboard/:branchId/attendance" element={<AttendancePage />} />
          <Route path="/dashboard/:branchId/customers-dashboard" element={<CustomersDashboard />} />
          <Route path="/dashboard/:branchId/customers" element={<CustomersPage />} />
          <Route path="/dashboard/:branchId/staffs" element={<StaffsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
