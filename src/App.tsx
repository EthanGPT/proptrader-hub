import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { DataProvider } from "@/context/DataContext";
import Dashboard from "./pages/Dashboard";
import Financials from "./pages/Financials";
import Accounts from "./pages/Accounts";
import PropFirms from "./pages/PropFirms";
import Reports from "./pages/Reports";
import Calendar from "./pages/Calendar";
import EconomicCalendar from "./pages/EconomicCalendar";
import Trades from "./pages/Trades";
import Setups from "./pages/Setups";
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
              <Route path="/financials" element={<Financials />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/prop-firms" element={<PropFirms />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/economic-calendar" element={<EconomicCalendar />} />
              <Route path="/trades" element={<Trades />} />
              <Route path="/setups" element={<Setups />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </HashRouter>
      </TooltipProvider>
    </DataProvider>
  </QueryClientProvider>
);

export default App;
