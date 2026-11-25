// Mapa del módulo Inmuebles y plano: cartera, predio, colindancias y elementos (Documento 04 §5).
// MapLibre + OpenStreetMap (OpenFreeMap, estilo liberty) + Terra Draw para dibujar con el dedo.
// Todo es vectorial: el mapa y los trazos no pierden calidad al acercarse (F-15).

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
// MapLibre 6 busca su "worker" junto a su propio archivo; en el sitio empaquetado hay que decirle dónde quedó.
import urlWorker from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import "./plano.css";
import { TerraDraw, TerraDrawLineStringMode, TerraDrawPolygonMode, TerraDrawSelectMode } from "terra-draw";
import { TerraDrawMapLibreGLAdapter } from "terra-draw-maplibre-gl-adapter";
import { cono, destino, distancia, lados, rumbo, ORIENTACION_CORTA, type LngLat } from "@/lib/plano/geo";
import { ESTADO_INFO, puntoInmueble, TIPO_COLINDANCIA_ETIQUETA, type Inmueble, type VerticePredio } from "@/lib/plano/inmuebles";
import { COLOR_RUTA, CONDICION_INFO, SIMBOLOS, type DatosCamara, type TipoSimbolo } from "@/lib/plano/simbolos";
import { agregarSatelite, llaveEsri, mostrarSatelite } from "@/lib/plano/satelite";

maplibregl.setWorkerUrl(urlWorker);

const ESTILO_MAPA = "https://tiles.openfreemap.org/styles/liberty";
const MORELOS: LngLat = [-99.07, 18.75];

export type HerramientaMapa = "navegar" | "ubicar" | "vertices" | "editar" | "recorrido" | "ruta" | `simbolo:${TipoSimbolo}`;

export interface MapaHandle {
  volarCartera(): void;
  volarMunicipio(inm: Inmueble): void;
  volarInmueble(inm: Inmueble, viaMunicipio?: boolean): void;
  volarA(p: LngLat, zoom?: number): void;
  centro(): LngLat;
}

interface Props {
  inmuebles: Inmueble[];
  sel: Inmueble | null;
  herramienta: HerramientaMapa;
  elementoSel: string | null;
  ladoSel: number | null;
  gps: { lng: number; lat: number; precision: number } | null;
  recorrido: VerticePredio[];
  /** Fondo satelital de Esri (solo en pantalla). */
  satelite: boolean;
  onErrorSatelite(mensaje: string): void;
  onElegirInmueble(id: string): void;
  onClicMapa(p: LngLat): void;
  onPerimetroDibujado(coords: LngLat[]): void;
  onPerimetroEditado(coords: LngLat[]): void;
  onRutaDibujada(coords: LngLat[]): void;
  onElegirElemento(id: string | null): void;
  onMoverElemento(id: string, p: LngLat): void;
  onCamara(id: string, cambios: Partial<DatosCamara>): void;
  onElegirLado(i: number): void;
}

const vacio: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

function flechaRuta(): ImageData {
  const c = document.createElement("canvas");
  c.width = 24;
  c.height = 24;
  const g = c.getContext("2d")!;
  g.fillStyle = "#FFFFFF";
  g.beginPath();
  g.moveTo(4, 5);
  g.lineTo(20, 12);
  g.lineTo(4, 19);
  g.lineTo(8, 12);
  g.closePath();
  g.fill();
  return g.getImageData(0, 0, 24, 24);
}

function elementoMarcador(html: string, clase: string): HTMLDivElement {
  const el = document.createElement("div");
  el.className = clase;
  el.innerHTML = html;
  return el;
}

