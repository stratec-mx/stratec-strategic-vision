// Dibujo SVG de un nivel del croquis, en metros. Cada pieza lleva data-k y data-id
// para que el editor sepa qué se tocó.

import { memo } from "react";
import {
  claseAbertura, conoLocal, dist, escaleraAMundo, largoMuro, manijaGiro, medidasEscalera, polar, poligonoEspacio,
  posicionAbertura, puntoInterior, superficie, trazoEscalera,
  type Abertura, type Escalera, type Nivel, type P, type SimboloCroquis, type TipoEspacio,
} from "@/lib/plano/croquis";
import { COLOR_RUTA, CONDICION_INFO, SIMBOLOS } from "@/lib/plano/simbolos";

export type Seleccion = { k: "muro" | "vertice" | "abertura" | "espacio" | "escalera" | "simbolo" | "ruta"; id: string } | null;

const RELLENO: Record<TipoEspacio, string> = {
  oficina: "#E8EEF6", departamento: "#EEF2E6", estacionamiento: "#ECECEC", cajon_estacionamiento: "#E3E5E8", lobby: "#F6F0E4",
  bodega: "#F1ECE6", sanitarios: "#E6F1F3", cuarto_maquinas: "#F3E8E8", area_publico: "#F4EEDD", pasillo: "#F2F2F0",
  circulacion: "#F2F2F0", cocina: "#F5EDE6", otro: "#F4F5F7",
};

const AZUL = "#1D4ED8";
const TINTA = "#172333";

const fmt = (m: number) => m.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const mas = (p: P, v: P, k: number): P => ({ x: p.x + v.x * k, y: p.y + v.y * k });

/** Trazo de una flecha: el recorrido y una punta en el último punto. */
function trazoFlecha(pts: P[], cabeza: number): string {
  if (pts.length < 2) return "";
  const fin = pts[pts.length - 1];
  const prev = pts[pts.length - 2];
  const L = dist(prev, fin) || 1;
  const u = { x: (fin.x - prev.x) / L, y: (fin.y - prev.y) / L };
  const n = { x: -u.y, y: u.x };
  const base = mas(fin, u, -cabeza);
  const p1 = mas(base, n, cabeza / 2);
  const p2 = mas(base, n, -cabeza / 2);
  return `M${pts.map((p) => `${p.x} ${p.y}`).join(" L")} M${p1.x} ${p1.y} L${fin.x} ${fin.y} L${p2.x} ${p2.y}`;
}

/** Geometría de una abertura sobre su muro (o null si el muro ya no existe). */
function geometriaAbertura(n: Nivel, ab: Abertura) {
  const m = n.muros.find((w) => w.id === ab.muro);
  const c = posicionAbertura(n, ab);
  if (!m || !c) return null;
  const a = n.vertices.find((v) => v.id === m.a);
  const b = n.vertices.find((v) => v.id === m.b);
  if (!a || !b) return null;
  const L = dist(a, b) || 1;
  const u = { x: (b.x - a.x) / L, y: (b.y - a.y) / L };
  const nrm = { x: -u.y, y: u.x };
  const w = ab.ancho;
  return { m, c, u, nrm, w, j1: mas(c, u, -w / 2), j2: mas(c, u, w / 2) };
}

