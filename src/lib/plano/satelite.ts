// Fondo satelital de Esri, SOLO en pantalla (Documento 04 §11).
// - Requiere una llave de ArcGIS Location Platform con el permiso de mapas base
//   (premium:user:basemaps), en la variable VITE_ARCGIS_API_KEY de Vercel.
// - La lámina en PDF nunca usa esta imagen: va con OpenStreetMap.
// - La atribución es obligatoria y no se puede ocultar.

import type { Map as MapaLibre, LayerSpecification, SourceSpecification } from "maplibre-gl";

export const ATRIBUCION_ESRI = "Source: Esri, Vantor, Earthstar Geographics, and the GIS User Community";
const ESTILO_IMAGERY = "https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/styles/arcgis/imagery";
const PREFIJO = "esri-sat-";

/** Llave pública de Esri configurada en el despliegue (o cadena vacía si no hay). */
export const llaveEsri = (): string => (import.meta.env.VITE_ARCGIS_API_KEY as string | undefined)?.trim() ?? "";

interface EstiloEsri {
  sources?: Record<string, SourceSpecification>;
  layers?: LayerSpecification[];
}

/**
 * Toma del estilo de Esri solo las capas de imagen (raster) y las fuentes que usan,
 * con nombres propios y la atribución obligatoria. Función pura, para poder probarla.
 */
export function capasDeImagen(estilo: EstiloEsri): { fuentes: Record<string, SourceSpecification>; capas: LayerSpecification[] } {
  const fuentes: Record<string, SourceSpecification> = {};
  const capas: LayerSpecification[] = [];
  for (const capa of estilo.layers ?? []) {
    if (capa.type !== "raster") continue;
    const origen = (capa as { source?: string }).source;
    const fuente = origen ? estilo.sources?.[origen] : undefined;
    if (!origen || !fuente || fuente.type !== "raster") continue;
    const id = `${PREFIJO}${origen}`;
    fuentes[id] = { ...fuente, attribution: ATRIBUCION_ESRI };
    capas.push({ ...capa, id: `${PREFIJO}${capa.id}`, source: id, layout: { ...(capa.layout ?? {}), visibility: "visible" } } as LayerSpecification);
  }
  return { fuentes, capas };
}

/** Agrega la imagen satelital debajo de las capas propias (`antesDe`). Lanza un error si no se pudo. */
export async function agregarSatelite(map: MapaLibre, llave: string, antesDe?: string): Promise<void> {
  if (map.getLayer(`${PREFIJO}listo`)) return;
  const r = await fetch(`${ESTILO_IMAGERY}?token=${encodeURIComponent(llave)}`);
  if (!r.ok) throw new Error(r.status === 401 || r.status === 403 ? "La llave de Esri no es válida o no tiene permiso de mapas base." : "Esri no respondió.");
  const { fuentes, capas } = capasDeImagen((await r.json()) as EstiloEsri);
  if (!capas.length) throw new Error("El estilo de Esri no trajo imagen satelital.");
  for (const [id, f] of Object.entries(fuentes)) if (!map.getSource(id)) map.addSource(id, f);
  for (const c of capas) if (!map.getLayer(c.id)) map.addLayer(c, antesDe && map.getLayer(antesDe) ? antesDe : undefined);
  // Marca para no volver a cargar (capa vacía, invisible).
  map.addLayer({ id: `${PREFIJO}listo`, type: "background", paint: { "background-opacity": 0 } }, capas[0].id);
}

/** Muestra u oculta la imagen satelital ya cargada. */
export function mostrarSatelite(map: MapaLibre, visible: boolean) {
  for (const capa of map.getStyle()?.layers ?? []) {
    if (capa.id.startsWith(PREFIJO) && capa.id !== `${PREFIJO}listo`) map.setLayoutProperty(capa.id, "visibility", visible ? "visible" : "none");
  }
}