export const MapaInmuebles = forwardRef<MapaHandle, Props>(function MapaInmuebles(props, ref) {
  const caja = useRef<HTMLDivElement>(null);
  const mapa = useRef<maplibregl.Map | null>(null);
  const draw = useRef<TerraDraw | null>(null);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cb = useRef(props);
  cb.current = props;
  const viaje = useRef(0);
  const editando = useRef<string | null>(null);

  // ── Crear el mapa una sola vez ──
  useEffect(() => {
    if (!caja.current) return;
    const map = new maplibregl.Map({
      container: caja.current,
      style: ESTILO_MAPA,
      center: MORELOS,
      zoom: 8.6,
      maxZoom: 22,
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
    });
    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.ScaleControl({ unit: "metric", maxWidth: 120 }), "bottom-left");
    mapa.current = map;
    // Si el contenedor cambia de tamaño (pestaña oculta, giro del teléfono), el mapa se reacomoda.
    const ro = new ResizeObserver(() => map.resize());
    ro.observe(caja.current);

    map.on("error", (e) => {
      const msg = String(e.error?.message ?? "");
      if (/fetch|network|tiles|style/i.test(msg)) setError("No se pudo cargar el mapa base. Revisa la conexión a internet.");
    });

    map.on("load", () => {
      map.addImage("flecha-ruta", flechaRuta(), { pixelRatio: 2 });
      for (const id of ["predio", "conos", "rutas", "recorrido", "gps"]) map.addSource(id, { type: "geojson", data: vacio });
      map.addLayer({ id: "gps-precision", type: "fill", source: "gps", filter: ["==", ["geometry-type"], "Polygon"], paint: { "fill-color": "#2563EB", "fill-opacity": 0.12 } });
      map.addLayer({ id: "predio-relleno", type: "fill", source: "predio", filter: ["==", ["geometry-type"], "Polygon"], paint: { "fill-color": "#0B1F3A", "fill-opacity": 0.1 } });
      map.addLayer({ id: "predio-borde", type: "line", source: "predio", paint: { "line-color": "#0B1F3A", "line-width": 3 } });
      map.addLayer({ id: "predio-lado-sel", type: "line", source: "predio", filter: ["==", ["get", "lado"], true], paint: { "line-color": "#F59E0B", "line-width": 6 } });
      map.addLayer({ id: "conos-relleno", type: "fill", source: "conos", paint: { "fill-color": "#1D4ED8", "fill-opacity": ["case", ["get", "sel"], 0.28, 0.16] } });
      map.addLayer({ id: "conos-borde", type: "line", source: "conos", paint: { "line-color": "#1D4ED8", "line-width": 1.5, "line-opacity": 0.7 } });
      map.addLayer({ id: "rutas-linea", type: "line", source: "rutas", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": COLOR_RUTA, "line-width": 6 } });
      map.addLayer({ id: "rutas-flechas", type: "symbol", source: "rutas", layout: { "symbol-placement": "line", "symbol-spacing": 70, "icon-image": "flecha-ruta", "icon-size": 1.5, "icon-rotation-alignment": "map", "icon-allow-overlap": true } });
      map.addLayer({ id: "recorrido-linea", type: "line", source: "recorrido", paint: { "line-color": "#B7791F", "line-width": 3, "line-dasharray": [2, 1.5] } });
      map.addLayer({ id: "recorrido-puntos", type: "circle", source: "recorrido", filter: ["==", ["geometry-type"], "Point"], paint: { "circle-radius": 6, "circle-color": "#B7791F", "circle-stroke-color": "#FFFFFF", "circle-stroke-width": 2 } });
      map.addLayer({ id: "gps-punto", type: "circle", source: "gps", filter: ["==", ["geometry-type"], "Point"], paint: { "circle-radius": 7, "circle-color": "#2563EB", "circle-stroke-color": "#FFFFFF", "circle-stroke-width": 3 } });

      const td = new TerraDraw({
        adapter: new TerraDrawMapLibreGLAdapter({ map }),
        modes: [
          new TerraDrawPolygonMode({ styles: { fillColor: "#0B1F3A", fillOpacity: 0.15, outlineColor: "#0B1F3A", outlineWidth: 3, closingPointColor: "#F59E0B", closingPointWidth: 8, coordinatePointColor: "#FFFFFF", coordinatePointOutlineColor: "#0B1F3A", coordinatePointWidth: 6 } }),
          new TerraDrawLineStringMode({ styles: { lineStringColor: "#1B7F3B", lineStringWidth: 5, closingPointColor: "#1B7F3B", closingPointWidth: 8 } }),
          new TerraDrawSelectMode({
            flags: {
              polygon: { feature: { draggable: false, coordinates: { draggable: true, midpoints: true, deletable: true } } },
            },
            styles: { selectedPolygonColor: "#0B1F3A", selectedPolygonFillOpacity: 0.15, selectedPolygonOutlineColor: "#F59E0B", selectedPolygonOutlineWidth: 3, selectionPointWidth: 9, selectionPointColor: "#FFFFFF", selectionPointOutlineColor: "#0B1F3A", selectionPointOutlineWidth: 2, midPointColor: "#F59E0B", midPointWidth: 6 },
          }),
        ],
      });
      td.start();
      td.on("finish", (id, ctx) => {
        const f = td.getSnapshotFeature(id);
        if (!f) return;
        if (ctx.mode === "polygon" && f.geometry.type === "Polygon") {
          const anillo = (f.geometry.coordinates[0] as LngLat[]).slice(0, -1);
          td.removeFeatures([id]);
          cb.current.onPerimetroDibujado(anillo);
        } else if (ctx.mode === "linestring" && f.geometry.type === "LineString") {
          const linea = f.geometry.coordinates as LngLat[];
          td.removeFeatures([id]);
          cb.current.onRutaDibujada(linea);
        }
      });
      td.on("change", (ids, tipo) => {
        const id = editando.current;
        if (!id || tipo !== "update" || !ids.includes(id)) return;
        const f = td.getSnapshotFeature(id);
        if (f && f.geometry.type === "Polygon") cb.current.onPerimetroEditado((f.geometry.coordinates[0] as LngLat[]).slice(0, -1));
      });
      draw.current = td;
      // Arranca mostrando toda la cartera.
      const pts = cb.current.inmuebles.map(puntoInmueble).filter((p): p is LngLat => !!p);
      if (pts.length > 1) {
        const b = pts.reduce((acc, p) => acc.extend(p), new maplibregl.LngLatBounds(pts[0], pts[0]));
        map.fitBounds(b, { padding: 80, maxZoom: 11, duration: 0 });
      }
      setListo(true);
    });

    // Lejos del predio, las etiquetas de colindancias estorban: se ocultan.
    const alZoom = () => caja.current?.classList.toggle("plano-lejos", map.getZoom() < 16.5);
    map.on("zoom", alZoom);
    alZoom();

    map.on("click", (e) => {
      const h = cb.current.herramienta;
      if (h === "ubicar" || h.startsWith("simbolo:")) cb.current.onClicMapa([e.lngLat.lng, e.lngLat.lat]);
      else if (h === "navegar" && e.originalEvent.target === map.getCanvas()) cb.current.onElegirElemento(null);
    });

    return () => {
      ro.disconnect();
      try {
        draw.current?.stop();
      } catch {
        /* ya detenido */
      }
      draw.current = null;
      map.remove();
      mapa.current = null;
    };
  }, []);

  // ── Fondo satelital (Esri, solo en pantalla; Documento 04 §11) ──
  const { satelite } = props;
  useEffect(() => {
    const map = mapa.current;
    if (!map || !listo) return;
    if (!satelite) {
      mostrarSatelite(map, false);
      return;
    }
    const llave = llaveEsri();
    if (!llave) {
      cb.current.onErrorSatelite("El satélite se activa cuando se configure la llave de Esri en Vercel (ver la guía).");
      return;
    }
    let vigente = true;
    agregarSatelite(map, llave, "gps-precision")
      .then(() => vigente && mostrarSatelite(map, true))
      .catch((e: Error) => vigente && cb.current.onErrorSatelite(e.message));
    return () => {
      vigente = false;
    };
  }, [satelite, listo]);

  // ── Herramienta activa: modo de Terra Draw y cursor ──
  const { herramienta } = props;
  useEffect(() => {
    const td = draw.current;
    const map = mapa.current;
    if (!td || !map || !listo) return;
    map.getCanvas().style.cursor = herramienta === "ubicar" || herramienta.startsWith("simbolo:") ? "crosshair" : "";
    if (herramienta === "vertices") {
      td.setMode("polygon");
      return () => td.setMode("static");
    }
    if (herramienta === "ruta") {
      td.setMode("linestring");
      return () => td.setMode("static");
    }
    if (herramienta === "editar") {
      const per = cb.current.sel?.perimetro ?? [];
      if (per.length < 3) return;
      const id = td.getFeatureId();
      const anillo = per.map((v) => [v.lng, v.lat]);
      td.addFeatures([{ id, type: "Feature", geometry: { type: "Polygon", coordinates: [[...anillo, anillo[0]]] }, properties: { mode: "polygon" } }]);
      td.setMode("select");
      td.selectFeature(id);
      editando.current = String(id);
      return () => {
        editando.current = null;
        try {
          td.setMode("static");
          td.clear();
        } catch {
          /* mapa ya cerrado */
        }
      };
    }
    td.setMode("static");
  }, [herramienta, listo]);

  // ── Capas del inmueble seleccionado ──
  const { sel, elementoSel, ladoSel, recorrido, gps } = props;
  useEffect(() => {
    const map = mapa.current;
    if (!map || !listo) return;
    const fuente = (id: string) => map.getSource(id) as maplibregl.GeoJSONSource | undefined;
    const per: LngLat[] = sel && herramienta !== "editar" ? sel.perimetro.map((v) => [v.lng, v.lat]) : [];
    const featuresPredio: GeoJSON.Feature[] = [];
    if (per.length >= 3) featuresPredio.push({ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [[...per, per[0]]] } });
    if (per.length >= 3 && ladoSel !== null && ladoSel < per.length) {
      featuresPredio.push({ type: "Feature", properties: { lado: true }, geometry: { type: "LineString", coordinates: [per[ladoSel], per[(ladoSel + 1) % per.length]] } });
    }
    fuente("predio")?.setData({ type: "FeatureCollection", features: featuresPredio });
    fuente("conos")?.setData({
      type: "FeatureCollection",
      features: (sel?.elementos ?? [])
        .filter((e) => e.camara)
        .map((e) => ({
          type: "Feature",
          properties: { sel: e.id === elementoSel },
          geometry: { type: "Polygon", coordinates: [cono([e.lng, e.lat], e.camara!.direccion, e.camara!.angulo, e.camara!.alcance)] },
        })),
    });
    fuente("rutas")?.setData({
      type: "FeatureCollection",
      features: (sel?.rutas ?? []).map((r) => ({ type: "Feature", properties: { id: r.id }, geometry: { type: "LineString", coordinates: r.coords } })),
    });
    const rc: LngLat[] = recorrido.map((v) => [v.lng, v.lat]);
    fuente("recorrido")?.setData({
      type: "FeatureCollection",
      features: [
        ...(rc.length >= 2 ? [{ type: "Feature" as const, properties: {}, geometry: { type: "LineString" as const, coordinates: rc } }] : []),
        ...rc.map((c) => ({ type: "Feature" as const, properties: {}, geometry: { type: "Point" as const, coordinates: c } })),
      ],
    });
    fuente("gps")?.setData(
      gps
        ? {
            type: "FeatureCollection",
            features: [
              { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [cono([gps.lng, gps.lat], 0, 360, Math.max(1, gps.precision), 40)] } },
              { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [gps.lng, gps.lat] } },
            ],
          }
        : vacio,
    );
  }, [sel, elementoSel, ladoSel, recorrido, gps, listo, herramienta]);

  // ── Marcadores HTML: cartera, elementos, punta de la cámara y lados ──
  const marcadores = useRef(new Map<string, maplibregl.Marker>());
  const arrastrando = useRef(new Set<string>());
  /** Mientras se arrastra un marcador, no se le cambia la posición desde el estado. */
  const vigilarArrastre = (m: maplibregl.Marker, clave: string) => {
    m.on("dragstart", () => arrastrando.current.add(clave));
    m.on("dragend", () => arrastrando.current.delete(clave));
    return m;
  };
  const { inmuebles } = props;
  useEffect(() => {
    const map = mapa.current;
    if (!map || !listo) return;
    const vivos = new Set<string>();
    const poner = (clave: string, lngLat: LngLat, crear: () => maplibregl.Marker, actualizar?: (m: maplibregl.Marker) => void) => {
      vivos.add(clave);
      let m = marcadores.current.get(clave);
      if (!m) {
        m = crear().setLngLat(lngLat).addTo(map);
        marcadores.current.set(clave, m);
      } else if (!arrastrando.current.has(clave)) {
        m.setLngLat(lngLat);
      }
      actualizar?.(m);
    };

    // Cartera: un marcador por inmueble, con el color del estado del proyecto (F-14).
    for (const inm of inmuebles) {
      const p = puntoInmueble(inm);
      if (!p) continue;
      if (sel?.id === inm.id && inm.perimetro.length >= 3) continue;
      const color = ESTADO_INFO[inm.estado].color;
      poner(
        `inm:${inm.id}`,
        p,
        () => {
          const el = elementoMarcador("", "plano-pin");
          el.addEventListener("click", (ev) => {
            ev.stopPropagation();
            cb.current.onElegirInmueble(el.dataset.id!);
          });
          return new maplibregl.Marker({ element: el, anchor: "bottom" });
        },
        (m) => {
          const el = m.getElement();
          el.dataset.id = inm.id;
          el.title = `${inm.nombre} · ${ESTADO_INFO[inm.estado].etiqueta}`;
          el.innerHTML = `<svg width="30" height="40" viewBox="0 0 30 40" aria-hidden="true"><path d="M15 1C7.3 1 1 7.1 1 14.7 1 25 15 39 15 39s14-14 14-24.3C29 7.1 22.7 1 15 1z" fill="${color}" stroke="#fff" stroke-width="2"/><circle cx="15" cy="15" r="5.5" fill="#fff"/></svg><span class="plano-pin-nombre">${inm.nombre.replace(/</g, "&lt;")}</span>`;
          el.classList.toggle("plano-pin-sel", sel?.id === inm.id);
        },
      );
    }

    // Elementos del inmueble seleccionado.
    for (const e of sel?.elementos ?? []) {
      const def = SIMBOLOS[e.tipo];
      poner(
        `el:${e.id}`,
        [e.lng, e.lat],
        () => {
          const el = elementoMarcador("", "plano-simbolo");
          el.addEventListener("click", (ev) => {
            ev.stopPropagation();
            cb.current.onElegirElemento(el.dataset.id!);
          });
          const m = vigilarArrastre(new maplibregl.Marker({ element: el, draggable: true }), `el:${e.id}`);
          m.on("dragend", () => {
            const ll = m.getLngLat();
            cb.current.onMoverElemento(el.dataset.id!, [ll.lng, ll.lat]);
          });
          return m;
        },
        (m) => {
          const el = m.getElement();
          el.dataset.id = e.id;
          el.title = def.etiqueta;
          el.style.background = def.color;
          el.textContent = def.glifo;
          el.classList.toggle("plano-simbolo-sel", e.id === elementoSel);
          // Anillo de color si el elemento está en mal estado.
          el.style.boxShadow = e.condicion === "malo" || e.condicion === "no_funciona" ? `0 0 0 3px ${CONDICION_INFO[e.condicion].color}` : "";
          m.setDraggable(herramienta === "navegar");
        },
      );
      // Punta del cono: arrastrarla cambia dirección y alcance.
      if (e.camara && e.id === elementoSel) {
        const punta = destino([e.lng, e.lat], e.camara.alcance, e.camara.direccion);
        poner(
          `punta:${e.id}`,
          punta,
          () => {
            const el = elementoMarcador("", "plano-punta");
            el.title = "Arrastra para cambiar dirección y alcance";
            const m = vigilarArrastre(new maplibregl.Marker({ element: el, draggable: true }), `punta:${e.id}`);
            m.on("drag", () => {
              const ll = m.getLngLat();
              const cam = cb.current.sel?.elementos.find((x) => x.id === el.dataset.id);
              if (!cam) return;
              const c: LngLat = [cam.lng, cam.lat];
              cb.current.onCamara(cam.id, {
                direccion: Math.round(rumbo(c, [ll.lng, ll.lat])),
                alcance: Math.max(1, Math.round(distancia(c, [ll.lng, ll.lat]) * 10) / 10),
              });
            });
            return m;
          },
          (m) => {
            m.getElement().dataset.id = e.id;
          },
        );
      }
    }

    // Etiqueta de cada lado del predio con su colindancia.
    if (sel && sel.perimetro.length >= 3 && herramienta !== "editar") {
      const ls = lados(sel.perimetro.map((v) => [v.lng, v.lat]));
      for (const l of ls) {
        const col = sel.colindancias[l.indice] ?? {};
        const ori = col.orientacion ?? l.orientacion;
        poner(
          `lado:${l.indice}`,
          l.medio,
          () => {
            const el = elementoMarcador("", "plano-lado");
            el.addEventListener("click", (ev) => {
              ev.stopPropagation();
              cb.current.onElegirLado(Number(el.dataset.i));
            });
            return new maplibregl.Marker({ element: el });
          },
          (m) => {
            const el = m.getElement();
            el.dataset.i = String(l.indice);
            el.textContent = `${ORIENTACION_CORTA[ori]}${col.tipo ? ` · ${TIPO_COLINDANCIA_ETIQUETA[col.tipo]}` : ""} · ${Math.round(l.largo * 10) / 10} m`;
            el.classList.toggle("plano-lado-sel", ladoSel === l.indice);
          },
        );
      }
    }

    for (const [clave, m] of marcadores.current) {
      if (!vivos.has(clave)) {
        m.remove();
        marcadores.current.delete(clave);
      }
    }
  }, [inmuebles, sel, elementoSel, ladoSel, herramienta, listo]);

  // ── Navegación tipo Prezi (F-15) ──
  useImperativeHandle(
    ref,
    () => ({
      volarCartera() {
        const map = mapa.current;
        if (!map) return;
        viaje.current++;
        const pts = cb.current.inmuebles.map(puntoInmueble).filter((p): p is LngLat => !!p);
        if (!pts.length) {
          map.flyTo({ center: MORELOS, zoom: 8.6, duration: 2200, essential: true });
          return;
        }
        const b = pts.reduce((acc, p) => acc.extend(p), new maplibregl.LngLatBounds(pts[0], pts[0]));
        map.fitBounds(b, { padding: 70, maxZoom: 11, duration: 2400, linear: false, essential: true });
      },
      volarMunicipio(inm) {
        const map = mapa.current;
        const p = puntoInmueble(inm);
        if (!map || !p) return;
        viaje.current++;
        map.flyTo({ center: p, zoom: 13, duration: 2200, curve: 1.5, essential: true });
      },
      volarInmueble(inm, viaMunicipio = false) {
        const map = mapa.current;
        const p = puntoInmueble(inm);
        if (!map || !p) return;
        const mio = ++viaje.current;
        const final = () => {
          if (mio !== viaje.current) return;
          if (inm.perimetro.length >= 3) {
            const b = inm.perimetro.reduce((acc, v) => acc.extend([v.lng, v.lat]), new maplibregl.LngLatBounds([inm.perimetro[0].lng, inm.perimetro[0].lat], [inm.perimetro[0].lng, inm.perimetro[0].lat]));
            map.fitBounds(b, { padding: 90, maxZoom: 20, duration: 2200, linear: false, essential: true });
          } else {
            map.flyTo({ center: p, zoom: 18, duration: 2200, essential: true });
          }
        };
        if (viaMunicipio && map.getZoom() < 11.5) {
          map.flyTo({ center: p, zoom: 13, duration: 2000, curve: 1.6, essential: true });
          map.once("moveend", () => setTimeout(final, 250));
        } else {
          final();
        }
      },
      volarA(p, zoom = 20.5) {
        viaje.current++;
        mapa.current?.flyTo({ center: p, zoom, duration: 1800, essential: true });
      },
      centro() {
        const c = mapa.current?.getCenter();
        return c ? [c.lng, c.lat] : MORELOS;
      },
    }),
    [],
  );

  return (
    <div className="relative h-full w-full">
      <div ref={caja} className="h-full w-full" />
      {error && (
        <div role="alert" className="absolute left-1/2 top-3 -translate-x-1/2 rounded-md bg-pn-alerta px-3 py-2 text-[13px] text-white shadow">
          {error}
        </div>
      )}
    </div>
  );
});
