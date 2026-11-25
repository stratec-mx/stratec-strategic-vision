// Módulos del menú lateral, en el orden del diseño aprobado.
import type { Resource } from "@/lib/access";

export type ModuloNav = {
  to: string;
  label: string;
  /** Trazo del ícono (24×24, sin relleno), igual que en el diseño. */
  d: string;
  end?: boolean;
  /** Módulo de access_rules: si el usuario no lo puede ver, no aparece. */
  resource?: Resource;
  /** Contador junto al nombre. */
  contador?: "leadsNuevos" | "cotizacionesSinRespuesta";
  /** Módulos de M-DESR cuyas tablas aún están en diseño: abren "En preparación". */
  enPreparacion?: string;
};

export const MODULOS: ModuloNav[] = [
  { to: "/app", label: "Panel general", end: true, d: "M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z" },
  { to: "/app/clients", label: "Clientes", resource: "clients", d: "M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M8 7h4M8 11h4M8 15h4M2 21h20" },
  { to: "/app/leads", label: "Prospectos", resource: "leads", contador: "leadsNuevos", d: "M15 19a6 6 0 0 0-12 0M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M19 8v6M22 11h-6" },
  {
    to: "/app/proyectos", label: "Proyectos", d: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
    enPreparacion: "Dará seguimiento a cada servicio contratado: etapa, responsable, avance y fecha de entrega.",
  },
  {
    to: "/app/inmuebles", label: "Inmuebles y sedes", d: "M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5",
  },
  {
    to: "/app/inspecciones", label: "Inspecciones y diagnósticos", d: "M9 3h6v3H9zM9 5H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-3M9 14l2 2 4-4",
    enPreparacion: "Guardará las visitas de inspección y los diagnósticos de cada sede, con sus hallazgos y evidencias.",
  },
  {
    to: "/app/riesgos", label: "Análisis de riesgos", d: "M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6zM12 8v5M12 16h.01",
    enPreparacion: "Evaluará los riesgos de cada sede con la metodología M-DESR y los ordenará por nivel de atención.",
  },
  {
    to: "/app/tratamiento", label: "Planes de tratamiento", d: "M10 6h10M10 12h10M10 18h10M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2",
    enPreparacion: "Definirá las medidas para atender cada riesgo, con responsable, plazo y seguimiento.",
  },
  { to: "/app/quotes", label: "Cotizaciones", resource: "quotes", contador: "cotizacionesSinRespuesta", d: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h4" },
  { to: "/app/documents", label: "Documentos", resource: "documents", d: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h6" },
  { to: "/app/agenda", label: "Agenda", resource: "agenda", d: "M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM4 10h16M8 2v4M16 2v4" },
  { to: "/app/analytics", label: "Analítica", resource: "analytics", d: "M4 20V11M10 20V5M16 20v-6M2 20h20" },
  { to: "/app/settings", label: "Configuración", d: "M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1M15 4v4M9 10v4M17 16v4" },
];

/** Páginas que existen pero no están en el menú (se llega desde otros módulos). */
const OTRAS: Record<string, string> = {
  "/app/pipeline": "Embudo de negociación",
  "/app/messaging": "Mensajería",
};

/** Ruta de navegación para la barra superior: Inicio / Módulo [/ Detalle]. */
export function migas(pathname: string): { label: string; to?: string }[] {
  const p = pathname.replace(/\/+$/, "") || "/app";
  if (p === "/app") return [{ label: "Inicio", to: "/app" }, { label: "Panel general" }];
  const mod = MODULOS.find((m) => m.to !== "/app" && (p === m.to || p.startsWith(`${m.to}/`)));
  const nombre = mod?.label ?? OTRAS[p] ?? "Panel";
  const base = [{ label: "Inicio", to: "/app" }];
  if (mod && p !== mod.to) return [...base, { label: mod.label, to: mod.to }, { label: "Detalle" }];
  return [...base, { label: nombre }];
}

/** Supabase de producción. Si el panel apunta a otro proyecto, el aviso cambia de color. */
export const PROYECTO_PRODUCCION = "xtfsqdwkbsghkzszpisz";
export const esProduccion = (url: string | undefined) => {
  try {
    return new URL(url ?? "").hostname === `${PROYECTO_PRODUCCION}.supabase.co`;
  } catch {
    return false;
  }
};
