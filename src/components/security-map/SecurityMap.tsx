// SecurityMap — mapa satelital interactivo con marcadores geo-reales.
//
// Usa Leaflet cargado por CDN (sin dependencia npm) + capa satelital Esri
// World Imagery (gratis, sin API key). Los marcadores se fijan a coordenadas
// (lat/lng): se quedan en su lugar aunque se mueva o amplíe el mapa.
// Funciona en tablet y teléfono.
//
// Componente controlado: recibe `value` (marcadores) y notifica `onChange`.
// Reutilizable en el diagnóstico público y en la inspección interna según la
// paleta `kinds` que se le pase.

import { useEffect, useRef, useState } from "react";
import { Crosshair, Search, MapPin, Loader2 } from "lucide-react";
import {
  SecurityMarker,
  MarkerKind,
  MarkerKindConfig,
  DEFAULT_MARKER_KINDS,
  kindColor,
  kindLabel,
} from "./types";

declare global {
  interface Window {
    L?: any;
  }
}

const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";

let leafletPromise: Promise<any> | null = null;
function loadLeaflet(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.L) return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }
    const existing = document.getElementById("leaflet-js") as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(window.L));
      existing.addEventListener("error", () => reject(new Error("No se pudo cargar Leaflet")));
      if (window.L) resolve(window.L);
      return;
    }
    const script = document.createElement("script");
    script.id = "leaflet-js";
    script.src = LEAFLET_JS;
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error("No se pudo cargar Leaflet"));
    document.body.appendChild(script);
  });
  return leafletPromise;
}

interface Props {
  value: SecurityMarker[];
  onChange: (markers: SecurityMarker[]) => void;
  kinds?: MarkerKindConfig[];
  /** Centro inicial. Default: Cuernavaca, Morelos. */
  center?: { lat: number; lng: number };
  initialZoom?: number;
  height?: number | string;
  /** Si true, no se pueden agregar/mover/borrar marcadores. */
  readOnly?: boolean;
  helpText?: string;
}

const DEFAULT_CENTER = { lat: 18.9186, lng: -99.2342 }; // Cuernavaca
const uid = () => Math.random().toString(36).slice(2, 10);

const pinSvg = (color: string) =>
  `<svg width="30" height="42" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg">
     <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 27 15 27s15-16.5 15-27C30 6.7 23.3 0 15 0z"
           fill="${color}" stroke="#ffffff" stroke-width="2"/>
     <circle cx="15" cy="15" r="5.5" fill="#ffffff"/>
   </svg>`;

