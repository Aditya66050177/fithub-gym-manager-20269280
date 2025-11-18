import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import GymManagement from "./pages/owner/GymManagement";
import BrowseGyms from "./pages/user/BrowseGyms";
import GymDetails from "./pages/user/GymDetails";
import ApplyOwner from "./pages/user/ApplyOwner";
import SeedData from "./pages/admin/SeedData";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/seed" element={<SeedData />} />
          <Route path="/owner" element={<OwnerDashboard />} />
          <Route path="/owner/gym/:gymId" element={<GymManagement />} />
          <Route path="/user" element={<BrowseGyms />} />
          <Route path="/user/apply-owner" element={<ApplyOwner />} />
          <Route path="/gym/:gymId" element={<GymDetails />} />
          <Route path="/" element={<Index />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
