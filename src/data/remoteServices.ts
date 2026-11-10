// Servicios que STRATEC presta a distancia, agrupados por la necesidad que
// resuelven. Lo usan /servicios, las páginas de cobertura y el prerender.
import { SERVICES_DATA } from "@/data/servicesData";

export interface RemoteGroup {
  need: string;
  text: string;
  slugs: string[];
}

export const REMOTE_GROUPS: RemoteGroup[] = [
  {
    need: "Cumplir",
    text: "Tus programas y documentos en orden.",
    slugs: ["revision-programa-interno", "programa-interno-proteccion-civil"],
  },
  {
    need: "Prevenir",
    text: "Riesgos identificados y un equipo preparado.",
    slugs: ["acompanamiento-mensual", "capacitacion"],
  },
  {
    need: "Responder",
    text: "Saber qué hacer ante una amenaza o una crisis.",
    slugs: ["protocolos-seguridad", "nom-035-violencia-laboral", "plan-continuidad-operaciones"],
  },
];

export const remoteServices = (g: RemoteGroup) =>
  g.slugs.map((s) => SERVICES_DATA[s]).filter(Boolean);
