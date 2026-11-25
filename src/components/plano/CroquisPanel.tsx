// Panel lateral del croquis: niveles, opciones de dibujo y propiedades de lo seleccionado.

import { useEffect, useState } from "react";
import { AlertTriangle, Copy, Plus, RotateCw, Trash2 } from "lucide-react";
import {
  ANCHO_PUERTA, cambiarAbertura, cambiarEscalera, cambiarEspacio, cambiarGrosor, fijarLargo, largoMuro, nivelVacio,
  poligonoEspacio, replicarNivel, seSaleDelPredio, superficie, TIPO_ESPACIO_ETIQUETA, TIPOS_ESPACIO,
  type Croquis, type Nivel, type P, type TipoEspacio,
} from "@/lib/plano/croquis";
import { LEYENDA_MEDIDAS } from "@/lib/plano/geo";
import { SIMBOLOS } from "@/lib/plano/simbolos";
import type { Seleccion } from "./CroquisDibujo";
import { FichaElemento } from "./FichaElemento";

const fmt = (m: number, d = 2) => m.toLocaleString("es-MX", { minimumFractionDigits: d, maximumFractionDigits: d });

const campo = "w-full rounded-md border border-pn-borde bg-white px-2.5 py-2 text-[14px] text-pn-texto";
const etiqueta = "mb-1 block text-[12px] font-medium text-pn-sub";
const tarjeta = "rounded-md border border-pn-borde bg-white p-3";

/** Campo numérico que se aplica al salir o con Enter (no a cada tecla). */
function Numero({ valor, onCambio, paso = 0.01, min, sufijo, etiquetaAria }: { valor: number; onCambio: (v: number) => void; paso?: number; min?: number; sufijo?: string; etiquetaAria: string }) {
  const [texto, setTexto] = useState(String(Math.round(valor * 100) / 100));
  useEffect(() => setTexto(String(Math.round(valor * 100) / 100)), [valor]);
  const aplicar = () => {
    const v = Number(texto.replace(",", "."));
    if (Number.isFinite(v) && (min === undefined || v >= min)) onCambio(v);
    else setTexto(String(Math.round(valor * 100) / 100));
  };
  return (
    <div className="flex items-center gap-1.5">
      <input
        aria-label={etiquetaAria}
        inputMode="decimal"
        step={paso}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={aplicar}
        onKeyDown={(e) => e.key === "Enter" && aplicar()}
        className={campo}
      />
      {sufijo && <span className="text-[13px] text-pn-sub">{sufijo}</span>}
    </div>
  );
}

interface Props {
  croquis: Croquis;
  nivel: Nivel;
  setNivelId: (id: string) => void;
  seleccion: Seleccion;
  setSeleccion: (s: Seleccion) => void;
  aplicarNivel: (f: (n: Nivel) => Nivel) => void;
  aplicarCroquis: (f: (c: Croquis) => Croquis) => void;
  borrarSeleccion: () => void;
  grosor: number;
  setGrosor: (g: number) => void;
  angulos: boolean;
  setAngulos: (v: boolean) => void;
  conIman: boolean;
  setConIman: (v: boolean) => void;
  predio?: P[];
}