function AberturaSvg({ n, ab, sel, esc }: { n: Nivel; ab: Abertura; sel: boolean; esc: number }) {
  const g = geometriaAbertura(n, ab);
  if (!g) return null;
  const { m, c, nrm, w, j1, j2 } = g;
  const clase = claseAbertura(ab);
  const color = sel ? AZUL : TINTA;
  const porton = clase === "porton_corredizo" || clase === "porton_abatible";
  const trazo = porton ? Math.max(0.045, 2.4 * esc) : Math.max(0.03, 1.6 * esc);
  const fino = Math.max(0.01, 0.8 * esc);
  const punteado = `${4 * esc} ${3 * esc}`;
  const lado = ab.lado ?? 1;
  const [bis, otra] = ab.bisagra === "fin" ? [j2, j1] : [j1, j2];
  const hueco = <line x1={j1.x} y1={j1.y} x2={j2.x} y2={j2.y} stroke="#FFFFFF" strokeWidth={m.grosor + 0.03} />;

  /** Hoja abatible: abierta a 90° desde el pivote, con el arco hasta su posición cerrada. */
  const hoja = (pivote: P, cerrada: P, largo: number, key: string) => {
    const h = mas(pivote, nrm, lado * largo);
    const a1 = Math.atan2(h.y - pivote.y, h.x - pivote.x);
    const a2 = Math.atan2(cerrada.y - pivote.y, cerrada.x - pivote.x);
    let d = a2 - a1;
    while (d <= -Math.PI) d += 2 * Math.PI;
    while (d > Math.PI) d -= 2 * Math.PI;
    return (
      <g key={key}>
        <line x1={pivote.x} y1={pivote.y} x2={h.x} y2={h.y} stroke={color} strokeWidth={trazo} />
        <path d={`M${h.x} ${h.y} A${largo} ${largo} 0 0 ${d > 0 ? 1 : 0} ${cerrada.x} ${cerrada.y}`} fill="none" stroke={color} strokeWidth={fino} strokeDasharray={punteado} />
      </g>
    );
  };

  if (clase === "ventana") {
    const off = m.grosor / 3;
    return (
      <g pointerEvents="none">
        {hueco}
        {[-off, 0, off].map((o) => (
          <line key={o} x1={j1.x + nrm.x * o} y1={j1.y + nrm.y * o} x2={j2.x + nrm.x * o} y2={j2.y + nrm.y * o} stroke={color} strokeWidth={Math.max(0.015, 1 * esc)} />
        ))}
      </g>
    );
  }

  if (clase === "cortina") {
    return (
      <g pointerEvents="none">
        {hueco}
        <line x1={j1.x} y1={j1.y} x2={j2.x} y2={j2.y} stroke={color} strokeWidth={Math.max(0.06, 3.2 * esc)} strokeDasharray={`${5 * esc} ${3.5 * esc}`} />
      </g>
    );
  }

  if (clase === "corrediza" || clase === "porton_corredizo") {
    // La hoja va paralela al muro, del lado elegido; la flecha indica hacia dónde corre.
    const off = lado * (m.grosor / 2 + Math.max(0.03, 3 * esc));
    const h1 = mas(j1, nrm, off);
    const h2 = mas(j2, nrm, off);
    const haciaBis = { x: (bis.x - otra.x) / (w || 1), y: (bis.y - otra.y) / (w || 1) };
    const base = mas(c, nrm, off + lado * Math.max(0.12, 9 * esc));
    const largoFlecha = Math.min(w * 0.4, Math.max(0.3, 30 * esc));
    const desde = mas(base, haciaBis, -largoFlecha / 2);
    const hasta = mas(base, haciaBis, largoFlecha / 2);
    return (
      <g pointerEvents="none">
        {hueco}
        <line x1={h1.x} y1={h1.y} x2={h2.x} y2={h2.y} stroke={color} strokeWidth={trazo} />
        <path d={trazoFlecha([desde, hasta], Math.max(0.08, 6 * esc))} fill="none" stroke={color} strokeWidth={fino * 1.4} />
        {/* Tope del lado al que corre */}
        <line x1={bis.x} y1={bis.y} x2={mas(bis, nrm, off).x} y2={mas(bis, nrm, off).y} stroke={color} strokeWidth={fino} />
      </g>
    );
  }

  if (clase === "doble" || clase === "porton_abatible") {
    return (
      <g pointerEvents="none">
        {hueco}
        {hoja(j1, c, w / 2, "1")}
        {hoja(j2, c, w / 2, "2")}
      </g>
    );
  }

  return (
    <g pointerEvents="none">
      {hueco}
      {hoja(bis, otra, w, "1")}
    </g>
  );
}

