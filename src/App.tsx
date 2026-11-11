import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";
import { CookieBanner } from "@/components/CookieBanner";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { ChatLauncher } from "@/components/chat/ChatLauncher";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Schedule from "./pages/Schedule.tsx";
import Privacidad from "./pages/Privacidad.tsx";
import Terminos from "./pages/Terminos.tsx";
import Confidentiality from "./pages/Confidentiality.tsx";
import Auth from "./pages/Auth.tsx";
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
import Nom035ViolenciaLaboral from "./pages/services/Nom035ViolenciaLaboral.tsx";
// Panel interno: se descarga solo al entrar a /app (el visitante del sitio no lo carga)
const AppShell = lazy(() => import("./components/app/AppShell.tsx").then((m) => ({ default: m.AppShell })));
const RequireAccess = lazy(() => import("./components/app/RequireAccess.tsx").then((m) => ({ default: m.RequireAccess })));
const Dashboard = lazy(() => import("./pages/app/Dashboard.tsx"));
const Leads = lazy(() => import("./pages/app/Leads.tsx"));
const Clients = lazy(() => import("./pages/app/Clients.tsx"));
const Pipeline = lazy(() => import("./pages/app/Pipeline.tsx"));
const Quotes = lazy(() => import("./pages/app/Quotes.tsx"));
const DocumentsList = lazy(() => import("./pages/app/Documents.tsx").then((m) => ({ default: m.DocumentsList })));
const DocumentEditor = lazy(() => import("./pages/app/Documents.tsx").then((m) => ({ default: m.DocumentEditor })));
const Agenda = lazy(() => import("./pages/app/Agenda.tsx"));
const Analytics = lazy(() => import("./pages/app/Analytics.tsx"));
const Messaging = lazy(() => import("./pages/app/Placeholders.tsx").then((m) => ({ default: m.Messaging })));
const Settings = lazy(() => import("./pages/app/Placeholders.tsx").then((m) => ({ default: m.Settings })));
const MapaDemo = lazy(() => import("./pages/MapaDemo.tsx"));

const CargandoPanel = () => (
  <div className="min-h-screen flex items-center justify-center bg-background text-sm text-muted-foreground">Cargando…</div>
);

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
        <Route path="/mapa-demo" element={<Suspense fallback={<CargandoPanel />}><MapaDemo /></Suspense>} />
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
        <Route path="/servicios/nom-035-violencia-laboral" element={<Nom035ViolenciaLaboral />} />
        <Route path="/servicios/determinacion-seguridad" element={<Navigate to="/servicios/dictamen-seguridad" replace />} />

        {/* App routes */}
        <Route path="/app" element={<Suspense fallback={<CargandoPanel />}><AppShell /></Suspense>}>
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
        <ChatLauncher />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
