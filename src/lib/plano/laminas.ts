// Imágenes para el documento del plano (Documento 04 §7): lámina exterior sobre OpenStreetMap y croquis por nivel.
// La lámina NUNCA usa Google ni Esri: solo OpenStreetMap (licencia que permite reproducirla en documentos).

import * as maplibregl from "maplibre-gl";
import urlWorker from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import { cono, lados, type LngLat } from "./geo";
import { claseAbertura, largoMuro, poligonoEspacio, posicionAbertura, puntoInterior, superficie, type Nivel, type P } from "./croquis";
import type { ElementoMapa, Inmueble } from "./inmuebles";
import { COLOR_RUTA, defSimbolo } from "./simbolos";

// Documentos arma el anexo sin abrir el mapa: el motor necesita su worker también aquí.
maplibregl.setWorkerUrl(urlWorker);

const ESTILO_OSM = "https://tiles.openfreemap.org/styles/liberty";

export interface Imagen {
  dataUrl: string;
  ancho: number;
  alto: number;
}

export interface LaminaExterior extends Imagen {
  /** Metros que representa un píxel de la imagen (para la escala gráfica). */
  metrosPorPx: number;
}

const esperar = <T>(p: Promise<T>, ms: number) => Promise.race([p, new Promise<T>((_, mal) => setTimeout(() => mal(new Error("tiempo agotado")), ms))]);

