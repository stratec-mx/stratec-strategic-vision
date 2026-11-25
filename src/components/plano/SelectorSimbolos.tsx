// Selector de elementos por categoría, con la opción de crear elementos propios.
// Lo usan el mapa exterior y el croquis interior.

import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { CATEGORIA_ETIQUETA, CATEGORIAS, defSimbolo, tiposDisponibles, type SimboloPersonal, type TipoSimbolo } from "@/lib/plano/simbolos";

const COLORES = ["#1D4ED8", "#5B21B6", "#C62828", "#1B7F3B", "#B45309", "#0F766E", "#334155"];

export const Glifo = ({ tipo, tam = 20 }: { tipo: TipoSimbolo; tam?: number }) => {
  const d = defSimbolo(tipo);
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full px-1 font-bold text-white"
      style={{ background: d.color, minWidth: tam, height: tam, fontSize: d.glifo.length > 1 ? tam * 0.45 : tam * 0.55 }}
      aria-hidden="true"
    >
      {d.glifo}
    </span>
  );
};

interface Props {
  activo: TipoSimbolo | null;
  elegir: (t: TipoSimbolo) => void;
  crear: (p: Omit<SimboloPersonal, "id">) => void;
}

export function SelectorSimbolos({ activo, elegir, crear }: Props) {
  const tipos = tiposDisponibles();
  const [abiertas, setAbiertas] = useState<Record<string, boolean>>({ proteccion_civil: true, acceso: true, seguridad: true, riesgo: true, personalizado: true });
  const [nuevo, setNuevo] = useState<{ etiqueta: string; glifo: string; color: string; sensible: boolean } | null>(null);

  return (
    <div className="flex flex-col gap-2">
      {CATEGORIAS.map((cat) => {
        const deCat = tipos.filter((t) => defSimbolo(t).categoria === cat);
        if (!deCat.length && cat !== "personalizado") return null;
        return (
          <div key={cat}>
            <button
              type="button"
              onClick={() => setAbiertas((a) => ({ ...a, [cat]: !a[cat] }))}
              className="flex w-full items-center justify-between py-1 text-left text-[12px] font-semibold uppercase tracking-wide text-pn-sub"
              aria-expanded={abiertas[cat]}
            >
              {CATEGORIA_ETIQUETA[cat]}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${abiertas[cat] ? "" : "-rotate-90"}`} />
            </button>
            {abiertas[cat] && (
              <div className="grid grid-cols-2 gap-1.5">
                {deCat.map((t) => {
                  const d = defSimbolo(t);
                  const sel = activo === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => elegir(t)}
                      aria-pressed={sel}
                      className={`flex items-center gap-1.5 rounded-md border px-2 py-2 text-left text-[12.5px] font-medium leading-tight ${
                        sel ? "border-pn-navy bg-pn-navy text-white" : "border-pn-borde bg-white text-pn-texto hover:bg-pn-calido"
                      }`}
                    >
                      <Glifo tipo={t} />
                      <span className="min-w-0">{d.etiqueta}</span>
                    </button>
                  );
                })}
                {cat === "personalizado" && !nuevo && (
                  <button
                    type="button"
                    onClick={() => setNuevo({ etiqueta: "", glifo: "", color: COLORES[0], sensible: true })}
                    className="col-span-2 flex items-center justify-center gap-1.5 rounded-md border border-dashed border-pn-acero px-2 py-2 text-[12.5px] text-pn-texto"
                  >
                    <Plus className="h-4 w-4" /> Crear un elemento
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {nuevo && (
        <form
          className="flex flex-col gap-2 rounded-md border border-pn-borde bg-pn-calido p-2.5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!nuevo.etiqueta.trim()) return;
            crear({ etiqueta: nuevo.etiqueta.trim(), glifo: (nuevo.glifo.trim() || nuevo.etiqueta.trim().slice(0, 2)).toUpperCase(), color: nuevo.color, sensible: nuevo.sensible });
            setNuevo(null);
          }}
        >
          <span className="text-[12.5px] font-semibold text-pn-texto">Elemento nuevo</span>
          <input
            autoFocus
            value={nuevo.etiqueta}
            onChange={(e) => setNuevo({ ...nuevo, etiqueta: e.target.value })}
            placeholder="Nombre (ej. Intercomunicador, Lector biométrico)"
            className="w-full rounded-md border border-pn-borde bg-white px-2.5 py-2 text-[14px]"
          />
          <div className="flex items-center gap-2">
            <input
              value={nuevo.glifo}
              maxLength={2}
              onChange={(e) => setNuevo({ ...nuevo, glifo: e.target.value })}
              placeholder="Letras"
              aria-label="Una o dos letras para el ícono"
              className="w-20 rounded-md border border-pn-borde bg-white px-2.5 py-2 text-[14px] uppercase"
            />
            <div className="flex flex-wrap gap-1" role="group" aria-label="Color">
              {COLORES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNuevo({ ...nuevo, color: c })}
                  aria-label={`Color ${c}`}
                  aria-pressed={nuevo.color === c}
                  className="h-6 w-6 rounded-full border-2"
                  style={{ background: c, borderColor: nuevo.color === c ? "#F59E0B" : "#fff" }}
                />
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-[12.5px]">
            <input type="checkbox" checked={nuevo.sensible} onChange={(e) => setNuevo({ ...nuevo, sensible: e.target.checked })} className="h-4 w-4" />
            Es información sensible (no sale en el Programa Interno)
          </label>
          <div className="flex gap-2">
            <button type="submit" className="rounded-md bg-pn-navy px-3 py-2 text-[13px] font-medium text-white">Guardar elemento</button>
            <button type="button" onClick={() => setNuevo(null)} className="rounded-md border border-pn-borde bg-white px-3 py-2 text-[13px]">Cancelar</button>
          </div>
        </form>
      )}
    </div>
  );
}
