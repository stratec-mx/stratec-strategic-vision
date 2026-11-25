// Hallazgos del inmueble (Documento 04 F-09 y §13 D-P7). Se capturan rápido en campo y se
// completan después en cualquier equipo: teléfono, tableta o computadora.

import { AlertTriangle, CheckCircle2, MapPin, Trash2 } from "lucide-react";
import { SEVERIDAD_INFO, SEVERIDADES, type Hallazgo, type Inmueble, type Severidad } from "@/lib/plano/inmuebles";
import { defSimbolo } from "@/lib/plano/simbolos";
import type { LngLat } from "@/lib/plano/geo";
import { FotosElemento } from "./FotosElemento";

const campo = "w-full rounded-md border border-pn-borde bg-white px-2.5 py-2 text-[14px] text-pn-texto";
const etiqueta = "mb-1 block text-[12px] font-medium text-pn-sub";

interface Props {
  inm: Inmueble;
  cambiar: (f: (i: Inmueble) => Inmueble) => void;
  sel: string | null;
  setSel: (id: string | null) => void;
  marcando: boolean;
  setMarcando: (v: boolean) => void;
  volarA: (p: LngLat, zoom?: number) => void;
}

export function PanelHallazgos({ inm, cambiar, sel, setSel, marcando, setMarcando, volarA }: Props) {
  const hallazgos = inm.hallazgos ?? [];
  const cambiarH = (id: string, c: Partial<Hallazgo>) => cambiar((i) => ({ ...i, hallazgos: (i.hallazgos ?? []).map((h) => (h.id === id ? { ...h, ...c } : h)) }));
  const elementoDe = (h: Hallazgo) => inm.elementos.find((e) => e.id === h.elementoId);

  return (
    <section className="rounded-md border border-pn-borde bg-white p-3" aria-label="Hallazgos">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-pn-texto">5 · Hallazgos ({hallazgos.length})</h3>
        <button
          type="button"
          onClick={() => setMarcando(!marcando)}
          aria-pressed={marcando}
          className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[12.5px] font-medium ${marcando ? "bg-pn-alerta text-white" : "border border-pn-borde text-pn-texto"}`}
        >
          <AlertTriangle className="h-3.5 w-3.5" /> {marcando ? "Toca el mapa…" : "Marcar en el mapa"}
        </button>
      </div>
      <p className="mb-2 text-[12px] text-pn-sub">
        En campo basta foto, título y ubicación; lo demás se completa después en cualquier equipo. También se marca desde la ficha de un elemento.
        En la versión con base de datos solo se crean dentro de un diagnóstico abierto.
      </p>
      {hallazgos.length === 0 && <p className="text-[13px] text-pn-sub">Sin hallazgos todavía.</p>}
      <ul className="flex flex-col gap-1.5">
        {hallazgos.map((h) => {
          const abierto = sel === h.id;
          const el = elementoDe(h);
          return (
            <li key={h.id} className={`rounded-md border ${abierto ? "border-pn-alerta" : "border-pn-borde"}`}>
              <button type="button" onClick={() => setSel(abierto ? null : h.id)} className="flex w-full items-center gap-2 px-2.5 py-2 text-left" aria-expanded={abierto}>
                <span className="h-2.5 w-2.5 shrink-0 rotate-45" style={{ background: h.severidad ? SEVERIDAD_INFO[h.severidad].color : "#667085" }} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-pn-texto">{h.titulo || "Hallazgo sin título"}</span>
                  <span className="block text-[11.5px] text-pn-sub">
                    {h.estado === "propuesta" ? "Pendiente de revisión" : "Revisado"}
                    {el && ` · ${defSimbolo(el.tipo).etiqueta}`}
                    {h.fotos.length > 0 && ` · ${h.fotos.length} foto${h.fotos.length > 1 ? "s" : ""}`}
                  </span>
                </span>
              </button>
              {abierto && (
                <div className="flex flex-col gap-2 border-t border-pn-borde p-2.5">
                  <label>
                    <span className={etiqueta}>Título</span>
                    <input value={h.titulo} onChange={(e) => cambiarH(h.id, { titulo: e.target.value })} placeholder="Ej. Extintor vencido y obstruido" className={campo} autoFocus={!h.titulo} />
                  </label>
                  <FotosElemento fotos={h.fotos} cambiar={(fotos) => cambiarH(h.id, { fotos })} />
                  <div>
                    <span className={etiqueta}>Severidad</span>
                    <div className="grid grid-cols-4 gap-1" role="group" aria-label="Severidad">
                      {SEVERIDADES.map((s) => (
                        <button
                          key={s}
                          type="button"
                          aria-pressed={h.severidad === s}
                          onClick={() => cambiarH(h.id, { severidad: h.severidad === s ? undefined : (s as Severidad) })}
                          className="rounded-md border px-1 py-2 text-[12px] font-medium"
                          style={h.severidad === s ? { background: SEVERIDAD_INFO[s].color, borderColor: SEVERIDAD_INFO[s].color, color: "#fff" } : { borderColor: "#DCE1E6" }}
                        >
                          {SEVERIDAD_INFO[s].etiqueta}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label>
                    <span className={etiqueta}>Descripción</span>
                    <textarea value={h.descripcion ?? ""} onChange={(e) => cambiarH(h.id, { descripcion: e.target.value })} rows={3} className={campo} />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => cambiarH(h.id, { estado: h.estado === "revisado" ? "propuesta" : "revisado" })}
                      className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-[13px] font-medium ${h.estado === "revisado" ? "bg-pn-ok text-white" : "border border-pn-borde"}`}
                    >
                      <CheckCircle2 className="h-4 w-4" /> {h.estado === "revisado" ? "Revisado" : "Marcar como revisado"}
                    </button>
                    {h.lng !== undefined && h.lat !== undefined && (
                      <button type="button" onClick={() => volarA([h.lng!, h.lat!], 20)} className="flex items-center gap-1.5 rounded-md border border-pn-borde px-3 py-2 text-[13px]">
                        <MapPin className="h-4 w-4" /> Ver en el mapa
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (!window.confirm("¿Borrar este hallazgo?")) return;
                        cambiar((i) => ({ ...i, hallazgos: (i.hallazgos ?? []).filter((x) => x.id !== h.id) }));
                        setSel(null);
                      }}
                      className="flex items-center gap-1.5 rounded-md border border-[#F1C5C0] px-3 py-2 text-[13px] text-pn-alerta"
                    >
                      <Trash2 className="h-4 w-4" /> Borrar
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
