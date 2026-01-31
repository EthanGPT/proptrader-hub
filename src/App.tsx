import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { DataProvider } from "@/context/DataContext";
import Dashboard from "./pages/Dashboard";
import Payouts from "./pages/Payouts";
import Expenses from "./pages/Expenses";
import Accounts from "./pages/Accounts";
import PropFirms from "./pages/PropFirms";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <DataProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/payouts" element={<Payouts />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/prop-firms" element={<PropFirms />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </HashRouter>
      </TooltipProvider>
    </DataProvider>
  </QueryClientProvider>
);

export default App;
