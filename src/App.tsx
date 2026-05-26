import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";
import { CookieBanner } from "@/components/CookieBanner";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Schedule from "./pages/Schedule.tsx";
import Privacidad from "./pages/Privacidad.tsx";
import Terminos from "./pages/Terminos.tsx";
import Confidentiality from "./pages/Confidentiality.tsx";
import Auth from "./pages/Auth.tsx";
import CoverageIndex from "./pages/coverage/CoverageIndex.tsx";
import CoverageLocality from "./pages/coverage/CoverageLocality.tsx";
import { AppShell } from "./components/app/AppShell.tsx";
import Dashboard from "./pages/app/Dashboard.tsx";
import Leads from "./pages/app/Leads.tsx";
import Clients from "./pages/app/Clients.tsx";
import Pipeline from "./pages/app/Pipeline.tsx";
import Quotes from "./pages/app/Quotes.tsx";
import Agenda from "./pages/app/Agenda.tsx";
import Analytics from "./pages/app/Analytics.tsx";
import { Messaging, Settings } from "./pages/app/Placeholders.tsx";

const queryClient = new QueryClient();

// Inner component to access useLocation hook within BrowserRouter
const AppRoutes = () => {
  useSEO();

  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/privacidad" element={<Privacidad />} />
        <Route path="/terminos" element={<Terminos />} />
        <Route path="/confidentiality" element={<Confidentiality />} />
        <Route path="/auth" element={<Auth />} />

        {/* Coverage routes */}
        <Route path="/cobertura" element={<CoverageIndex />} />
        <Route path="/cobertura/:state" element={<CoverageLocality />} />
        <Route path="/cobertura/:state/:city" element={<CoverageLocality />} />

        {/* App routes */}
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="leads" element={<Leads />} />
          <Route path="clients" element={<Clients />} />
          <Route path="pipeline" element={<Pipeline />} />
          <Route path="quotes" element={<Quotes />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="messaging" element={<Messaging />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="/admin/leads" element={<Navigate to="/app/leads" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <CookieBanner />
      <WhatsAppFloat />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
// Webhook test: Tue May 26 16:03:28     2026
// Fresh webhook test: Tue May 26 16:06:15     2026
