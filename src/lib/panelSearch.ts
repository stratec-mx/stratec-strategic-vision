// Buscador del panel (Ctrl+K): qué tablas consulta según los permisos del usuario
// y cómo se limpia el texto antes de mandarlo a la base de datos.
import type { Resource } from "@/lib/access";

export type Grupo = "clientes" | "prospectos" | "cotizaciones" | "documentos";

export type Objetivo = {
  grupo: Grupo;
  etiqueta: string;
  recurso: Resource;
  tabla: "clients" | "leads" | "quotes" | "documents";
  columnas: string;
  /** Columnas donde se busca el texto. Nunca correo ni teléfono: esos dependen del permiso "contactos". */
  campos: string[];
};

export const OBJETIVOS: Objetivo[] = [
  { grupo: "clientes", etiqueta: "Clientes", recurso: "clients", tabla: "clients", columnas: "id, name, industry, status", campos: ["name", "industry"] },
  { grupo: "prospectos", etiqueta: "Prospectos", recurso: "leads", tabla: "leads", columnas: "id, full_name, organization, status", campos: ["full_name", "organization"] },
  { grupo: "cotizaciones", etiqueta: "Cotizaciones", recurso: "quotes", tabla: "quotes", columnas: "id, number, status, total, currency", campos: ["number", "notes"] },
  { grupo: "documentos", etiqueta: "Documentos", recurso: "documents", tabla: "documents", columnas: "id, folio, title, status", campos: ["folio", "title"] },
];

/** Solo las tablas que el usuario puede ver. */
export const objetivosPermitidos = (can: (r: Resource) => boolean) => OBJETIVOS.filter((o) => can(o.recurso));

/**
 * Quita lo que rompería el filtro de la base de datos (comas, paréntesis, comodines)
 * y deja el texto en una sola línea. Devuelve "" si quedan menos de 2 caracteres.
 */
export function limpiarBusqueda(texto: string): string {
  const t = texto.replace(/[,()%*\\"':]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
  return t.length >= 2 ? t : "";
}

/** Filtro "or" de PostgREST: campo.ilike.%texto% en cada columna. */
export const filtroOr = (o: Objetivo, limpio: string) => o.campos.map((c) => `${c}.ilike.%${limpio}%`).join(",");

export type Resultado = { id: string; grupo: Grupo; titulo: string; detalle: string; href: string };

/** Convierte una fila de la base en un renglón del buscador. */
export function aResultado(grupo: Grupo, f: Record<string, unknown>): Resultado {
  const s = (k: string) => (f[k] == null ? "" : String(f[k]));
  switch (grupo) {
    case "clientes":
      return { id: s("id"), grupo, titulo: s("name"), detalle: s("industry") || "Cliente", href: "/app/clients" };
    case "prospectos":
      return { id: s("id"), grupo, titulo: s("full_name"), detalle: s("organization") || "Prospecto", href: "/app/leads" };
    case "cotizaciones": {
      const total = Number(f.total ?? 0).toLocaleString("es-MX", { style: "currency", currency: s("currency") || "MXN" });
      return { id: s("id"), grupo, titulo: s("number"), detalle: total, href: "/app/quotes" };
    }
    case "documentos":
      return { id: s("id"), grupo, titulo: s("title") || s("folio"), detalle: s("folio"), href: `/app/documents/${s("id")}` };
  }
}
