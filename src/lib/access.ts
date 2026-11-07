// Módulos del dashboard sujetos a niveles de acceso. Deben coincidir con el
// CHECK de public.access_rules.resource (supabase/setup/02-tablas-y-permisos.sql).
export const RESOURCES = [
  { id: "leads", label: "Leads", description: "Prospectos y su seguimiento" },
  { id: "clients", label: "Clientes", description: "Cartera de organizaciones" },
  { id: "contactos", label: "Datos de contacto", description: "Correo y teléfono de leads y clientes" },
  { id: "pipeline", label: "Pipeline", description: "Oportunidades y actividades" },
  { id: "agenda", label: "Agenda", description: "Citas y reuniones" },
  { id: "quotes", label: "Cotizaciones", description: "Precios y propuestas económicas" },
  { id: "documents", label: "Documentos", description: "Diagnósticos, análisis y dictámenes" },
  { id: "analytics", label: "Analítica", description: "Métricas comerciales" },
] as const;

export type Resource = (typeof RESOURCES)[number]["id"];
export type Action = "read" | "write";
export type Permissions = Partial<Record<Resource, { read: boolean; write: boolean }>>;

/** Roles configurables en la matriz (admin siempre tiene todo). */
export const CONFIGURABLE_ROLES = [
  { id: "analyst", label: "Analista" },
  { id: "operations", label: "Operaciones" },
  { id: "executive", label: "Ejecutivo" },
  { id: "viewer", label: "Solo lectura" },
] as const;