/** Dibuja el exterior en un mapa oculto y devuelve la imagen (JPEG). `elementos` ya viene filtrado (sensibles). */
export async function laminaExterior(inm: Inmueble, elementos: ElementoMapa[], ancho = 1400, alto = 1000): Promise<LaminaExterior> {
  const caja = document.createElement("div");
  caja.style.cssText = `position:fixed;left:-20000px;top:0;width:${ancho}px;height:${alto}px;`;
  document.body.appendChild(caja);
  const per: LngLat[] = inm.perimetro.map((v) => [v.lng, v.lat]);
  const pts: LngLat[] = [...per, ...elementos.map((e) => [e.lng, e.lat] as LngLat), ...inm.rutas.flatMap((r) => r.coords)];
  if (!pts.length && inm.ubicacion) pts.push([inm.ubicacion.lng, inm.ubicacion.lat]);
  const map = new maplibregl.Map({
    container: caja,
    style: ESTILO_OSM,
    interactive: false,
    attributionControl: false,
    pixelRatio: 1,
    fadeDuration: 0,
    canvasContextAttributes: { preserveDrawingBuffer: true },
    center: pts[0] ?? [-99.2342, 18.9186],
    zoom: 17,
  });
  try {
    await esperar(new Promise<void>((ok) => map.once("load", () => ok())), 20000);
    const fc = (features: GeoJSON.Feature[]): GeoJSON.FeatureCollection => ({ type: "FeatureCollection", features });
    map.addSource("predio", { type: "geojson", data: fc(per.length >= 3 ? [{ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [[...per, per[0]]] } }] : []) });
    map.addLayer({ id: "predio-f", type: "fill", source: "predio", paint: { "fill-color": "#0B1F3A", "fill-opacity": 0.08 } });
    map.addLayer({ id: "predio-l", type: "line", source: "predio", paint: { "line-color": "#0B1F3A", "line-width": 3 } });
    map.addSource("conos", {
      type: "geojson",
      data: fc(elementos.filter((e) => e.camara).map((e) => ({ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [cono([e.lng, e.lat], e.camara!.direccion, e.camara!.angulo, e.camara!.alcance)] } }))),
    });
    map.addLayer({ id: "conos", type: "fill", source: "conos", paint: { "fill-color": "#1D4ED8", "fill-opacity": 0.18, "fill-outline-color": "#1D4ED8" } });
    map.addSource("rutas", { type: "geojson", data: fc(inm.rutas.map((r) => ({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: r.coords } }))) });
    map.addLayer({ id: "rutas", type: "line", source: "rutas", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": COLOR_RUTA, "line-width": 5 } });
    // Lados del predio: número de lado (para el cuadro de colindancias).
    const ls = per.length >= 3 ? lados(per) : [];
    map.addSource("lados", { type: "geojson", data: fc(ls.map((l) => ({ type: "Feature", properties: { t: `L${l.indice + 1}` }, geometry: { type: "Point", coordinates: l.medio } }))) });
    map.addLayer({ id: "lados", type: "symbol", source: "lados", layout: { "text-field": ["get", "t"], "text-font": ["Noto Sans Bold"], "text-size": 15, "text-allow-overlap": true }, paint: { "text-color": "#0B1F3A", "text-halo-color": "#FFFFFF", "text-halo-width": 2.5 } });
    map.addSource("elementos", {
      type: "geojson",
      data: fc(
        elementos.map((e, i) => {
          const d = defSimbolo(e.tipo);
          return {
            type: "Feature",
            properties: { color: d.color, glifo: d.glifo, n: String(i + 1), borde: e.situacion === "propuesto" ? "#C4A04A" : e.situacion === "retirar" ? "#B42318" : "#FFFFFF" },
            geometry: { type: "Point", coordinates: [e.lng, e.lat] },
          };
        }),
      ),
    });
    map.addLayer({ id: "el-c", type: "circle", source: "elementos", paint: { "circle-radius": 13, "circle-color": ["get", "color"], "circle-stroke-color": ["get", "borde"], "circle-stroke-width": 3 } });
    map.addLayer({ id: "el-g", type: "symbol", source: "elementos", layout: { "text-field": ["get", "glifo"], "text-font": ["Noto Sans Bold"], "text-size": 11, "text-allow-overlap": true }, paint: { "text-color": "#FFFFFF" } });
    map.addLayer({ id: "el-n", type: "symbol", source: "elementos", layout: { "text-field": ["get", "n"], "text-font": ["Noto Sans Bold"], "text-size": 12, "text-offset": [1.5, -1.1], "text-allow-overlap": true }, paint: { "text-color": "#0B1F3A", "text-halo-color": "#FFFFFF", "text-halo-width": 2 } });

    if (pts.length > 1) {
      const b = pts.reduce((acc, p) => acc.extend(p), new maplibregl.LngLatBounds(pts[0], pts[0]));
      map.fitBounds(b, { padding: 90, maxZoom: 20, duration: 0 });
    }
    await esperar(new Promise<void>((ok) => map.once("idle", () => ok())), 25000).catch(() => undefined);
    const lat = map.getCenter().lat;
    const metrosPorPx = (40075016.686 * Math.cos((lat * Math.PI) / 180)) / (512 * 2 ** map.getZoom());
    return { dataUrl: map.getCanvas().toDataURL("image/jpeg", 0.9), ancho, alto, metrosPorPx };
  } finally {
    map.remove();
    caja.remove();
  }
}

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Croquis de un nivel como SVG (texto). `incluirSensibles` = false quita cámaras, accesos, etc. */
export function svgCroquis(n: Nivel, incluirSensibles: boolean): { svg: string; ancho: number; alto: number } {
  const simbolos = n.simbolos.filter((s) => incluirSensibles || !defSimbolo(s.tipo).sensible);
  const todos: P[] = [...n.vertices, ...simbolos, ...n.escaleras, ...n.rutas.flatMap((r) => r.puntos)];
  if (!todos.length) todos.push({ x: 0, y: 0 }, { x: 10, y: 10 });
  const m = 2;
  const x0 = Math.min(...todos.map((p) => p.x)) - m;
  const y0 = Math.min(...todos.map((p) => p.y)) - m;
  const w = Math.max(...todos.map((p) => p.x)) - x0 + m;
  const h = Math.max(...todos.map((p) => p.y)) - y0 + m;
  const k = 1600 / Math.max(w, h);
  const ancho = Math.round(w * k);
  const alto = Math.round(h * k);
  const X = (x: number) => ((x - x0) * k).toFixed(1);
  const Y = (y: number) => ((y - y0) * k).toFixed(1);
  // Tamaños pensados para verse en media hoja carta (la imagen mide 1600 px de lado).
  const fs = 30;
  const vs = new Map(n.vertices.map((v) => [v.id, v]));
  const partes: string[] = [`<rect width="${ancho}" height="${alto}" fill="#FFFFFF"/>`];
  for (const e of n.espacios) {
    const pts = poligonoEspacio(n, e);
    if (pts.length < 3) continue;
    const c = puntoInterior(pts);
    partes.push(`<polygon points="${pts.map((p) => `${X(p.x)},${Y(p.y)}`).join(" ")}" fill="#F4F1EA"/>`);
    partes.push(`<text x="${X(c.x)}" y="${Y(c.y)}" font-family="Arial" font-size="${fs}" font-weight="bold" fill="#172333" text-anchor="middle">${esc(e.nombre)}</text>`);
    partes.push(`<text x="${X(c.x)}" y="${(Number(Y(c.y)) + fs * 1.2).toFixed(1)}" font-family="Arial" font-size="${fs * 0.85}" fill="#5E646E" text-anchor="middle">≈ ${superficie(pts).toFixed(1)} m²</text>`);
  }
  for (const r of n.rutas) {
    partes.push(`<polyline points="${r.puntos.map((p) => `${X(p.x)},${Y(p.y)}`).join(" ")}" fill="none" stroke="${COLOR_RUTA}" stroke-width="${Math.max(5, k * 0.12)}" stroke-linejoin="round" opacity="0.9"/>`);
  }
  for (const mu of n.muros) {
    const a = vs.get(mu.a);
    const b = vs.get(mu.b);
    if (!a || !b) continue;
    const virtual = (mu as { virtual?: boolean }).virtual;
    partes.push(
      virtual
        ? `<line x1="${X(a.x)}" y1="${Y(a.y)}" x2="${X(b.x)}" y2="${Y(b.y)}" stroke="#5E646E" stroke-width="2" stroke-dasharray="10 8"/>`
        : `<line x1="${X(a.x)}" y1="${Y(a.y)}" x2="${X(b.x)}" y2="${Y(b.y)}" stroke="#172333" stroke-width="${Math.max(3, mu.grosor * k)}" stroke-linecap="square"/>`,
    );
    const L = largoMuro(n, mu);
    if (!virtual && L * k > 140) {
      partes.push(`<text x="${X((a.x + b.x) / 2)}" y="${(Number(Y((a.y + b.y) / 2)) - 10).toFixed(1)}" font-family="Arial" font-size="${fs * 0.8}" fill="#3C4350" text-anchor="middle" stroke="#FFFFFF" stroke-width="5" paint-order="stroke">${L.toFixed(2)} m</text>`);
    }
  }
  for (const ab of n.aberturas) {
    const mu = n.muros.find((x) => x.id === ab.muro);
    const c = posicionAbertura(n, ab);
    if (!mu || !c) continue;
    const a = vs.get(mu.a)!;
    const b = vs.get(mu.b)!;
    const L = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const ux = (b.x - a.x) / L;
    const uy = (b.y - a.y) / L;
    const p1 = { x: c.x - (ux * ab.ancho) / 2, y: c.y - (uy * ab.ancho) / 2 };
    const p2 = { x: c.x + (ux * ab.ancho) / 2, y: c.y + (uy * ab.ancho) / 2 };
    partes.push(`<line x1="${X(p1.x)}" y1="${Y(p1.y)}" x2="${X(p2.x)}" y2="${Y(p2.y)}" stroke="#FFFFFF" stroke-width="${Math.max(5, mu.grosor * k + 3)}"/>`);
    const ventana = ab.tipo === "ventana";
    partes.push(`<line x1="${X(p1.x)}" y1="${Y(p1.y)}" x2="${X(p2.x)}" y2="${Y(p2.y)}" stroke="${ventana ? "#2563EB" : "#B45309"}" stroke-width="3" ${claseAbertura(ab) === "cortina" ? 'stroke-dasharray="8 6"' : ""}/>`);
  }
  for (const s of n.escaleras) {
    const ancho2 = (s.ancho ?? 1.2) * k;
    const largo2 = (s.largo ?? 3) * k;
    partes.push(
      `<g transform="translate(${X(s.x)} ${Y(s.y)}) rotate(${s.giro})"><rect x="${-ancho2 / 2}" y="${-largo2 / 2}" width="${ancho2}" height="${largo2}" fill="#FFFFFF" stroke="#172333" stroke-width="2"/><line x1="0" y1="${largo2 / 2 - 8}" x2="0" y2="${-largo2 / 2 + 8}" stroke="#172333" stroke-width="2"/></g>`,
    );
  }
  simbolos.forEach((s, i) => {
    const d = defSimbolo(s.tipo);
    const r = 26;
    const borde = s.situacion === "propuesto" ? "#C4A04A" : s.situacion === "retirar" ? "#B42318" : "#FFFFFF";
    partes.push(`<circle cx="${X(s.x)}" cy="${Y(s.y)}" r="${r}" fill="${d.color}" stroke="${borde}" stroke-width="4"/>`);
    partes.push(`<text x="${X(s.x)}" y="${(Number(Y(s.y)) + r * 0.38).toFixed(1)}" font-family="Arial" font-weight="bold" font-size="${r}" fill="#FFFFFF" text-anchor="middle">${esc(d.glifo)}</text>`);
    partes.push(`<text x="${(Number(X(s.x)) + r * 1.2).toFixed(1)}" y="${(Number(Y(s.y)) - r * 0.8).toFixed(1)}" font-family="Arial" font-weight="bold" font-size="${r * 0.9}" fill="#0B1F3A" stroke="#FFFFFF" stroke-width="4" paint-order="stroke">C${i + 1}</text>`);
  });
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}">${partes.join("")}</svg>`, ancho, alto };
}

/** Convierte una imagen (URL, SVG o blob) a JPEG en data URL, con el ancho máximo indicado. */
export async function aJpeg(fuente: string | Blob, anchoMax = 1600): Promise<Imagen | null> {
  const url = typeof fuente === "string" ? fuente : URL.createObjectURL(fuente);
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((ok, mal) => {
      img.onload = () => ok();
      img.onerror = () => mal(new Error("imagen"));
      img.src = url;
    });
    const k = Math.min(1, anchoMax / (img.naturalWidth || anchoMax));
    const w = Math.round((img.naturalWidth || anchoMax) * k);
    const h = Math.round((img.naturalHeight || anchoMax * 0.75) * k);
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d")!;
    g.fillStyle = "#FFFFFF";
    g.fillRect(0, 0, w, h);
    g.drawImage(img, 0, 0, w, h);
    return { dataUrl: c.toDataURL("image/jpeg", 0.85), ancho: w, alto: h };
  } catch {
    return null;
  } finally {
    if (typeof fuente !== "string") URL.revokeObjectURL(url);
  }
}

export const svgADataUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
