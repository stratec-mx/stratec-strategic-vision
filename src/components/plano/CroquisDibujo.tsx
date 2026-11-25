// Dibujo SVG de un nivel del croquis, en metros. Cada pieza lleva data-k y data-id
// para que el editor sepa qué se tocó.

import { memo } from "react";
import {
  conoLocal, dist, largoMuro, polar, poligonoEspacio, posicionAbertura, puntoInterior, superficie,
  type Abertura, type Escalera, type Nivel, type P, type SimboloCroquis, type TipoEspacio,
} from "@/lib/plano/croquis";
import { COLOR_RUTA, CONDICION_INFO, SIMBOLOS } from "@/lib/plano/simbolos";

export type Seleccion = { k: "muro" | "vertice" | "abertura" | "espacio" | "escalera" | "simbolo" | "ruta"; id: string } | null;

const RELLENO: Record<TipoEspacio, string> = {
  oficina: "#E8EEF6", departamento: "#EEF2E6", estacionamiento: "#ECECEC", lobby: "#F6F0E4", bodega: "#F1ECE6",
  sanitarios: "#E6F1F3", cuarto_maquinas: "#F3E8E8", area_publico: "#F4EEDD", circulacion: "#F2F2F0", cocina: "#F5EDE6", otro: "#F4F5F7",
};

const fmt = (m: number) => m.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Puerta({ n, ab, sel, esc }: { n: Nivel; ab: Abertura; sel: boolean; esc: number }) {
  const m = n.muros.find((w) => w.id === ab.muro);
  const c = posicionAbertura(n, ab);
  if (!m || !c) return null;
  const a = n.vertices.find((v) => v.id === m.a)!;
  const b = n.vertices.find((v) => v.id === m.b)!;
  const L = dist(a, b) || 1;
  const u = { x: (b.x - a.x) / L, y: (b.y - a.y) / L };
  const nrm = { x: -u.y, y: u.x };
  const w = ab.ancho;
  const j1 = { x: c.x - (u.x * w) / 2, y: c.y - (u.y * w) / 2 };
  const j2 = { x: c.x + (u.x * w) / 2, y: c.y + (u.y * w) / 2 };
  const color = sel ? "#1D4ED8" : "#172333";
  const hueco = <line x1={j1.x} y1={j1.y} x2={j2.x} y2={j2.y} stroke="#FFFFFF" strokeWidth={m.grosor + 0.03} />;
  const toque = (
    <line data-k="abertura" data-id={ab.id} x1={j1.x} y1={j1.y} x2={j2.x} y2={j2.y} stroke="transparent" strokeWidth={Math.max(m.grosor, 14 * esc)} style={{ cursor: "move" }} />
  );
  if (ab.tipo === "ventana") {
    const off = m.grosor / 3;
    return (
      <g>
        {hueco}
        {[-off, 0, off].map((o) => (
          <line key={o} x1={j1.x + nrm.x * o} y1={j1.y + nrm.y * o} x2={j2.x + nrm.x * o} y2={j2.y + nrm.y * o} stroke={color} strokeWidth={Math.max(0.015, 1 * esc)} />
        ))}
        {toque}
      </g>
    );
  }
  const [bis, otra] = ab.bisagra === "fin" ? [j2, j1] : [j1, j2];
  const lado = ab.lado ?? 1;
  const hoja = { x: bis.x + nrm.x * lado * w, y: bis.y + nrm.y * lado * w };
  const a1 = Math.atan2(hoja.y - bis.y, hoja.x - bis.x);
  const a2 = Math.atan2(otra.y - bis.y, otra.x - bis.x);
  let d = a2 - a1;
  while (d <= -Math.PI) d += 2 * Math.PI;
  while (d > Math.PI) d -= 2 * Math.PI;
  return (
    <g>
      {hueco}
      <line x1={bis.x} y1={bis.y} x2={hoja.x} y2={hoja.y} stroke={color} strokeWidth={Math.max(0.03, 1.6 * esc)} />
      <path d={`M${hoja.x} ${hoja.y} A${w} ${w} 0 0 ${d > 0 ? 1 : 0} ${otra.x} ${otra.y}`} fill="none" stroke={color} strokeWidth={Math.max(0.01, 0.8 * esc)} strokeDasharray={`${4 * esc} ${3 * esc}`} />
      {toque}
    </g>
  );
}

