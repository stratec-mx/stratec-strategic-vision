// Fondos del mapa. OpenStreetMap siempre; Esri y Google solo si el despliegue tiene su llave (solo en pantalla).

import { llaveEsri } from "./satelite";
import { llaveGoogle } from "./google";

export type Fondo = "osm" | "esri" | "google_sat" | "google_mapa";

/** Fondos disponibles según las llaves configuradas en el despliegue. */
export function fondosDisponibles(): { id: Fondo; etiqueta: string }[] {
  const f: { id: Fondo; etiqueta: string }[] = [{ id: "osm", etiqueta: "Mapa" }];
  if (llaveGoogle()) f.push({ id: "google_sat", etiqueta: "Google satélite" }, { id: "google_mapa", etiqueta: "Google calles" });
  if (llaveEsri()) f.push({ id: "esri", etiqueta: "Satélite Esri" });
  return f;
}