export function CroquisPanel(p: Props) {
  const { croquis, nivel, seleccion, aplicarNivel, aplicarCroquis } = p;
  const niveles = [...croquis.niveles].sort((a, b) => b.nivelPiso - a.nivelPiso);
  const total = nivel.espacios.reduce((s, e) => s + superficie(poligonoEspacio(nivel, e)), 0);
  const fuera = p.predio ? seSaleDelPredio(nivel, p.predio) : false;

  const agregarNivel = () => {
    const tope = Math.max(...croquis.niveles.map((n) => n.nivelPiso + n.altura));
    const n = nivelVacio(`Nivel ${croquis.niveles.length}`, Math.round(tope * 100) / 100);
    aplicarCroquis((c) => ({ ...c, niveles: [...c.niveles, n] }));
    p.setNivelId(n.id);
  };
  const replicar = () => {
    const antes = new Set(croquis.niveles.map((n) => n.id));
    const tope = Math.round(Math.max(...croquis.niveles.map((n) => n.nivelPiso + n.altura)) * 100) / 100;
    const r = replicarNivel(croquis, nivel.id, `${nivel.nombre} (copia)`);
    const nuevo = r.niveles.find((n) => !antes.has(n.id))?.id;
    // La copia queda encima del nivel más alto.
    aplicarCroquis(() => ({ ...r, niveles: r.niveles.map((n) => (n.id === nuevo ? { ...n, nivelPiso: tope } : n)) }));
    if (nuevo) p.setNivelId(nuevo);
  };
  const borrarNivel = () => {
    if (croquis.niveles.length <= 1) return;
    const vacio = !nivel.muros.length && !nivel.simbolos.length && !nivel.escaleras.length;
    if (!vacio && !window.confirm(`¿Borrar el nivel “${nivel.nombre}” con todo su croquis?`)) return;
    const otro = croquis.niveles.find((n) => n.id !== nivel.id)!;
    aplicarCroquis((c) => ({
      ...c,
      niveles: c.niveles
        .filter((n) => n.id !== nivel.id)
        .map((n) => ({ ...n, escaleras: n.escaleras.map((s) => (s.nivelDestino === nivel.id ? { ...s, nivelDestino: undefined, enlace: undefined } : s)) })),
    }));
    p.setNivelId(otro.id);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Niveles */}
      <section className={tarjeta} aria-label="Niveles">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-pn-texto">Niveles</h3>
          <div className="flex gap-1">
            <button type="button" onClick={agregarNivel} className="flex items-center gap-1 rounded-md border border-pn-borde px-2 py-1.5 text-[12px]" title="Agregar nivel">
              <Plus className="h-3.5 w-3.5" /> Nivel
            </button>
            <button type="button" onClick={replicar} className="flex items-center gap-1 rounded-md border border-pn-borde px-2 py-1.5 text-[12px]" title="Copiar este nivel para pisos iguales">
              <Copy className="h-3.5 w-3.5" /> Replicar planta
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          {niveles.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => p.setNivelId(n.id)}
              className={`flex items-center justify-between rounded-md px-2.5 py-2 text-left text-[13px] ${n.id === nivel.id ? "bg-pn-navy text-white" : "bg-pn-calido text-pn-texto hover:bg-pn-fondo"}`}
            >
              <span className="font-medium">{n.nombre}</span>
              <span className={n.id === nivel.id ? "text-white/80" : "text-pn-sub"}>
                {n.nivelPiso >= 0 ? "+" : ""}
                {fmt(n.nivelPiso)} m
              </span>
            </button>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="col-span-2">
            <span className={etiqueta}>Nombre del nivel</span>
            <input value={nivel.nombre} onChange={(e) => aplicarNivel((n) => ({ ...n, nombre: e.target.value }))} className={campo} />
          </label>
          <label>
            <span className={etiqueta}>Nivel de piso</span>
            <Numero etiquetaAria="Nivel de piso en metros" valor={nivel.nivelPiso} onCambio={(v) => aplicarNivel((n) => ({ ...n, nivelPiso: v }))} sufijo="m" />
          </label>
          <label>
            <span className={etiqueta}>Altura</span>
            <Numero etiquetaAria="Altura del nivel en metros" valor={nivel.altura} min={1} onCambio={(v) => aplicarNivel((n) => ({ ...n, altura: v }))} sufijo="m" />
          </label>
        </div>
        {croquis.niveles.length > 1 && (
          <button type="button" onClick={borrarNivel} className="mt-2 flex items-center gap-1 text-[12px] text-pn-alerta">
            <Trash2 className="h-3.5 w-3.5" /> Borrar este nivel
          </button>
        )}
      </section>

      {fuera && (
        <div className="flex gap-2 rounded-md border border-[#F3C98B] bg-[#FFF7E8] p-3 text-[13px] text-[#7A4B00]" role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          El croquis de este nivel se sale del perímetro del predio. Revisa las medidas o el amarre.
        </div>
      )}

      {/* Lo seleccionado */}
      {seleccion && <Propiedades {...p} />}

      {/* Espacios */}
      <section className={tarjeta} aria-label="Espacios del nivel">
        <h3 className="mb-2 text-[13px] font-semibold text-pn-texto">Espacios de {nivel.nombre}</h3>
        {nivel.espacios.length === 0 ? (
          <p className="text-[13px] text-pn-sub">Todavía no hay espacios. Se forman solos cuando los muros cierran un recinto.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {nivel.espacios.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => p.setSeleccion({ k: "espacio", id: e.id })}
                  className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-[13px] ${seleccion?.k === "espacio" && seleccion.id === e.id ? "bg-[#DBE7FB]" : "hover:bg-pn-calido"}`}
                >
                  <span>
                    {e.nombre}
                    {e.pendiente && <span className="ml-1.5 rounded bg-[#FFF4D6] px-1.5 py-0.5 text-[11px] text-[#7A4B00]">sin nombre</span>}
                  </span>
                  <span className="tnum text-pn-sub">≈ {fmt(superficie(poligonoEspacio(nivel, e)))} m²</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {nivel.espacios.length > 0 && <p className="mt-2 border-t border-pn-borde pt-2 text-[13px] text-pn-texto">Total del nivel: ≈ {fmt(total)} m² (a ejes de muro)</p>}
      </section>

      {/* Opciones de dibujo */}
      <section className={tarjeta} aria-label="Opciones de dibujo">
        <h3 className="mb-2 text-[13px] font-semibold text-pn-texto">Opciones de dibujo</h3>
        <label className="mb-2 block">
          <span className={etiqueta}>Grosor de muros nuevos</span>
          <Numero etiquetaAria="Grosor de muros nuevos en centímetros" valor={p.grosor * 100} min={1} onCambio={(v) => p.setGrosor(v / 100)} sufijo="cm" />
        </label>
        <label className="flex items-center gap-2 py-1 text-[13px]">
          <input type="checkbox" checked={p.angulos} onChange={(e) => p.setAngulos(e.target.checked)} className="h-4 w-4" />
          Ángulos de 90° y 45°
        </label>
        <label className="flex items-center gap-2 py-1 text-[13px]">
          <input type="checkbox" checked={p.conIman} onChange={(e) => p.setConIman(e.target.checked)} className="h-4 w-4" />
          Imán (esquinas, muros, cuadrícula y predio)
        </label>
        <details className="mt-2">
          <summary className="cursor-pointer text-[13px] text-pn-texto">Amarre al predio</summary>
          <p className="my-2 text-[12px] text-pn-sub">Mueve o gira el croquis para que coincida con el perímetro del predio dibujado en el mapa (línea punteada).</p>
          <div className="grid grid-cols-3 gap-2">
            <label>
              <span className={etiqueta}>Este</span>
              <Numero etiquetaAria="Desplazamiento hacia el oriente" valor={nivel.amarre.x} onCambio={(v) => aplicarNivel((n) => ({ ...n, amarre: { ...n.amarre, x: v } }))} sufijo="m" />
            </label>
            <label>
              <span className={etiqueta}>Sur</span>
              <Numero etiquetaAria="Desplazamiento hacia el sur" valor={nivel.amarre.y} onCambio={(v) => aplicarNivel((n) => ({ ...n, amarre: { ...n.amarre, y: v } }))} sufijo="m" />
            </label>
            <label>
              <span className={etiqueta}>Giro</span>
              <Numero etiquetaAria="Giro en grados" valor={nivel.amarre.giro} onCambio={(v) => aplicarNivel((n) => ({ ...n, amarre: { ...n.amarre, giro: v } }))} sufijo="°" />
            </label>
          </div>
        </details>
      </section>

      <p className="text-[11.5px] leading-snug text-pn-sub">{LEYENDA_MEDIDAS}</p>
    </div>
  );
}

function Propiedades(p: Props) {
  const { nivel, seleccion, aplicarNivel, aplicarCroquis, croquis } = p;
  if (!seleccion) return null;
  const titulo = (t: string) => <h3 className="mb-2 text-[13px] font-semibold text-pn-texto">{t}</h3>;
  const borrar = (texto: string) => (
    <button type="button" onClick={p.borrarSeleccion} className="mt-3 flex items-center gap-1.5 rounded-md border border-[#F1C5C0] px-3 py-2 text-[13px] text-pn-alerta">
      <Trash2 className="h-4 w-4" /> {texto}
    </button>
  );
  const caja = (hijos: React.ReactNode) => <section className="rounded-md border-2 border-[#1D4ED8]/40 bg-white p-3" aria-label="Lo seleccionado">{hijos}</section>;

  if (seleccion.k === "muro") {
    const m = nivel.muros.find((w) => w.id === seleccion.id);
    if (!m) return null;
    return caja(
      <>
        {titulo("Muro")}
        <div className="grid grid-cols-2 gap-2">
          <label>
            <span className={etiqueta}>Largo (cota)</span>
            <Numero etiquetaAria="Largo del muro en metros" valor={largoMuro(nivel, m)} min={0.05} onCambio={(v) => aplicarNivel((n) => fijarLargo(n, m.id, v))} sufijo="m" />
          </label>
          <label>
            <span className={etiqueta}>Grosor</span>
            <Numero etiquetaAria="Grosor del muro en centímetros" valor={m.grosor * 100} min={1} onCambio={(v) => aplicarNivel((n) => cambiarGrosor(n, m.id, v / 100))} sufijo="cm" />
          </label>
        </div>
        <p className="mt-2 text-[12px] text-pn-sub">Al cambiar el largo se mueve la esquina y se ajustan los espacios que comparten el muro.</p>
        {borrar("Borrar muro")}
      </>,
    );
  }

  if (seleccion.k === "vertice") {
    return caja(
      <>
        {titulo("Esquina")}
        <p className="text-[13px] text-pn-sub">Arrástrala para mover los muros que llegan a ella.</p>
        {borrar("Borrar los muros de esta esquina")}
      </>,
    );
  }

  if (seleccion.k === "espacio") {
    const e = nivel.espacios.find((x) => x.id === seleccion.id);
    if (!e) return null;
    return caja(
      <>
        {titulo(e.pendiente ? "Espacio nuevo: ponle nombre y tipo" : "Espacio")}
        <label className="mb-2 block">
          <span className={etiqueta}>Nombre</span>
          <input
            value={e.nombre}
            onChange={(ev) => aplicarNivel((n) => cambiarEspacio(n, e.id, { nombre: ev.target.value }))}
            className={campo}
            autoFocus={e.pendiente}
          />
        </label>
        <label className="block">
          <span className={etiqueta}>Tipo</span>
          <select value={e.tipo} onChange={(ev) => aplicarNivel((n) => cambiarEspacio(n, e.id, { tipo: ev.target.value as TipoEspacio }))} className={campo}>
            {TIPOS_ESPACIO.map((t) => (
              <option key={t} value={t}>{TIPO_ESPACIO_ETIQUETA[t]}</option>
            ))}
          </select>
        </label>
        <p className="mt-2 text-[13px] text-pn-texto">Superficie: ≈ {fmt(superficie(poligonoEspacio(nivel, e)))} m²</p>
      </>,
    );
  }

  if (seleccion.k === "abertura") {
    const ab = nivel.aberturas.find((x) => x.id === seleccion.id);
    if (!ab) return null;
    return caja(
      <>
        {titulo(ab.tipo === "puerta" ? "Puerta" : "Ventana")}
        <label className="mb-2 block">
          <span className={etiqueta}>Ancho</span>
          <Numero etiquetaAria="Ancho en metros" valor={ab.ancho} min={0.3} onCambio={(v) => aplicarNivel((n) => cambiarAbertura(n, ab.id, { ancho: v }))} sufijo="m" />
        </label>
        {ab.tipo === "puerta" && (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => aplicarNivel((n) => cambiarAbertura(n, ab.id, { bisagra: ab.bisagra === "fin" ? "inicio" : "fin" }))} className="rounded-md border border-pn-borde px-3 py-2 text-[13px]">
              Cambiar bisagra
            </button>
            <button type="button" onClick={() => aplicarNivel((n) => cambiarAbertura(n, ab.id, { lado: ab.lado === -1 ? 1 : -1 }))} className="rounded-md border border-pn-borde px-3 py-2 text-[13px]">
              Abrir hacia el otro lado
            </button>
          </div>
        )}
        {ab.tipo === "ventana" && (
          <button type="button" onClick={() => aplicarNivel((n) => cambiarAbertura(n, ab.id, { tipo: "puerta", ancho: ANCHO_PUERTA, bisagra: "inicio", lado: 1 }))} className="rounded-md border border-pn-borde px-3 py-2 text-[13px]">
            Convertir en puerta
          </button>
        )}
        <p className="mt-2 text-[12px] text-pn-sub">Arrástrala a lo largo del muro o a otro muro.</p>
        {borrar(ab.tipo === "puerta" ? "Borrar puerta" : "Borrar ventana")}
      </>,
    );
  }

  if (seleccion.k === "escalera") {
    const s = nivel.escaleras.find((x) => x.id === seleccion.id);
    if (!s) return null;
    const cambiar = (c: Parameters<typeof cambiarEscalera>[3]) => aplicarCroquis((cc) => cambiarEscalera(cc, nivel.id, s.id, c));
    return caja(
      <>
        {titulo("Escalera")}
        <div className="grid grid-cols-2 gap-2">
          <label>
            <span className={etiqueta}>Sentido</span>
            <select value={s.sentido} onChange={(e) => cambiar({ sentido: e.target.value as "sube" | "baja" })} className={campo}>
              <option value="sube">Sube</option>
              <option value="baja">Baja</option>
            </select>
          </label>
          <label>
            <span className={etiqueta}>Llega a</span>
            <select value={s.nivelDestino ?? ""} onChange={(e) => cambiar({ nivelDestino: e.target.value })} className={campo}>
              <option value="">Sin elegir</option>
              {croquis.niveles.filter((n) => n.id !== nivel.id).map((n) => (
                <option key={n.id} value={n.id}>{n.nombre}</option>
              ))}
            </select>
          </label>
          <label>
            <span className={etiqueta}>Ancho</span>
            <Numero etiquetaAria="Ancho de la escalera" valor={s.ancho} min={0.5} onCambio={(v) => cambiar({ ancho: v })} sufijo="m" />
          </label>
          <label>
            <span className={etiqueta}>Largo</span>
            <Numero etiquetaAria="Largo de la escalera" valor={s.largo} min={0.5} onCambio={(v) => cambiar({ largo: v })} sufijo="m" />
          </label>
        </div>
        <button type="button" onClick={() => cambiar({ giro: (s.giro + 90) % 360 })} className="mt-2 flex items-center gap-1.5 rounded-md border border-pn-borde px-3 py-2 text-[13px]">
          <RotateCw className="h-4 w-4" /> Girar 90°
        </button>
        {s.nivelDestino && <p className="mt-2 text-[12px] text-pn-sub">También aparece en el nivel al que llega; si la mueves aquí, se mueve allá.</p>}
        {borrar("Borrar escalera")}
      </>,
    );
  }

  if (seleccion.k === "simbolo") {
    const s = nivel.simbolos.find((x) => x.id === seleccion.id);
    if (!s) return null;
    const cam = s.camara;
    const setCam = (c: Partial<NonNullable<typeof cam>>) =>
      aplicarNivel((n) => ({ ...n, simbolos: n.simbolos.map((x) => (x.id === s.id && x.camara ? { ...x, camara: { ...x.camara, ...c } } : x)) }));
    return caja(
      <>
        {titulo(SIMBOLOS[s.tipo].etiqueta)}
        {cam && (
          <div className="flex flex-col gap-2">
            <label>
              <span className={etiqueta}>Dirección: {cam.direccion}°</span>
              <input type="range" min={0} max={359} value={cam.direccion} onChange={(e) => setCam({ direccion: Number(e.target.value) })} className="w-full" />
            </label>
            <label>
              <span className={etiqueta}>Ángulo de visión: {cam.angulo}°</span>
              <input type="range" min={10} max={180} value={cam.angulo} onChange={(e) => setCam({ angulo: Number(e.target.value) })} className="w-full" />
            </label>
            <label>
              <span className={etiqueta}>Alcance: {cam.alcance} m</span>
              <input type="range" min={1} max={40} step={0.5} value={cam.alcance} onChange={(e) => setCam({ alcance: Number(e.target.value) })} className="w-full" />
            </label>
            <p className="text-[12px] text-pn-sub">También puedes arrastrar el punto blanco de la punta del cono.</p>
          </div>
        )}
        <div className="mt-2">
          <FichaElemento
            tipo={s.tipo}
            datos={s}
            cambiar={(c) => aplicarNivel((n) => ({ ...n, simbolos: n.simbolos.map((x) => (x.id === s.id ? { ...x, ...c } : x)) }))}
          />
        </div>
        {borrar("Borrar")}
      </>,
    );
  }

  if (seleccion.k === "ruta") {
    return caja(
      <>
        {titulo("Ruta de evacuación")}
        <p className="text-[13px] text-pn-sub">La flecha indica el sentido hacia la salida.</p>
        {borrar("Borrar ruta")}
      </>,
    );
  }
  return null;
}
