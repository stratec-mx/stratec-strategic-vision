// Editor del croquis interior por niveles (Documento 04 §5.2).
// Dibujo en SVG con coordenadas en metros; funciona con ratón y con el dedo.

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { AppWindow, DoorOpen, Maximize, MousePointer2, PenLine, Redo2, Route, Undo2, ZoomIn, ZoomOut } from "lucide-react";
import { useHistorial } from "@/hooks/useHistorial";
import {
  EPS, ETIQUETA_ABERTURA, ETIQUETA_ESCALERA, GROSOR_INICIAL, SUBTIPOS_PUERTA, TIPOS_ESCALERA, agregarAbertura, agregarEscalera,
  agregarMuro, anguloHacia, asentar, borrarAbertura, borrarEscalera, borrarMuro, cambiarEscalera, deslizarAbertura, dist,
  escaleraInicial, giroConPaso, iman, moverVerticesLibre, muroCercano, nuevoId, predioACroquis,
  type Croquis, type Nivel, type P, type ResultadoIman, type SubtipoPuerta, type TipoEscalera,
} from "@/lib/plano/croquis";
import { CAMARA_INICIAL, SIMBOLOS, TIPOS_SIMBOLO, type TipoSimbolo } from "@/lib/plano/simbolos";
import { CroquisDibujo, type Seleccion } from "./CroquisDibujo";
import { CroquisPanel } from "./CroquisPanel";

export type HerramientaCroquis = "seleccionar" | "muro" | "divisoria" | "puerta" | "ventana" | "escalera" | "ruta" | `simbolo:${TipoSimbolo}`;

interface Vista {
  x: number;
  y: number;
  w: number;
}

type Arrastre =
  | { k: "pan"; cx: number; cy: number; vista: Vista; movio: boolean }
  | { k: "vertice"; id: string; movio: boolean }
  | { k: "muro"; id: string; inicio: P; orig: Record<string, P>; normal: P; movio: boolean }
  /**
   * Puertas, ventanas, escaleras y símbolos se arrastran con cualquier herramienta. Si solo se
   * tocan (sin arrastrar) y la herramienta dibuja (muro, línea divisoria, ruta), el toque coloca
   * un punto como si se hubiera tocado el fondo.
   */
  | { k: "abertura"; id: string; cx: number; cy: number; movio: boolean; coloca: boolean }
  | { k: "escalera" | "simbolo"; id: string; dx: number; dy: number; cx: number; cy: number; movio: boolean; coloca: boolean }
  | { k: "giro"; id: string; movio: boolean }
  | { k: "camara-punta"; id: string; movio: boolean }
  | { k: "colocar"; cx: number; cy: number; movio: boolean; vista: Vista };

const AYUDA: Record<string, string> = {
  seleccionar: "Toca un muro, espacio, puerta o símbolo para editarlo. Arrastra las esquinas o los muros para moverlos. Las puertas, ventanas, escaleras y símbolos se arrastran con cualquier herramienta. Arrastra el fondo para desplazarte.",
  muro: "Toca para empezar y otra vez en cada esquina. Puedes escribir el largo y pulsar Enter. Al tocar una esquina existente el tramo termina. Doble toque o Esc para terminar.",
  divisoria: "Delimita pasillos, zonas o cajones de estacionamiento donde no hay muro. Se traza igual que un muro: toca en cada esquina. Divide los espacios, pero no lleva puertas ni ventanas.",
  puerta: "Elige el tipo de puerta junto al botón y toca un muro para ponerla. Toca una puerta o ventana existente para editarla, o arrástrala a lo largo de su muro.",
  ventana: "Toca un muro para poner una ventana. Toca una puerta o ventana existente para editarla, o arrástrala a lo largo de su muro.",
  escalera: "Elige el tipo junto al botón y toca dónde va. Después gírala con el círculo azul y elige a qué nivel llega.",
  ruta: "Toca cada punto de la ruta de evacuación, en orden hacia la salida. Doble toque o “Terminar ruta” para cerrar.",
};

const dibujaTramos = (h: HerramientaCroquis) => h === "muro" || h === "divisoria";

const ESPERA_ARRASTRE = 6; // píxeles

