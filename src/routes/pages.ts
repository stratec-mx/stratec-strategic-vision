// Páginas públicas: cada una se descarga por separado, solo cuando se visita.
// La tabla de rutas (routes.tsx) es la que decide qué URL usa cada página.
import { lazyWithPreload } from "./lazyWithPreload";

export const Index = lazyWithPreload(() => import("../pages/Index.tsx"));
export const NotFound = lazyWithPreload(() => import("../pages/NotFound.tsx"));
export const Schedule = lazyWithPreload(() => import("../pages/Schedule.tsx"));
export const Privacidad = lazyWithPreload(() => import("../pages/Privacidad.tsx"));
export const Terminos = lazyWithPreload(() => import("../pages/Terminos.tsx"));
export const Confidentiality = lazyWithPreload(() => import("../pages/Confidentiality.tsx"));
export const Auth = lazyWithPreload(() => import("../pages/Auth.tsx"));
export const Diagnostico = lazyWithPreload(() => import("../pages/Diagnostico.tsx"));
export const CoverageIndex = lazyWithPreload(() => import("../pages/coverage/CoverageIndex.tsx"));
export const CoverageLocality = lazyWithPreload(() => import("../pages/coverage/CoverageLocality.tsx"));
export const ServicesIndex = lazyWithPreload(() => import("../pages/services/ServicesIndex.tsx"));
export const ConsultoriaSeguridad = lazyWithPreload(() => import("../pages/services/ConsultoriaSeguridad.tsx"));
export const ProteccionCivil = lazyWithPreload(() => import("../pages/services/ProteccionCivil.tsx"));
export const Capacitacion = lazyWithPreload(() => import("../pages/services/Capacitacion.tsx"));
export const IntegracionTecnologica = lazyWithPreload(() => import("../pages/services/IntegracionTecnologica.tsx"));
export const ConsultoriaGobierno = lazyWithPreload(() => import("../pages/services/ConsultoriaGobierno.tsx"));
export const ProgramaInternoProteccionCivil = lazyWithPreload(() => import("../pages/services/ProgramaInternoProteccionCivil.tsx"));
export const CapacitacionBrigadasEmergencia = lazyWithPreload(() => import("../pages/services/CapacitacionBrigadasEmergencia.tsx"));
export const EstudioAnalisisRiesgo = lazyWithPreload(() => import("../pages/services/EstudioAnalisisRiesgo.tsx"));
export const VideovigilanciaCctv = lazyWithPreload(() => import("../pages/services/VideovigilanciaCctv.tsx"));
export const GpsMonitoreoVehicular = lazyWithPreload(() => import("../pages/services/GpsMonitoreoVehicular.tsx"));
export const AuditoriaSeguridadPage = lazyWithPreload(() => import("../pages/services/AuditoriaSeguridadPage.tsx"));
export const PlanContinuidadOperaciones = lazyWithPreload(() => import("../pages/services/PlanContinuidadOperaciones.tsx"));
export const DictamenSeguridad = lazyWithPreload(() => import("../pages/services/DictamenSeguridad.tsx"));
export const RevisionProgramaInterno = lazyWithPreload(() => import("../pages/services/RevisionProgramaInterno.tsx"));
export const AcompanamientoMensual = lazyWithPreload(() => import("../pages/services/AcompanamientoMensual.tsx"));
export const ProtocolosSeguridad = lazyWithPreload(() => import("../pages/services/ProtocolosSeguridad.tsx"));
export const Nom035ViolenciaLaboral = lazyWithPreload(() => import("../pages/services/Nom035ViolenciaLaboral.tsx"));