function EscaleraSvg({ s, sel, esc, destino }: { s: Escalera; sel: boolean; esc: number; destino?: string }) {
  const color = sel ? "#1D4ED8" : "#172333";
  const huellas: number[] = [];
  for (let y = -s.largo / 2 + 0.28; y < s.largo / 2 - 0.05; y += 0.28) huellas.push(y);
  const sube = s.sentido === "sube";
  const y0 = s.largo / 2 - 0.25;
  const y1 = -s.largo / 2 + 0.25;
  const [desde, hasta] = sube ? [y0, y1] : [y1, y0];
  const cabeza = Math.min(0.35, s.ancho / 3);
  const dir = sube ? 1 : -1;
  const fs = 11 * esc;
  return (
    <g transform={`translate(${s.x} ${s.y}) rotate(${s.giro})`} data-k="escalera" data-id={s.id} style={{ cursor: "move" }}>
      <rect x={-s.ancho / 2} y={-s.largo / 2} width={s.ancho} height={s.largo} fill="#FFFFFF" stroke={color} strokeWidth={Math.max(0.02, 1.4 * esc)} data-k="escalera" data-id={s.id} />
      {huellas.map((y) => (
        <line key={y} x1={-s.ancho / 2} y1={y} x2={s.ancho / 2} y2={y} stroke={color} strokeWidth={Math.max(0.008, 0.6 * esc)} pointerEvents="none" />
      ))}
      <line x1={0} y1={desde} x2={0} y2={hasta} stroke={color} strokeWidth={Math.max(0.02, 1.4 * esc)} pointerEvents="none" />
      <path d={`M${-cabeza / 2} ${hasta + dir * cabeza} L0 ${hasta} L${cabeza / 2} ${hasta + dir * cabeza}`} fill="none" stroke={color} strokeWidth={Math.max(0.02, 1.4 * esc)} pointerEvents="none" />
      <text x={0} y={s.largo / 2 + fs * 1.2} textAnchor="middle" fontSize={fs} fill={color} pointerEvents="none">
        {sube ? "Sube" : "Baja"}{destino ? ` a ${destino}` : ""}
      </text>
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
          <path d={conoLocal(s, s.camara.direccion, s.camara.angulo, s.camara.alcance)} fill="#1D4ED8" fillOpacity={0.14} stroke="#1D4ED8" strokeOpacity={0.6} strokeWidth={Math.max(0.01, 1 * esc)} pointerEvents="none" />
          {sel && (() => {
            const h = polar(s, s.camara.direccion, s.camara.alcance);
            return <circle data-k="camara-punta" data-id={s.id} cx={h.x} cy={h.y} r={Math.max(0.2, 8 * esc)} fill="#FFFFFF" stroke="#1D4ED8" strokeWidth={Math.max(0.02, 2 * esc)} style={{ cursor: "grab" }} />;
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
            <polygon data-k="espacio" data-id={e.id} points={pts.map((p) => `${p.x},${p.y}`).join(" ")} fill={sel ? "#DBE7FB" : e.pendiente ? "#FFF4D6" : RELLENO[e.tipo]} stroke="none" />
            <text x={c.x} y={c.y} textAnchor="middle" fontSize={fs} fill="#172333" pointerEvents="none" fontWeight={600}>
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
        return (
          <line
            key={m.id}
            data-k="muro"
            data-id={m.id}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={es("muro", m.id) ? "#1D4ED8" : "#172333"}
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
        <Puerta key={ab.id} n={nivel} ab={ab} sel={es("abertura", ab.id)} esc={esc} />
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
          <text key={`c${m.id}`} data-k="muro" data-id={m.id} x={cx} y={cy} fontSize={fs * 0.9} textAnchor="middle" fill={es("muro", m.id) ? "#1D4ED8" : "#5E646E"} transform={`rotate(${ang} ${cx} ${cy})`} style={{ cursor: "pointer" }}>
            {fmt(L)}
          </text>
        );
      })}

      {nivel.escaleras.map((s) => (
        <EscaleraSvg key={s.id} s={s} sel={es("escalera", s.id)} esc={esc} destino={s.nivelDestino ? nombresNivel[s.nivelDestino] : undefined} />
      ))}

      {nivel.simbolos.map((s) => (
        <SimboloSvg key={s.id} s={s} sel={es("simbolo", s.id)} esc={esc} />
      ))}

      {mostrarVertices &&
        nivel.vertices.map((v) => (
          <g key={v.id}>
            <circle cx={v.x} cy={v.y} r={Math.max(0.06, 6 * esc)} fill={es("vertice", v.id) ? "#1D4ED8" : "#FFFFFF"} stroke="#1D4ED8" strokeWidth={Math.max(0.015, 1.5 * esc)} pointerEvents="none" />
            <circle data-k="vertice" data-id={v.id} cx={v.x} cy={v.y} r={14 * esc} fill="transparent" style={{ cursor: "grab" }} />
          </g>
        ))}
    </g>
  );
});