export function CroquisEditor({ croquis, onChange, predio }: { croquis: Croquis; onChange: (c: Croquis) => void; predio?: P[] }) {
  const hist = useHistorial(croquis, onChange);
  const c = hist.valor;
  const [nivelId, setNivelId] = useState(c.niveles[0]?.id ?? "");
  const nivel = c.niveles.find((n) => n.id === nivelId) ?? c.niveles[0];
  const [herramienta, setHerramienta] = useState<HerramientaCroquis>("seleccionar");
  const [clasePuerta, setClasePuerta] = useState<SubtipoPuerta>("abatible");
  const [tipoEscalera, setTipoEscalera] = useState<TipoEscalera>("recta");
  const [giroLibre, setGiroLibre] = useState(false);
  const [seleccion, setSeleccion] = useState<Seleccion>(null);
  const [grosor, setGrosor] = useState(GROSOR_INICIAL);
  const [angulos, setAngulos] = useState(true);
  const [conIman, setConIman] = useState(true);
  const [cadena, setCadena] = useState<P | null>(null);
  const [cursor, setCursor] = useState<ResultadoIman | null>(null);
  const [ruta, setRuta] = useState<P[]>([]);
  const [largo, setLargo] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const cajaRef = useRef<HTMLDivElement>(null);
  const largoRef = useRef<HTMLInputElement>(null);
  const [tam, setTam] = useState({ ancho: 800, alto: 520 });
  const [vista, setVista] = useState<Vista>({ x: -2, y: -2, w: 34 });
  const vistaRef = useRef(vista);
  vistaRef.current = vista;
  const arrastre = useRef<Arrastre | null>(null);
  const punteros = useRef(new Map<number, { x: number; y: number }>());
  const pellizco = useRef<{ d: number; vista: Vista; cx: number; cy: number } | null>(null);

  const esc = vista.w / Math.max(1, tam.ancho);
  const alto = vista.w * (tam.alto / Math.max(1, tam.ancho));

  const predioNivel = useMemo(() => (predio && nivel ? predio.map((p) => predioACroquis(p, nivel.amarre)) : undefined), [predio, nivel]);
  const nombresNivel = useMemo(() => Object.fromEntries(c.niveles.map((n) => [n.id, n.nombre])), [c.niveles]);

  // ── Cambios ──
  const aplicarNivel = useCallback(
    (f: (n: Nivel) => Nivel, op?: { fusionar?: boolean }) => {
      if (!nivel) return;
      hist.aplicar((cc) => ({ ...cc, niveles: cc.niveles.map((n) => (n.id === nivel.id ? f(n) : n)) }), op);
    },
    [hist, nivel],
  );
  const aplicarCroquis = hist.aplicar;

  // ── Tamaño del lienzo ──
  useEffect(() => {
    const el = cajaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setTam({ ancho: e.contentRect.width, alto: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const encuadrar = useCallback(() => {
    if (!nivel) return;
    const pts: P[] = [...nivel.vertices, ...(predioNivel ?? []), ...nivel.simbolos, ...nivel.escaleras];
    if (!pts.length) {
      setVista({ x: -2, y: -2, w: 30 });
      return;
    }
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const x0 = Math.min(...xs);
    const x1 = Math.max(...xs);
    const y0 = Math.min(...ys);
    const y1 = Math.max(...ys);
    const margen = 2.5;
    const relacion = tam.alto / Math.max(1, tam.ancho);
    const w = Math.max(x1 - x0 + margen * 2, (y1 - y0 + margen * 2) / relacion, 8);
    const h = w * relacion;
    setVista({ x: (x0 + x1) / 2 - w / 2, y: (y0 + y1) / 2 - h / 2, w });
  }, [nivel, predioNivel, tam]);

  // Encuadra al abrir, al cambiar de nivel y cuando el lienzo cambia de tamaño la primera vez.
  const encuadrado = useRef<string>("");
  useEffect(() => {
    // Se vuelve a encuadrar al cambiar de nivel o cuando el lienzo cambia mucho de tamaño.
    const clave = `${nivel?.id}:${Math.round(tam.ancho / 120)}:${Math.round(tam.alto / 120)}`;
    if (encuadrado.current === clave || tam.ancho < 50) return;
    encuadrado.current = clave;
    encuadrar();
  }, [nivel?.id, tam.ancho, tam.alto, encuadrar]);

  // Un espacio recién formado pide nombre y tipo.
  const pendientesVistos = useRef(new Set<string>());
  useEffect(() => {
    if (!nivel) return;
    const nuevos = nivel.espacios.filter((e) => e.pendiente && !pendientesVistos.current.has(e.id));
    nuevos.forEach((e) => pendientesVistos.current.add(e.id));
    if (nuevos.length) setSeleccion({ k: "espacio", id: nuevos[0].id });
  }, [nivel]);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 3500);
    return () => clearTimeout(t);
  }, [aviso]);

  // ── Coordenadas ──
  const aMundo = useCallback((cx: number, cy: number): P => {
    const r = svgRef.current!.getBoundingClientRect();
    const v = vistaRef.current;
    const e = v.w / Math.max(1, r.width);
    return { x: v.x + (cx - r.left) * e, y: v.y + (cy - r.top) * e };
  }, []);

  const ajustar = useCallback(
    (raw: P, origen?: P | null): ResultadoIman => {
      if (!nivel) return { p: raw };
      if (!conIman) {
        if (origen && angulos) return iman({ ...nivel, vertices: [], muros: [] }, raw, { tol: 0, rejilla: 0.01, origen, angulos });
        return { p: { x: Math.round(raw.x * 100) / 100, y: Math.round(raw.y * 100) / 100 } };
      }
      return iman(nivel, raw, { tol: 12 * esc, rejilla: 0.25, origen: origen ?? undefined, angulos, predio: predioNivel });
    },
    [nivel, conIman, angulos, esc, predioNivel],
  );

  const zoom = useCallback((factor: number, centro?: P) => {
    setVista((v) => {
      const h = v.w * (tam.alto / Math.max(1, tam.ancho));
      const c0 = centro ?? { x: v.x + v.w / 2, y: v.y + h / 2 };
      const w = Math.max(2, Math.min(600, v.w * factor));
      const k = w / v.w;
      return { x: c0.x - (c0.x - v.x) * k, y: c0.y - (c0.y - v.y) * k, w };
    });
  }, [tam]);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const rueda = (e: WheelEvent) => {
      e.preventDefault();
      zoom(Math.pow(1.0015, e.deltaY), aMundo(e.clientX, e.clientY));
    };
    el.addEventListener("wheel", rueda, { passive: false });
    return () => el.removeEventListener("wheel", rueda);
  }, [zoom, aMundo]);

  // ── Acciones de dibujo ──
  const terminarCadena = useCallback(() => {
    setCadena(null);
    setLargo("");
  }, []);

  const terminarRuta = useCallback(() => {
    if (ruta.length >= 2) {
      const id = nuevoId("r");
      aplicarNivel((n) => ({ ...n, rutas: [...n.rutas, { id, puntos: ruta }] }));
      setSeleccion({ k: "ruta", id });
    }
    setRuta([]);
  }, [ruta, aplicarNivel]);

  const colocarMuro = useCallback(
    (p: P) => {
      if (!nivel) return;
      if (!cadena) {
        setCadena(p);
        return;
      }
      if (dist(cadena, p) < EPS) return;
      // Al llegar a una esquina o a un muro que ya existe, el muro termina (cierra el recinto).
      const existia = nivel.vertices.some((v) => dist(v, p) < EPS) || !!muroCercano(nivel, p, EPS);
      const desde = cadena;
      const virtual = herramienta === "divisoria";
      aplicarNivel((n) => agregarMuro(n, desde, p, grosor, virtual));
      setLargo("");
      setCadena(existia ? null : p);
    },
    [nivel, cadena, aplicarNivel, grosor, herramienta],
  );

  const colocarConLargo = useCallback(() => {
    const L = Number(largo.replace(",", "."));
    if (!cadena || !(L > 0)) return;
    let ux = 1;
    let uy = 0;
    if (cursor && dist(cursor.p, cadena) > EPS) {
      const d = dist(cursor.p, cadena);
      ux = (cursor.p.x - cadena.x) / d;
      uy = (cursor.p.y - cadena.y) / d;
    }
    colocarMuro({ x: cadena.x + ux * L, y: cadena.y + uy * L });
  }, [largo, cadena, cursor, colocarMuro]);

  const colocar = useCallback(
    (raw: P) => {
      if (!nivel) return;
      if (dibujaTramos(herramienta)) {
        colocarMuro(ajustar(raw, cadena).p);
      } else if (herramienta === "puerta" || herramienta === "ventana") {
        const m = muroCercano(nivel, raw, 16 * esc, { soloFisicos: true });
        if (!m) {
          setAviso(
            muroCercano(nivel, raw, 16 * esc)
              ? "Las líneas divisorias no llevan puertas ni ventanas. Cámbiala a muro físico si hace falta."
              : "Toca sobre un muro: las puertas y ventanas van pegadas a un muro.",
          );
          return;
        }
        // La abertura nueva queda seleccionada en el siguiente render.
        pendienteAbertura.current = new Set(nivel.aberturas.map((a) => a.id));
        const clase = herramienta === "ventana" ? "ventana" : clasePuerta;
        aplicarNivel((n) => agregarAbertura(n, m.muro.id, m.t, clase));
      } else if (herramienta === "escalera") {
        const p = ajustar(raw).p;
        const arriba = [...c.niveles].filter((n) => n.nivelPiso > nivel.nivelPiso).sort((a, b) => a.nivelPiso - b.nivelPiso)[0];
        const id = nuevoId("s");
        aplicarCroquis((cc) =>
          agregarEscalera(cc, nivel.id, { id, x: p.x, y: p.y, giro: 0, sentido: "sube", nivelDestino: arriba?.id, ...escaleraInicial(tipoEscalera) }),
        );
        setSeleccion({ k: "escalera", id });
        setHerramienta("seleccionar");
      } else if (herramienta === "ruta") {
        setRuta((r) => [...r, ajustar(raw, r[r.length - 1]).p]);
      } else if (herramienta.startsWith("simbolo:")) {
        const tipo = herramienta.slice(8) as TipoSimbolo;
        const id = nuevoId("y");
        const p = { x: Math.round(raw.x * 20) / 20, y: Math.round(raw.y * 20) / 20 };
        aplicarNivel((n) => ({
          ...n,
          simbolos: [...n.simbolos, { id, tipo, ...p, ...(tipo === "camara" ? { camara: { ...CAMARA_INICIAL, alcance: 6 } } : {}) }],
        }));
        setSeleccion({ k: "simbolo", id });
      }
    },
    [nivel, herramienta, colocarMuro, ajustar, cadena, esc, aplicarNivel, aplicarCroquis, c.niveles, clasePuerta, tipoEscalera],
  );

  // Selecciona la puerta o ventana recién puesta.
  const pendienteAbertura = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!pendienteAbertura.current || !nivel) return;
    const nueva = nivel.aberturas.find((a) => !pendienteAbertura.current!.has(a.id));
    pendienteAbertura.current = null;
    if (nueva) setSeleccion({ k: "abertura", id: nueva.id });
  }, [nivel]);

  const borrarSeleccion = useCallback(() => {
    if (!seleccion || !nivel) return;
    const { k, id } = seleccion;
    if (k === "muro") aplicarNivel((n) => borrarMuro(n, id));
    else if (k === "vertice") aplicarNivel((n) => n.muros.filter((m) => m.a === id || m.b === id).reduce((acc, m) => borrarMuro(acc, m.id), n));
    else if (k === "abertura") aplicarNivel((n) => borrarAbertura(n, id));
    else if (k === "escalera") aplicarCroquis((cc) => borrarEscalera(cc, nivel.id, id));
    else if (k === "simbolo") aplicarNivel((n) => ({ ...n, simbolos: n.simbolos.filter((s) => s.id !== id) }));
    else if (k === "ruta") aplicarNivel((n) => ({ ...n, rutas: n.rutas.filter((r) => r.id !== id) }));
    else if (k === "espacio") {
      setAviso("Un espacio se forma con sus muros: para quitarlo, borra uno de sus muros.");
      return;
    }
    setSeleccion(null);
  }, [seleccion, nivel, aplicarNivel, aplicarCroquis]);

  // ── Teclado ──
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const enCampo = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (enCampo) return;
        e.preventDefault();
        if (e.shiftKey) hist.rehacer();
        else hist.deshacer();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        if (enCampo) return;
        e.preventDefault();
        hist.rehacer();
        return;
      }
      if (enCampo) return;
      if (e.key === "Escape") {
        terminarCadena();
        setRuta([]);
        setSeleccion(null);
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        borrarSeleccion();
      } else if (e.key === "Enter" && herramienta === "ruta") {
        terminarRuta();
      } else if (cadena && /^[0-9.,]$/.test(e.key)) {
        e.preventDefault();
        setLargo((l) => l + e.key);
        largoRef.current?.focus();
      }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [hist, terminarCadena, borrarSeleccion, cadena, herramienta, terminarRuta]);

  // ── Puntero ──
  const alBajar = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (!nivel) return;
    try {
      svgRef.current?.setPointerCapture(e.pointerId);
    } catch {
      /* puntero que ya no está activo */
    }
    punteros.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (punteros.current.size === 2) {
      const [a, b] = [...punteros.current.values()];
      pellizco.current = { d: Math.hypot(a.x - b.x, a.y - b.y), vista: vistaRef.current, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
      arrastre.current = null;
      return;
    }
    const raw = aMundo(e.clientX, e.clientY);
    const blanco = (e.target as Element).closest("[data-k]");
    const k = blanco?.getAttribute("data-k");
    const id = blanco?.getAttribute("data-id") ?? "";

    // La punta de la cámara, la manija de giro, puertas, ventanas, escaleras y símbolos se
    // arrastran con cualquier herramienta.
    if (k === "camara-punta") {
      arrastre.current = { k: "camara-punta", id, movio: false };
      return;
    }
    if (k === "escalera-giro") {
      setSeleccion({ k: "escalera", id });
      arrastre.current = { k: "giro", id, movio: false };
      return;
    }
    // Con muro, línea divisoria o ruta, un toque sin arrastre sigue colocando el punto.
    const coloca = dibujaTramos(herramienta) || herramienta === "ruta";
    if (k === "abertura" && nivel.aberturas.some((a) => a.id === id)) {
      if (!coloca) setSeleccion({ k: "abertura", id });
      arrastre.current = { k: "abertura", id, cx: e.clientX, cy: e.clientY, movio: false, coloca };
      return;
    }
    if (k === "simbolo" || k === "escalera") {
      const obj = k === "simbolo" ? nivel.simbolos.find((s) => s.id === id) : nivel.escaleras.find((s) => s.id === id);
      if (obj) {
        if (!coloca) setSeleccion({ k, id });
        arrastre.current = { k, id, dx: obj.x - raw.x, dy: obj.y - raw.y, cx: e.clientX, cy: e.clientY, movio: false, coloca };
        return;
      }
    }
    if (herramienta !== "seleccionar") {
      arrastre.current = { k: "colocar", cx: e.clientX, cy: e.clientY, movio: false, vista: vistaRef.current };
      return;
    }
    if (k === "vertice") {
      setSeleccion({ k: "vertice", id });
      arrastre.current = { k: "vertice", id, movio: false };
    } else if (k === "muro") {
      const m = nivel.muros.find((w) => w.id === id);
      if (!m) return;
      setSeleccion({ k: "muro", id });
      const a = nivel.vertices.find((v) => v.id === m.a)!;
      const b = nivel.vertices.find((v) => v.id === m.b)!;
      const L = dist(a, b) || 1;
      arrastre.current = { k: "muro", id, inicio: raw, orig: { [a.id]: { x: a.x, y: a.y }, [b.id]: { x: b.x, y: b.y } }, normal: { x: -(b.y - a.y) / L, y: (b.x - a.x) / L }, movio: false };
    } else if (k === "espacio" || k === "ruta") {
      setSeleccion({ k, id });
      arrastre.current = { k: "pan", cx: e.clientX, cy: e.clientY, vista: vistaRef.current, movio: false };
    } else {
      setSeleccion(null);
      arrastre.current = { k: "pan", cx: e.clientX, cy: e.clientY, vista: vistaRef.current, movio: false };
    }
  };

  const alMover = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (!nivel) return;
    if (punteros.current.has(e.pointerId)) punteros.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pellizco.current && punteros.current.size === 2) {
      const [a, b] = [...punteros.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const pz = pellizco.current;
      const r = svgRef.current!.getBoundingClientRect();
      const e0 = pz.vista.w / r.width;
      const w = Math.max(2, Math.min(600, pz.vista.w * (pz.d / Math.max(1, d))));
      const e1 = w / r.width;
      const cx = (a.x + b.x) / 2 - r.left;
      const cy = (a.y + b.y) / 2 - r.top;
      const mundo = { x: pz.vista.x + (pz.cx - r.left) * e0, y: pz.vista.y + (pz.cy - r.top) * e0 };
      setVista({ x: mundo.x - cx * e1, y: mundo.y - cy * e1, w });
      return;
    }
    const raw = aMundo(e.clientX, e.clientY);
    const ar = arrastre.current;
    if (!ar) {
      if (dibujaTramos(herramienta)) setCursor(ajustar(raw, cadena));
      else if (herramienta === "ruta") setCursor(ajustar(raw, ruta[ruta.length - 1]));
      else if (cursor) setCursor(null);
      return;
    }
    if (ar.k === "pan" || ar.k === "colocar") {
      const dx = e.clientX - ar.cx;
      const dy = e.clientY - ar.cy;
      if (!ar.movio && Math.hypot(dx, dy) < ESPERA_ARRASTRE) {
        if (dibujaTramos(herramienta)) setCursor(ajustar(raw, cadena));
        return;
      }
      ar.movio = true;
      const e0 = ar.vista.w / svgRef.current!.getBoundingClientRect().width;
      setVista({ ...ar.vista, x: ar.vista.x - dx * e0, y: ar.vista.y - dy * e0 });
      return;
    }
    if ((ar.k === "abertura" || ar.k === "escalera" || ar.k === "simbolo") && !ar.movio) {
      // Un temblor del dedo no es arrastre: así un toque solo selecciona.
      if (Math.hypot(e.clientX - ar.cx, e.clientY - ar.cy) < ESPERA_ARRASTRE) return;
      setSeleccion({ k: ar.k, id: ar.id });
    }
    const primero = !ar.movio;
    ar.movio = true;
    const op = { fusionar: !primero };
    if (ar.k === "vertice") {
      const sin: Nivel = { ...nivel, vertices: nivel.vertices.filter((v) => v.id !== ar.id), muros: nivel.muros.filter((m) => m.a !== ar.id && m.b !== ar.id) };
      const p = conIman ? iman(sin, raw, { tol: 12 * esc, rejilla: 0.05, predio: predioNivel }).p : raw;
      aplicarNivel((n) => moverVerticesLibre(n, { [ar.id]: p }), op);
    } else if (ar.k === "muro") {
      const d = (raw.x - ar.inicio.x) * ar.normal.x + (raw.y - ar.inicio.y) * ar.normal.y;
      const paso = Math.round(d / 0.05) * 0.05;
      const cambios: Record<string, P> = {};
      for (const [vid, o] of Object.entries(ar.orig)) cambios[vid] = { x: o.x + ar.normal.x * paso, y: o.y + ar.normal.y * paso };
      aplicarNivel((n) => moverVerticesLibre(n, cambios), op);
    } else if (ar.k === "abertura") {
      // Se desliza por su muro; solo cambia de muro si el puntero se aleja claramente del suyo.
      aplicarNivel((n) => deslizarAbertura(n, ar.id, raw, 30 * esc), op);
    } else if (ar.k === "giro") {
      const s = nivel.escaleras.find((x) => x.id === ar.id);
      if (s) {
        const giro = giroConPaso(anguloHacia(s, raw), giroLibre || e.shiftKey);
        // Siempre se aplica (aunque el giro no cambie) para que todo el arrastre sea un solo paso de deshacer.
        aplicarCroquis((cc) => cambiarEscalera(cc, nivel.id, ar.id, { giro }), op);
      }
    } else if (ar.k === "escalera") {
      const x = Math.round((raw.x + ar.dx) * 20) / 20;
      const y = Math.round((raw.y + ar.dy) * 20) / 20;
      aplicarCroquis((cc) => cambiarEscalera(cc, nivel.id, ar.id, { x, y }), op);
    } else if (ar.k === "simbolo") {
      const x = Math.round((raw.x + ar.dx) * 20) / 20;
      const y = Math.round((raw.y + ar.dy) * 20) / 20;
      aplicarNivel((n) => ({ ...n, simbolos: n.simbolos.map((s) => (s.id === ar.id ? { ...s, x, y } : s)) }), op);
    } else if (ar.k === "camara-punta") {
      aplicarNivel(
        (n) => ({
          ...n,
          simbolos: n.simbolos.map((s) => {
            if (s.id !== ar.id || !s.camara) return s;
            const direccion = Math.round(((Math.atan2(raw.x - s.x, -(raw.y - s.y)) * 180) / Math.PI + 360) % 360);
            const alcance = Math.max(1, Math.round(dist(s, raw) * 10) / 10);
            return { ...s, camara: { ...s.camara, direccion, alcance } };
          }),
        }),
        op,
      );
    }
  };

  const alSubir = (e: ReactPointerEvent<SVGSVGElement>) => {
    punteros.current.delete(e.pointerId);
    if (pellizco.current) {
      if (punteros.current.size < 2) pellizco.current = null;
      arrastre.current = null;
      return;
    }
    const ar = arrastre.current;
    arrastre.current = null;
    if (!ar) return;
    if (ar.k === "colocar" && !ar.movio) colocar(aMundo(e.clientX, e.clientY));
    if ((ar.k === "abertura" || ar.k === "escalera" || ar.k === "simbolo") && !ar.movio && ar.coloca) colocar(aMundo(e.clientX, e.clientY));
    if ((ar.k === "vertice" || ar.k === "muro") && ar.movio) aplicarNivel(asentar, { fusionar: true });
  };

  const alDobleClic = () => {
    if (dibujaTramos(herramienta)) terminarCadena();
    if (herramienta === "ruta") terminarRuta();
  };

  const elegir = (h: HerramientaCroquis) => {
    terminarCadena();
    setRuta([]);
    setCursor(null);
    setHerramienta(h);
  };

  if (!nivel) return null;

  const boton = (h: HerramientaCroquis, etiqueta: string, icono: React.ReactNode, pegado = false) => (
    <button
      key={h}
      type="button"
      onClick={() => elegir(h)}
      aria-pressed={herramienta === h}
      className={`flex shrink-0 items-center gap-1.5 border px-3 py-2 text-[13px] font-medium ${pegado ? "rounded-l-md" : "rounded-md"} ${
        herramienta === h ? "border-pn-navy bg-pn-navy text-white" : "border-pn-borde bg-white text-pn-texto hover:bg-pn-calido"
      }`}
    >
      {icono}
      {etiqueta}
    </button>
  );

  /** Botón de herramienta con su lista de variantes (funciona igual con el dedo). */
  const botonConTipo = <T extends string>(
    h: HerramientaCroquis, etiqueta: string, icono: React.ReactNode, valor: T, opciones: readonly T[], etiquetas: Record<T, string>, cambiar: (v: T) => void, aria: string,
  ) => (
    <div key={h} className="flex shrink-0">
      {boton(h, etiqueta, icono, true)}
      <select
        aria-label={aria}
        value={valor}
        onChange={(e) => {
          cambiar(e.target.value as T);
          elegir(h);
        }}
        className={`-ml-px max-w-[11rem] rounded-r-md border px-1.5 text-[12.5px] ${herramienta === h ? "border-pn-navy bg-[#E8EEF6] text-pn-texto" : "border-pn-borde bg-white text-pn-sub"}`}
      >
        {opciones.map((o) => (
          <option key={o} value={o}>{etiquetas[o]}</option>
        ))}
      </select>
    </div>
  );

  const previo = dibujaTramos(herramienta) && cadena && cursor && dist(cadena, cursor.p) > 0.04 ? { desde: cadena, hasta: cursor.p } : null;
  const ultimaRuta = ruta[ruta.length - 1];

  return (
    <div className="flex flex-col gap-3 lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {boton("seleccionar", "Seleccionar", <MousePointer2 className="h-4 w-4" />)}
          {boton("muro", "Muro", <PenLine className="h-4 w-4" />)}
          {boton("divisoria", "Línea divisoria", <span aria-hidden className="block w-4 border-t-2 border-dashed border-current" />)}
          {botonConTipo<SubtipoPuerta>("puerta", "Puerta", <DoorOpen className="h-4 w-4" />, clasePuerta, SUBTIPOS_PUERTA, ETIQUETA_ABERTURA, setClasePuerta, "Tipo de puerta")}
          {boton("ventana", "Ventana", <AppWindow className="h-4 w-4" />)}
          {botonConTipo("escalera", "Escalera", <span className="text-[15px] leading-none">⌸</span>, tipoEscalera, TIPOS_ESCALERA, ETIQUETA_ESCALERA, setTipoEscalera, "Tipo de escalera, rampa o elevador")}
          {boton("ruta", "Ruta", <Route className="h-4 w-4" />)}
          {TIPOS_SIMBOLO.map((t) =>
            boton(`simbolo:${t}`, SIMBOLOS[t].etiqueta, (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full px-0.5 text-[9px] font-bold text-white" style={{ background: SIMBOLOS[t].color }}>
                {SIMBOLOS[t].glifo}
              </span>
            )),
          )}
        </div>

        <div ref={cajaRef} className="relative h-[62vh] min-h-[360px] overflow-hidden rounded-md border border-pn-borde bg-white lg:h-[calc(100dvh-300px)]">
          <svg
            ref={svgRef}
            className="absolute inset-0 h-full w-full touch-none select-none"
            viewBox={`${vista.x} ${vista.y} ${vista.w} ${alto}`}
            preserveAspectRatio="xMinYMin meet"
            onPointerDown={alBajar}
            onPointerMove={alMover}
            onPointerUp={alSubir}
            onPointerCancel={alSubir}
            onPointerLeave={() => !arrastre.current && setCursor(null)}
            onDoubleClick={alDobleClic}
            style={{ cursor: herramienta === "seleccionar" ? "default" : "crosshair" }}
            role="application"
            aria-label={`Croquis del nivel ${nivel.nombre}`}
          >
            <defs>
              <pattern id="rejilla-1m" width={1} height={1} patternUnits="userSpaceOnUse">
                <path d="M1 0H0V1" fill="none" stroke="#E7EAEE" strokeWidth={Math.max(0.005, 0.6 * esc)} />
              </pattern>
              <pattern id="rejilla-5m" width={5} height={5} patternUnits="userSpaceOnUse">
                <rect width={5} height={5} fill="url(#rejilla-1m)" />
                <path d="M5 0H0V5" fill="none" stroke="#D3D8DF" strokeWidth={Math.max(0.01, 1 * esc)} />
              </pattern>
              <marker id="flecha-ruta" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3" markerHeight="3" orient="auto-start-reverse">
                <path d="M0 0L10 5L0 10z" fill="#1B7F3B" />
              </marker>
            </defs>
            <rect x={vista.x} y={vista.y} width={vista.w} height={alto} fill={esc < 0.08 ? "url(#rejilla-5m)" : "#FFFFFF"} />

            <CroquisDibujo nivel={nivel} nombresNivel={nombresNivel} seleccion={seleccion} esc={esc} predio={predioNivel} mostrarVertices={herramienta === "seleccionar"} />

            {/* Tramo en curso */}
            {previo && (
              <g pointerEvents="none">
                {herramienta === "divisoria" ? (
                  <line x1={previo.desde.x} y1={previo.desde.y} x2={previo.hasta.x} y2={previo.hasta.y} stroke="#1D4ED8" strokeWidth={Math.max(0.015, 1.6 * esc)} strokeDasharray={`${7 * esc} ${4 * esc}`} />
                ) : (
                  <line x1={previo.desde.x} y1={previo.desde.y} x2={previo.hasta.x} y2={previo.hasta.y} stroke="#1D4ED8" strokeWidth={grosor} strokeOpacity={0.45} strokeLinecap="square" />
                )}
                <text x={(previo.desde.x + previo.hasta.x) / 2} y={(previo.desde.y + previo.hasta.y) / 2 - 10 * esc} fontSize={13 * esc} textAnchor="middle" fill="#1D4ED8" fontWeight={700}>
                  {dist(previo.desde, previo.hasta).toFixed(2)} m
                </text>
              </g>
            )}
            {herramienta === "ruta" && ruta.length > 0 && (
              <polyline points={[...ruta, ...(cursor ? [cursor.p] : [])].map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="#1B7F3B" strokeWidth={Math.max(0.08, 4 * esc)} strokeDasharray={`${6 * esc} ${4 * esc}`} pointerEvents="none" />
            )}
            {cursor?.linea && (
              <line x1={cursor.linea[0].x} y1={cursor.linea[0].y} x2={cursor.linea[1].x} y2={cursor.linea[1].y} stroke="#F59E0B" strokeWidth={Math.max(0.01, 1 * esc)} strokeDasharray={`${4 * esc} ${3 * esc}`} pointerEvents="none" />
            )}
            {cursor && (dibujaTramos(herramienta) || herramienta === "ruta") && (
              <circle cx={cursor.p.x} cy={cursor.p.y} r={5 * esc} fill={cursor.guia === "vertice" || cursor.guia === "muro" || cursor.guia === "predio" ? "#F59E0B" : "#1D4ED8"} pointerEvents="none" />
            )}
            {cadena && <circle cx={cadena.x} cy={cadena.y} r={5 * esc} fill="#1D4ED8" pointerEvents="none" />}
            {ultimaRuta && <circle cx={ultimaRuta.x} cy={ultimaRuta.y} r={5 * esc} fill="#1B7F3B" pointerEvents="none" />}
          </svg>

          {/* Controles sobre el lienzo */}
          <div className="absolute right-2 top-2 flex flex-col gap-1">
            {[
              { t: "Deshacer (Ctrl+Z)", i: <Undo2 className="h-4 w-4" />, f: hist.deshacer, ok: hist.puedeDeshacer },
              { t: "Rehacer (Ctrl+Y)", i: <Redo2 className="h-4 w-4" />, f: hist.rehacer, ok: hist.puedeRehacer },
              { t: "Acercar", i: <ZoomIn className="h-4 w-4" />, f: () => zoom(0.7), ok: true },
              { t: "Alejar", i: <ZoomOut className="h-4 w-4" />, f: () => zoom(1.4), ok: true },
              { t: "Encuadrar el nivel", i: <Maximize className="h-4 w-4" />, f: encuadrar, ok: true },
            ].map((b) => (
              <button key={b.t} type="button" title={b.t} aria-label={b.t} disabled={!b.ok} onClick={b.f} className="flex h-10 w-10 items-center justify-center rounded-md border border-pn-borde bg-white text-pn-texto shadow-sm disabled:opacity-40">
                {b.i}
              </button>
            ))}
          </div>

          {dibujaTramos(herramienta) && cadena && (
            <div className="absolute bottom-2 left-2 right-14 flex flex-wrap items-center gap-2 rounded-md border border-pn-borde bg-white/95 p-2 shadow-sm">
              <label className="flex items-center gap-1.5 text-[13px] text-pn-texto">
                Largo
                <input
                  ref={largoRef}
                  inputMode="decimal"
                  value={largo}
                  onChange={(e) => setLargo(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") colocarConLargo();
                    if (e.key === "Escape") terminarCadena();
                  }}
                  placeholder="m"
                  className="w-20 rounded border border-pn-borde px-2 py-1.5 text-[14px]"
                />
                m
              </label>
              <button type="button" onClick={colocarConLargo} className="rounded-md bg-pn-navy px-3 py-1.5 text-[13px] font-medium text-white">Poner tramo</button>
              <button type="button" onClick={terminarCadena} className="rounded-md border border-pn-borde px-3 py-1.5 text-[13px]">{herramienta === "divisoria" ? "Terminar línea" : "Terminar muro"}</button>
            </div>
          )}
          {herramienta === "ruta" && ruta.length > 0 && (
            <div className="absolute bottom-2 left-2 flex gap-2 rounded-md border border-pn-borde bg-white/95 p-2 shadow-sm">
              <button type="button" onClick={terminarRuta} className="rounded-md bg-[#1B7F3B] px-3 py-1.5 text-[13px] font-medium text-white">Terminar ruta</button>
              <button type="button" onClick={() => setRuta([])} className="rounded-md border border-pn-borde px-3 py-1.5 text-[13px]">Cancelar</button>
            </div>
          )}
          {aviso && (
            <div role="status" className="absolute left-1/2 top-2 max-w-[80%] -translate-x-1/2 rounded-md bg-pn-navy px-3 py-2 text-[13px] text-white shadow">
              {aviso}
            </div>
          )}
        </div>
        <p className="text-[12.5px] text-pn-sub">
          {herramienta.startsWith("simbolo:") ? `Toca dónde va: ${SIMBOLOS[herramienta.slice(8) as TipoSimbolo].etiqueta.toLowerCase()}.` : AYUDA[herramienta]}
        </p>
      </div>

      <aside className="w-full shrink-0 lg:w-[330px]">
        <CroquisPanel
          croquis={c}
          nivel={nivel}
          setNivelId={(id) => {
            setNivelId(id);
            setSeleccion(null);
            terminarCadena();
          }}
          seleccion={seleccion}
          setSeleccion={setSeleccion}
          aplicarNivel={aplicarNivel}
          aplicarCroquis={aplicarCroquis}
          borrarSeleccion={borrarSeleccion}
          grosor={grosor}
          setGrosor={setGrosor}
          angulos={angulos}
          setAngulos={setAngulos}
          conIman={conIman}
          setConIman={setConIman}
          giroLibre={giroLibre}
          setGiroLibre={setGiroLibre}
          predio={predioNivel}
        />
      </aside>
    </div>
  );
}