/** Área de toque de una puerta o ventana: al menos 20 px, encima de muros y cotas. */
function ToqueAbertura({ n, ab, esc }: { n: Nivel; ab: Abertura; esc: number }) {
  const g = geometriaAbertura(n, ab);
  if (!g) return null;
  const extra = Math.min(g.w * 0.15, 4 * esc);
  const a = mas(g.j1, g.u, extra);
  const b = mas(g.j2, g.u, -extra);
  return (
    <line data-k="abertura" data-id={ab.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="transparent" strokeWidth={Math.max(g.m.grosor + 0.1, 20 * esc)} style={{ cursor: "move" }} />
  );
}

function EscaleraSvg({ s, sel, esc, destino }: { s: Escalera; sel: boolean; esc: number; destino?: string }) {
  const color = sel ? AZUL : TINTA;
  const tipo = s.tipo ?? "recta";
  const tr = trazoEscalera(s);
  const grueso = Math.max(0.02, 1.4 * esc);
  const { ancho, largo } = medidasEscalera(s);
  const fs = 11 * esc;
  // Las etiquetas no giran con la escalera: van abajo de la caja que ocupa ya girada.
  const g = (s.giro * Math.PI) / 180;
  const medioAlto = Math.abs((ancho / 2) * Math.sin(g)) + Math.abs((largo / 2) * Math.cos(g));
  const pie = { x: s.x, y: s.y + medioAlto + fs * 1.2 };
  const rumbo = `${s.sentido === "sube" ? "Sube" : "Baja"}${destino ? ` a ${destino}` : ""}`;
  const etiqueta =
    tipo === "elevador" ? (destino ? `Comunica con ${destino}` : "") : tipo === "rampa" ? `Rampa ${s.pendiente ?? 8} % · ${rumbo.toLowerCase()}` : rumbo;
  return (
    <g data-k="escalera" data-id={s.id} style={{ cursor: "move" }}>
      <g transform={`translate(${s.x} ${s.y}) rotate(${s.giro})`}>
        {tr.contornos.map((c, i) => (
          <polygon key={`c${i}`} points={c.map((p) => `${p.x},${p.y}`).join(" ")} fill={tipo === "rampa" ? "#F7F7F4" : "#FFFFFF"} stroke={color} strokeWidth={grueso} />
        ))}
        {tr.lineas.map(([a, b], i) => (
          <line key={`l${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={Math.max(0.008, (tipo === "elevador" ? 1 : 0.6) * esc)} pointerEvents="none" />
        ))}
        {tr.circulos.map((c, i) => (
          <circle key={`o${i}`} cx={c.c.x} cy={c.c.y} r={c.r} fill={color} pointerEvents="none" />
        ))}
        {tr.flecha.length > 1 && (
          <path d={trazoFlecha(tr.flecha, Math.min(0.35, Math.max(0.15, ancho / 4)))} fill="none" stroke={color} strokeWidth={grueso} strokeLinejoin="round" pointerEvents="none" />
        )}
      </g>
      {tipo === "elevador" && (
        <text x={s.x} y={s.y} dy="0.35em" textAnchor="middle" fontSize={fs} fontWeight={700} fill={color} stroke="#FFFFFF" strokeWidth={fs * 0.25} paintOrder="stroke" pointerEvents="none">
          Elevador
        </text>
      )}
      {etiqueta && (
        <text x={pie.x} y={pie.y} textAnchor="middle" fontSize={fs} fill={color} pointerEvents="none">
          {etiqueta}
        </text>
      )}
    </g>
  );
}

/** Manija para girar la escalera seleccionada: se arrastra con el ratón o con el dedo. */
function ManijaGiro({ s, esc }: { s: Escalera; esc: number }) {
  const h = manijaGiro(s, 22 * esc);
  const borde = escaleraAMundo(s, { x: 0, y: -medidasEscalera(s).largo / 2 });
  return (
    <g>
      <line x1={borde.x} y1={borde.y} x2={h.x} y2={h.y} stroke={AZUL} strokeWidth={Math.max(0.01, 1.2 * esc)} pointerEvents="none" />
      <circle cx={h.x} cy={h.y} r={9 * esc} fill="#FFFFFF" stroke={AZUL} strokeWidth={Math.max(0.02, 2 * esc)} pointerEvents="none" />
      <path
        d={`M${h.x - 4 * esc} ${h.y - 1 * esc} A${4 * esc} ${4 * esc} 0 1 1 ${h.x + 1 * esc} ${h.y + 4 * esc}`}
        fill="none"
        stroke={AZUL}
        strokeWidth={Math.max(0.01, 1.4 * esc)}
        pointerEvents="none"
      />
      {/* Área de toque amplia para el dedo. */}
      <circle data-k="escalera-giro" data-id={s.id} cx={h.x} cy={h.y} r={18 * esc} fill="transparent" style={{ cursor: "grab" }}>
        <title>Arrastra para girar</title>
      </circle>
    </g>
  );
}

function SimboloSvg({ s, sel, esc }: { s: SimboloCroquis; sel: boolean; esc: number }) {
  const def = SIMBOLOS[s.tipo];
  const r = Math.max(0.25, 10 * esc);
  return (
    <g>
      {s.camara && (
        <>
          <path d={conoLocal(s, s.camara.direccion, s.camara.angulo, s.camara.alcance)} fill={AZUL} fillOpacity={0.14} stroke={AZUL} strokeOpacity={0.6} strokeWidth={Math.max(0.01, 1 * esc)} pointerEvents="none" />
          {sel && (() => {
            const h = polar(s, s.camara.direccion, s.camara.alcance);
            return <circle data-k="camara-punta" data-id={s.id} cx={h.x} cy={h.y} r={Math.max(0.2, 8 * esc)} fill="#FFFFFF" stroke={AZUL} strokeWidth={Math.max(0.02, 2 * esc)} style={{ cursor: "grab" }} />;
          })()}
        </>
      )}
      <circle data-k="simbolo" data-id={s.id} cx={s.x} cy={s.y} r={r} fill={def.color} stroke={sel ? "#F59E0B" : s.condicion === "malo" || s.condicion === "no_funciona" ? CONDICION_INFO[s.condicion].color : "#FFFFFF"} strokeWidth={Math.max(0.03, (s.condicion === "malo" || s.condicion === "no_funciona" ? 3 : 2) * esc)} style={{ cursor: "move" }} />
      <text x={s.x} y={s.y} dy="0.35em" textAnchor="middle" fontSize={r * (def.glifo.length > 1 ? 0.8 : 1.1)} fontWeight={700} fill="#FFFFFF" pointerEvents="none">
        {def.glifo}
      </text>
    </g>
  );
}

interface Props {
  nivel: Nivel;
  nombresNivel: Record<string, string>;
  seleccion: Seleccion;
  /** Metros por píxel en pantalla (para que textos y trazos se vean del mismo tamaño). */
  esc: number;
  predio?: P[];
  mostrarVertices: boolean;
}

export const CroquisDibujo = memo(function CroquisDibujo({ nivel, nombresNivel, seleccion, esc, predio, mostrarVertices }: Props) {
  const es = (k: NonNullable<Seleccion>["k"], id: string) => seleccion?.k === k && seleccion.id === id;
  const fs = 12 * esc;
  const vs = new Map(nivel.vertices.map((v) => [v.id, v]));
  const escaleraSel = seleccion?.k === "escalera" ? nivel.escaleras.find((s) => s.id === seleccion.id) : undefined;
  return (
    <g>
      {predio && predio.length >= 3 && (
        <polygon points={predio.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="#7B7F42" strokeWidth={Math.max(0.03, 1.5 * esc)} strokeDasharray={`${8 * esc} ${5 * esc}`} pointerEvents="none" />
      )}

      {nivel.espacios.map((e) => {
        const pts = poligonoEspacio(nivel, e);
        if (pts.length < 3) return null;
        const c = puntoInterior(pts);
        const sel = es("espacio", e.id);
        return (
          <g key={e.id}>
            <polygon data-k="espacio" data-id={e.id} points={pts.map((p) => `${p.x},${p.y}`).join(" ")} fill={sel ? "#DBE7FB" : e.pendiente ? "#FFF4D6" : RELLENO[e.tipo] ?? RELLENO.otro} stroke="none" />
            <text x={c.x} y={c.y} textAnchor="middle" fontSize={fs} fill={TINTA} pointerEvents="none" fontWeight={600}>
              {e.nombre}
            </text>
            <text x={c.x} y={c.y + fs * 1.25} textAnchor="middle" fontSize={fs * 0.9} fill="#667085" pointerEvents="none">
              ≈ {fmt(superficie(pts))} m²
            </text>
          </g>
        );
      })}

      {nivel.rutas.map((r) => (
        <polyline
          key={r.id}
          data-k="ruta"
          data-id={r.id}
          points={r.puntos.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke={es("ruta", r.id) ? "#F59E0B" : COLOR_RUTA}
          strokeWidth={Math.max(0.08, 4 * esc)}
          strokeLinejoin="round"
          markerEnd="url(#flecha-ruta)"
          opacity={0.9}
        />
      ))}

      {nivel.muros.map((m) => {
        const a = vs.get(m.a);
        const b = vs.get(m.b);
        if (!a || !b) return null;
        const sel = es("muro", m.id);
        if (m.virtual) {
          // Línea divisoria: punteada y delgada, sin grosor físico.
          return (
            <line
              key={m.id}
              data-k="muro"
              data-id={m.id}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={sel ? AZUL : "#64748B"}
              strokeWidth={Math.max(0.015, (sel ? 2 : 1.4) * esc)}
              strokeDasharray={`${7 * esc} ${4 * esc}`}
              style={{ cursor: "move" }}
            />
          );
        }
        return (
          <line
            key={m.id}
            data-k="muro"
            data-id={m.id}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={sel ? AZUL : TINTA}
            strokeWidth={m.grosor}
            strokeLinecap="square"
            style={{ cursor: "move" }}
          />
        );
      })}
      {/* Área de toque más ancha que el muro, para el dedo. */}
      {nivel.muros.map((m) => {
        const a = vs.get(m.a);
        const b = vs.get(m.b);
        if (!a || !b) return null;
        return <line key={`t${m.id}`} data-k="muro" data-id={m.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="transparent" strokeWidth={Math.max(m.grosor, 16 * esc)} />;
      })}

      {nivel.aberturas.map((ab) => (
        <AberturaSvg key={ab.id} n={nivel} ab={ab} sel={es("abertura", ab.id)} esc={esc} />
      ))}

      {/* Cotas */}
      {nivel.muros.map((m) => {
        const a = vs.get(m.a);
        const b = vs.get(m.b);
        if (!a || !b) return null;
        const L = largoMuro(nivel, m);
        if (L < 30 * esc) return null;
        let ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
        if (ang > 90) ang -= 180;
        if (ang <= -90) ang += 180;
        const r = (ang * Math.PI) / 180;
        const off = m.grosor / 2 + fs * 0.4;
        const cx = (a.x + b.x) / 2 + Math.sin(r) * off;
        const cy = (a.y + b.y) / 2 - Math.cos(r) * off;
        return (
          <text key={`c${m.id}`} data-k="muro" data-id={m.id} x={cx} y={cy} fontSize={fs * 0.9} textAnchor="middle" fill={es("muro", m.id) ? AZUL : m.virtual ? "#8A94A3" : "#5E646E"} transform={`rotate(${ang} ${cx} ${cy})`} style={{ cursor: "pointer" }}>
            {fmt(L)}
          </text>
        );
      })}

      {/* Toque de puertas y ventanas: encima de muros y cotas, para poder arrastrarlas. */}
      {nivel.aberturas.map((ab) => (
        <ToqueAbertura key={`t${ab.id}`} n={nivel} ab={ab} esc={esc} />
      ))}

      {nivel.escaleras.map((s) => (
        <EscaleraSvg key={s.id} s={s} sel={es("escalera", s.id)} esc={esc} destino={s.nivelDestino ? nombresNivel[s.nivelDestino] : undefined} />
      ))}

      {nivel.simbolos.map((s) => (
        <SimboloSvg key={s.id} s={s} sel={es("simbolo", s.id)} esc={esc} />
      ))}

      {mostrarVertices &&
        nivel.vertices.map((v) => (
          <g key={v.id}>
            <circle cx={v.x} cy={v.y} r={Math.max(0.06, 6 * esc)} fill={es("vertice", v.id) ? AZUL : "#FFFFFF"} stroke={AZUL} strokeWidth={Math.max(0.015, 1.5 * esc)} pointerEvents="none" />
            <circle data-k="vertice" data-id={v.id} cx={v.x} cy={v.y} r={14 * esc} fill="transparent" style={{ cursor: "grab" }} />
          </g>
        ))}

      {escaleraSel && <ManijaGiro s={escaleraSel} esc={esc} />}
    </g>
  );
});
