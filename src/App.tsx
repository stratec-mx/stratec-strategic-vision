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
import MapaDemo from "./pages/MapaDemo.tsx";
import Diagnostico from "./pages/Diagnostico.tsx";
import CoverageIndex from "./pages/coverage/CoverageIndex.tsx";
import CoverageLocality from "./pages/coverage/CoverageLocality.tsx";
import ServicesIndex from "./pages/services/ServicesIndex.tsx";
import ConsultoriaSeguridad from "./pages/services/ConsultoriaSeguridad.tsx";
import ProteccionCivil from "./pages/services/ProteccionCivil.tsx";
import Capacitacion from "./pages/services/Capacitacion.tsx";
import IntegracionTecnologica from "./pages/services/IntegracionTecnologica.tsx";
import ConsultoriaGobierno from "./pages/services/ConsultoriaGobierno.tsx";
import ProgramaInternoProteccionCivil from "./pages/services/ProgramaInternoProteccionCivil.tsx";
import CapacitacionBrigadasEmergencia from "./pages/services/CapacitacionBrigadasEmergencia.tsx";
import EstudioAnalisisRiesgo from "./pages/services/EstudioAnalisisRiesgo.tsx";
import VideovigilanciaCctv from "./pages/services/VideovigilanciaCctv.tsx";
import GpsMonitoreoVehicular from "./pages/services/GpsMonitoreoVehicular.tsx";
import AuditoriaSeguridadPage from "./pages/services/AuditoriaSeguridadPage.tsx";
import PlanContinuidadOperaciones from "./pages/services/PlanContinuidadOperaciones.tsx";
import DictamenSeguridad from "./pages/services/DictamenSeguridad.tsx";
import RevisionProgramaInterno from "./pages/services/RevisionProgramaInterno.tsx";
import AcompanamientoMensual from "./pages/services/AcompanamientoMensual.tsx";
import ProtocolosSeguridad from "./pages/services/ProtocolosSeguridad.tsx";
import { AppShell } from "./components/app/AppShell.tsx";
import { RequireAccess } from "./components/app/RequireAccess.tsx";
import Dashboard from "./pages/app/Dashboard.tsx";
import Leads from "./pages/app/Leads.tsx";
import Clients from "./pages/app/Clients.tsx";
import Pipeline from "./pages/app/Pipeline.tsx";
import Quotes from "./pages/app/Quotes.tsx";
import { DocumentsList, DocumentEditor } from "./pages/app/Documents.tsx";
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
        <Route path="/mapa-demo" element={<MapaDemo />} />
        <Route path="/diagnostico" element={<Diagnostico />} />

        {/* Coverage routes */}
        <Route path="/cobertura" element={<CoverageIndex />} />
        <Route path="/cobertura/:state" element={<CoverageLocality />} />
        <Route path="/cobertura/:state/:city" element={<CoverageLocality />} />

        {/* Services routes */}
        <Route path="/servicios" element={<ServicesIndex />} />
        <Route path="/servicios/consultoria-seguridad" element={<ConsultoriaSeguridad />} />
        <Route path="/servicios/proteccion-civil" element={<ProteccionCivil />} />
        <Route path="/servicios/capacitacion" element={<Capacitacion />} />
        <Route path="/servicios/integracion-tecnologica" element={<IntegracionTecnologica />} />
        <Route path="/servicios/consultoria-gobierno" element={<ConsultoriaGobierno />} />

        {/* Páginas específicas de servicios (SEO individual) */}
        <Route path="/servicios/programa-interno-proteccion-civil" element={<ProgramaInternoProteccionCivil />} />
        <Route path="/servicios/capacitacion-brigadas-emergencia" element={<CapacitacionBrigadasEmergencia />} />
        <Route path="/servicios/estudio-analisis-riesgo" element={<EstudioAnalisisRiesgo />} />
        <Route path="/servicios/videovigilancia-cctv" element={<VideovigilanciaCctv />} />
        <Route path="/servicios/gps-monitoreo-vehicular" element={<GpsMonitoreoVehicular />} />
        <Route path="/servicios/auditoria-seguridad" element={<AuditoriaSeguridadPage />} />
        <Route path="/servicios/plan-continuidad-operaciones" element={<PlanContinuidadOperaciones />} />
        <Route path="/servicios/dictamen-seguridad" element={<DictamenSeguridad />} />
        <Route path="/servicios/revision-programa-interno" element={<RevisionProgramaInterno />} />
        <Route path="/servicios/acompanamiento-mensual" element={<AcompanamientoMensual />} />
        <Route path="/servicios/protocolos-seguridad" element={<ProtocolosSeguridad />} />
        <Route path="/servicios/determinacion-seguridad" element={<Navigate to="/servicios/dictamen-seguridad" replace />} />

        {/* App routes */}
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="leads" element={<RequireAccess resource="leads"><Leads /></RequireAccess>} />
          <Route path="clients" element={<RequireAccess resource="clients"><Clients /></RequireAccess>} />
          <Route path="pipeline" element={<RequireAccess resource="pipeline"><Pipeline /></RequireAccess>} />
          <Route path="quotes" element={<RequireAccess resource="quotes"><Quotes /></RequireAccess>} />
          <Route path="documents" element={<RequireAccess resource="documents"><DocumentsList /></RequireAccess>} />
          <Route path="documents/:id" element={<RequireAccess resource="documents"><DocumentEditor /></RequireAccess>} />
          <Route path="agenda" element={<RequireAccess resource="agenda"><Agenda /></RequireAccess>} />
          <Route path="analytics" element={<RequireAccess resource="analytics"><Analytics /></RequireAccess>} />
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
