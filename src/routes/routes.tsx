// Tabla única de rutas del sitio. De aquí salen las dos cosas que deben coincidir:
//   1. lo que pinta <Routes> en App.tsx, y
//   2. la página que main.tsx descarga antes de montar React (preloadRoute.ts).
// Para agregar o cambiar una URL se edita solo esta tabla.
import { Suspense } from "react";
import { Navigate, Route, createRoutesFromElements } from "react-router-dom";
import { CargandoPanel } from "./RouteFallbacks";
import {
  AcompanamientoMensual,
  AuditoriaSeguridadPage,
  Auth,
  Capacitacion,
  CapacitacionBrigadasEmergencia,
  Confidentiality,
  ConsultoriaGobierno,
  ConsultoriaSeguridad,
  CoverageIndex,
  CoverageLocality,
  Diagnostico,
  DictamenSeguridad,
  EstudioAnalisisRiesgo,
  GpsMonitoreoVehicular,
  Index,
  IntegracionTecnologica,
  Nom035ViolenciaLaboral,
  NotFound,
  PlanContinuidadOperaciones,
  Privacidad,
  ProgramaInternoProteccionCivil,
  ProteccionCivil,
  ProtocolosSeguridad,
  RevisionProgramaInterno,
  Schedule,
  ServicesIndex,
  Terminos,
  VideovigilanciaCctv,
} from "./pages";
import {
  Agenda,
  Analytics,
  AppShell,
  Clients,
  Dashboard,
  DocumentEditor,
  DocumentsList,
  Leads,
  MapaDemo,
  Messaging,
  Pipeline,
  Quotes,
  RequireAccess,
  Settings,
} from "./panelPages";

export const routeElements = (
  <>
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
  </>
);

/** La misma tabla en el formato que usa React Router para decidir qué ruta toca. */
export const routeObjects = createRoutesFromElements(routeElements);