export function SecurityMap({
  value,
  onChange,
  kinds = DEFAULT_MARKER_KINDS,
  center = DEFAULT_CENTER,
  initialZoom = 18,
  height = 440,
  readOnly = false,
  helpText,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());

  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [activeKind, setActiveKind] = useState<MarkerKind>(kinds[0].kind);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  // Refs a estado actual para los handlers persistentes de Leaflet (evitan stale closures).
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const activeKindRef = useRef(activeKind);
  const kindsRef = useRef(kinds);
  const readOnlyRef = useRef(readOnly);
  valueRef.current = value;
  onChangeRef.current = onChange;
  activeKindRef.current = activeKind;
  kindsRef.current = kinds;
  readOnlyRef.current = readOnly;

  const updateMarker = (id: string, patch: Partial<SecurityMarker>) =>
    onChangeRef.current(valueRef.current.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const removeMarker = (id: string) =>
    onChangeRef.current(valueRef.current.filter((m) => m.id !== id));

  // ── Inicializar el mapa una sola vez ──────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        const map = L.map(containerRef.current, { zoomControl: true }).setView(
          [center.lat, center.lng],
          initialZoom
        );
        L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          { maxZoom: 19, attribution: "Tiles &copy; Esri, Maxar, Earthstar Geographics" }
        ).addTo(map);
        L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
          { maxZoom: 19 }
        ).addTo(map);

        map.on("click", (e: any) => {
          if (readOnlyRef.current) return;
          onChangeRef.current([
            ...valueRef.current,
            { id: uid(), lat: e.latlng.lat, lng: e.latlng.lng, kind: activeKindRef.current },
          ]);
        });

        mapRef.current = map;
        setReady(true);
      })
      .catch(() => !cancelled && setLoadError(true));

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sincronizar marcadores con `value` ────────────────────────────────────
  useEffect(() => {
    const L = window.L;
    const map = mapRef.current;
    if (!L || !map || !ready) return;

    const seen = new Set<string>();

    const makeIcon = (color: string) =>
      L.divIcon({
        className: "stratec-pin",
        html: pinSvg(color),
        iconSize: [30, 42],
        iconAnchor: [15, 42],
        popupAnchor: [0, -38],
      });

    // Popup con nota editable + eliminar (DOM nativo). El <textarea> es la
    // fuente viva del texto mientras el popup está abierto: por eso NO se
    // reconstruye en cada cambio de `value` (destruiría el campo y el foco).
    const buildPopup = (m: SecurityMarker, color: string) => {
      const popup = document.createElement("div");
      popup.style.minWidth = "180px";
      const label = kindLabel(kindsRef.current, m.kind);
      const head = document.createElement("div");
      head.style.cssText = "display:flex;align-items:center;gap:6px;margin-bottom:6px";
      head.innerHTML = `<span style="width:12px;height:12px;border-radius:9999px;background:${color};display:inline-block"></span><strong style="font-size:13px">${label}</strong>`;
      popup.appendChild(head);
      if (readOnly) {
        if (m.note) {
          const p = document.createElement("p");
          p.textContent = m.note;
          p.style.cssText = "font-size:12px;color:#555;margin:0";
          popup.appendChild(p);
        }
      } else {
        const ta = document.createElement("textarea");
        ta.value = m.note ?? "";
        ta.placeholder = "Nota (opcional): qué observas aquí…";
        ta.rows = 2;
        ta.style.cssText =
          "width:100%;font-size:12px;border:1px solid #ccc;padding:4px;margin-bottom:6px;resize:none;outline:none";
        ta.addEventListener("input", () => updateMarker(m.id, { note: ta.value }));
        ta.addEventListener("click", (ev) => ev.stopPropagation());
        popup.appendChild(ta);
        const del = document.createElement("button");
        del.type = "button";
        del.textContent = "✕ Eliminar";
        del.style.cssText =
          "font-size:12px;color:#dc2626;cursor:pointer;background:none;border:none;padding:0";
        del.addEventListener("click", () => {
          map.closePopup();
          removeMarker(m.id);
        });
        popup.appendChild(del);
      }
      return popup;
    };

    value.forEach((m) => {
      seen.add(m.id);
      const color = kindColor(kindsRef.current, m.kind);

      let lm = markersRef.current.get(m.id);
      const isNew = !lm;
      const kindChanged = !isNew && lm.__stratecKind !== m.kind;

      if (isNew) {
        lm = L.marker([m.lat, m.lng], { icon: makeIcon(color), draggable: !readOnly });
        lm.addTo(map);
        lm.on("dragend", () => {
          const ll = lm.getLatLng();
          updateMarker(m.id, { lat: ll.lat, lng: ll.lng });
        });
        markersRef.current.set(m.id, lm);
      } else {
        // setIcon solo si cambió el tipo: Leaflet re-enlaza el popup dentro de setIcon.
        if (kindChanged) lm.setIcon(makeIcon(color));
        const cur = lm.getLatLng();
        if (cur.lat !== m.lat || cur.lng !== m.lng) lm.setLatLng([m.lat, m.lng]);
        if (lm.dragging) (readOnly ? lm.dragging.disable() : lm.dragging.enable());
      }

      // Enlazar popup solo al crear, si cambió el tipo o el modo lectura.
      // Escribir una nota cambia `value` en cada tecla; reconstruir aquí
      // reemplazaba el <textarea> abierto y perdía el cursor.
      if (isNew || kindChanged || lm.__stratecReadOnly !== readOnly) {
        lm.__stratecKind = m.kind;
        lm.__stratecReadOnly = readOnly;
        lm.bindPopup(buildPopup(m, color));
      }
    });

    // Quitar marcadores que ya no están en value.
    markersRef.current.forEach((lm, id) => {
      if (!seen.has(id)) {
        map.removeLayer(lm);
        markersRef.current.delete(id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, ready, readOnly, kinds]);

  const flyTo = (lat: number, lng: number, zoom = 18) => {
    if (mapRef.current) mapRef.current.flyTo([lat, lng], zoom, { duration: 1.1 });
  };

  const geolocate = () => {
    if (!navigator.geolocation) {
      setSearchError("Tu dispositivo no permite geolocalización.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        flyTo(pos.coords.latitude, pos.coords.longitude, 19);
      },
      () => {
        setLocating(false);
        setSearchError("No se pudo obtener tu ubicación. Revisa los permisos.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const doSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;
    setSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`
      );
      const data = (await res.json()) as Array<{ lat: string; lon: string }>;
      if (!data.length) {
        setSearchError("No se encontró esa dirección. Prueba con más detalle o usa tu ubicación.");
      } else {
        flyTo(parseFloat(data[0].lat), parseFloat(data[0].lon), 18);
      }
    } catch {
      setSearchError("No se pudo buscar la dirección. Revisa tu conexión.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="w-full">
      {!readOnly && (
        <div className="mb-3 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <form onSubmit={doSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-steel/60" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar dirección o colonia…"
                  className="w-full h-11 pl-9 pr-3 rounded-none border border-steel/25 bg-white text-sm text-navy focus:border-[#C4A04A] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={searching}
                className="h-11 px-4 rounded-none bg-navy text-smoke text-xs uppercase tracking-wider hover:bg-navy-deep transition-colors disabled:opacity-60"
              >
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
              </button>
            </form>
            <button
              type="button"
              onClick={geolocate}
              disabled={locating}
              className="h-11 px-4 rounded-none border border-[#C4A04A]/50 text-[#9a7d2f] text-xs uppercase tracking-wider hover:bg-[#C4A04A]/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
              Mi ubicación
            </button>
          </div>

          {searchError && <p className="text-xs text-red-600">{searchError}</p>}

          <div>
            <div className="text-[0.7rem] uppercase tracking-wider text-steel/70 mb-2">
              Toca el mapa para marcar · tipo activo:
            </div>
            <div className="flex flex-wrap gap-2">
              {kinds.map((k) => {
                const active = k.kind === activeKind;
                return (
                  <button
                    key={k.kind}
                    type="button"
                    onClick={() => setActiveKind(k.kind)}
                    title={k.hint}
                    className={`flex items-center gap-2 px-3 py-2 rounded-none border text-xs transition-all ${
                      active
                        ? "border-navy bg-navy text-smoke"
                        : "border-steel/25 bg-white text-navy hover:border-steel/50"
                    }`}
                  >
                    <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: k.color }} />
                    {k.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {helpText && (
        <p className="mb-2 text-xs text-steel flex items-start gap-1.5">
          <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[#C4A04A]" />
          {helpText}
        </p>
      )}

      <div style={{ height }} className="w-full border border-steel/25 overflow-hidden relative bg-navy-deep">
        <div ref={containerRef} className="h-full w-full" />
        {!ready && !loadError && (
          <div className="absolute inset-0 flex items-center justify-center text-smoke/70 text-sm gap-2 pointer-events-none">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando mapa…
          </div>
        )}
        {loadError && (
          <div className="absolute inset-0 flex items-center justify-center text-smoke/80 text-sm text-center px-6">
            No se pudo cargar el mapa. Revisa tu conexión e intenta de nuevo.
          </div>
        )}
      </div>

      {value.length > 0 && (
        <div className="mt-3 text-xs text-steel">
          <strong className="text-navy">{value.length}</strong> marcador{value.length !== 1 ? "es" : ""} en el predio.
        </div>
      )}
    </div>
  );
}

export default SecurityMap;
