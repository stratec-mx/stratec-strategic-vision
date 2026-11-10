// Catálogo de servicios para cotizaciones.
// Se genera a partir de SERVICES_DATA, así que cualquier servicio nuevo del
// sitio aparece automáticamente en el desplegable del dashboard.
import { SERVICES_DATA } from "@/data/servicesData";

export interface CatalogService {
  /** Código de servicio, p. ej. STR-02.1 */
  code: string;
  title: string;
  /** Descripción corta sugerida para el concepto */
  summary: string;
  /** Código del servicio padre (para agrupar subservicios) */
  parentCode?: string;
}

export const CUSTOM_CODE = "STR-99";

const toCode = (numero: string) => `STR-${numero}`;

const sortKey = (numero: string) =>
  numero.split(".").map((p) => p.padStart(3, "0")).join(".");

/**
 * Servicios que se cotizan pero no tienen página propia en el sitio
 * (variantes de un servicio publicado). numero sigue el mismo esquema.
 */
export const QUOTE_ONLY_SERVICES: { numero: string; titulo: string; descripcionCorta: string }[] = [
  {
    numero: "02.5",
    titulo: "Actualización de Programa Interno de Protección Civil",
    descripcionCorta: "Actualización del Programa Interno vigente: cambios del inmueble, personal, brigadas, análisis de riesgos y anexos.",
  },
];

export const SERVICE_CATALOG: CatalogService[] = [...Object.values(SERVICES_DATA), ...QUOTE_ONLY_SERVICES]
  .sort((a, b) => sortKey(a.numero).localeCompare(sortKey(b.numero)))
  .map((s) => ({
    code: toCode(s.numero),
    title: s.titulo,
    summary: s.descripcionCorta,
    parentCode: s.numero.includes(".") ? toCode(s.numero.split(".")[0]) : undefined,
  }));

export const CUSTOM_SERVICE: CatalogService = {
  code: CUSTOM_CODE,
  title: "Concepto especial",
  summary: "",
};

export const findService = (code?: string): CatalogService | undefined =>
  code === CUSTOM_CODE ? CUSTOM_SERVICE : SERVICE_CATALOG.find((s) => s.code === code);
