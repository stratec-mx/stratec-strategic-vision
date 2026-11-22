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
  { id: "consultant", label: "Consultor" },
  { id: "analyst", label: "Analista" },
  { id: "operations", label: "Operaciones" },
  { id: "advisor", label: "Asesor" },
  { id: "executive", label: "Ejecutivo" },
  { id: "viewer", label: "Solo lectura" },
] as const;

/** Script que agrega cada rol nuevo a la base (para el aviso de error 22P02). */
const ROLE_SCRIPT: Record<string, string> = {
  advisor: "supabase/setup/propuestas/08-rol-asesor.sql",
  consultant: "supabase/setup/propuestas/09-consultor-y-facultades.sql (paso 1)",
};

/** Mensaje cuando la base todavía no tiene el rol elegido (error 22P02). */
export const missingRoleMessage = (role: string) =>
  `Ese rol todavía no existe en la base de datos: falta ejecutar ${ROLE_SCRIPT[role] ?? "el script que lo agrega"}.`;
