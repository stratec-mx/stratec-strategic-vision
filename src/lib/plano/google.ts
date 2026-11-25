// Fondos de Google (Map Tiles API, 2D) para ver en pantalla: satélite con nombres y calles con negocios.
//
// Decisión del titular (25-nov-2026): se usa Google como fondo y para delinear el contorno, asumiendo el
// riesgo de sus condiciones (prohíben calcar su imagen). La lámina en PDF NO usa Google: va con OpenStreetMap.
// Atribución obligatoria: "Google Maps" y el aviso de derechos del área visible (endpoint viewport).
// Llave en VITE_GOOGLE_MAPS_API_KEY (Vercel); nunca se escribe en el código.

import type { Map as MapaLibre } from "maplibre-gl";

export type TipoGoogle = "satellite" | "roadmap";
const PREFIJO = "google-";

export const llaveGoogle = (): string => (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim() ?? "";

interface Sesion {
  session: string;
  expiry: string;
}

const sesiones = new Map<TipoGoogle, Sesion>();

async function sesion(llave: string, tipo: TipoGoogle): Promise<string> {
  const s = sesiones.get(tipo);
  if (s && Number(s.expiry) * 1000 > Date.now() + 60_000) return s.session;
  const cuerpo: Record<string, unknown> = { mapType: tipo, language: "es-MX", region: "MX", scale: "scaleFactor2x", highDpi: true };
  // Satélite con nombres de calles y lugares encima (equivale a "híbrido").
  if (tipo === "satellite") cuerpo.layerTypes = ["layerRoadmap"];
  const r = await fetch(`https://tile.googleapis.com/v1/createSession?key=${encodeURIComponent(llave)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
  if (!r.ok) throw new Error(r.status === 403 || r.status === 400 ? "La llave de Google no es válida o no tiene activada la Map Tiles API." : "Google no respondió.");
  const j = (await r.json()) as Sesion;
  sesiones.set(tipo, j);
  return j.session;
}

/** Agrega (una vez) la capa de Google debajo de las capas propias. */
export async function agregarGoogle(map: MapaLibre, llave: string, tipo: TipoGoogle, antesDe?: string): Promise<void> {
  const id = `${PREFIJO}${tipo}`;
  if (map.getLayer(id)) return;
  const s = await sesion(llave, tipo);
  if (!map.getSource(id)) {
    map.addSource(id, {
      type: "raster",
      tiles: [`https://tile.googleapis.com/v1/2dtiles/{z}/{x}/{y}?session=${s}&key=${encodeURIComponent(llave)}`],
      tileSize: 256,
      maxzoom: 22,
    });
  }
  map.addLayer({ id, type: "raster", source: id, layout: { visibility: "none" } }, antesDe && map.getLayer(antesDe) ? antesDe : undefined);
}

/** Muestra solo el fondo de Google indicado (o ninguno). */
export function mostrarGoogle(map: MapaLibre, tipo: TipoGoogle | null) {
  for (const t of ["satellite", "roadmap"] as const) {
    if (map.getLayer(`${PREFIJO}${t}`)) map.setLayoutProperty(`${PREFIJO}${t}`, "visibility", t === tipo ? "visible" : "none");
  }
}

/** Aviso de derechos de Google para el área visible (obligatorio en pantalla). */
export async function derechosGoogle(map: MapaLibre, llave: string, tipo: TipoGoogle): Promise<string> {
  const s = sesiones.get(tipo)?.session;
  if (!s) return "";
  const b = map.getBounds();
  const z = Math.max(0, Math.min(22, Math.round(map.getZoom())));
  const url = `https://tile.googleapis.com/tile/v1/viewport?session=${s}&key=${encodeURIComponent(llave)}&zoom=${z}&north=${b.getNorth()}&south=${b.getSouth()}&east=${b.getEast()}&west=${b.getWest()}`;
  try {
    const r = await fetch(url);
    if (!r.ok) return "";
    const j = (await r.json()) as { copyright?: string };
    return j.copyright ?? "";
  } catch {
    return "";
  }
}
