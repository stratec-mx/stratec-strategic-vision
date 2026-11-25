// Ficha de un elemento (Documento 04 §13, D-P6): estado de un toque, datos fijos según el tipo y nota.
// La usan el mapa exterior y el croquis interior.

import { AlertTriangle } from "lucide-react";
import {
  avisosElemento, CONDICION_INFO, CONDICIONES, FICHAS, SIMBOLOS,
  type Campo, type DatosElemento, type Ficha, type TipoSimbolo,
} from "@/lib/plano/simbolos";

const campo = "w-full rounded-md border border-pn-borde bg-white px-2.5 py-2 text-[14px] text-pn-texto";
const etiqueta = "mb-1 block text-[12px] font-medium text-pn-sub";

function CampoFicha({ c, valor, cambiar }: { c: Campo; valor: Ficha[string]; cambiar: (v: Ficha[string]) => void }) {
  if (c.tipo === "opcion") {
    return (
      <label className="block">
        <span className={etiqueta}>{c.etiqueta}</span>
        <select value={typeof valor === "string" ? valor : ""} onChange={(e) => cambiar(e.target.value || undefined)} className={campo}>
          <option value="">Elegir…</option>
          {c.opciones.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </label>
    );
  }
  if (c.tipo === "numero") {
    return (
      <label className="block">
        <span className={etiqueta}>{c.etiqueta}</span>
        <div className="flex items-center gap-1.5">
          <input
            inputMode="decimal"
            value={typeof valor === "number" ? String(valor) : ""}
            onChange={(e) => {
              const t = e.target.value.replace(",", ".");
              const n = Number(t);
              cambiar(t === "" ? undefined : Number.isFinite(n) ? n : valor);
            }}
            className={campo}
          />
          <span className="text-[13px] text-pn-sub">{c.unidad}</span>
        </div>
      </label>
    );
  }
  if (c.tipo === "fecha") {
    return (
      <label className="block">
        <span className={etiqueta}>{c.etiqueta}</span>
        <input type="date" value={typeof valor === "string" ? valor : ""} onChange={(e) => cambiar(e.target.value || undefined)} className={campo} />
      </label>
    );
  }
  return (
    <div>
      <span className={etiqueta}>{c.etiqueta}</span>
      <div className="flex gap-1.5">
        {([[true, "Sí"], [false, "No"]] as const).map(([v, t]) => (
          <button
            key={t}
            type="button"
            aria-pressed={valor === v}
            onClick={() => cambiar(valor === v ? undefined : v)}
            className={`flex-1 rounded-md border px-3 py-2 text-[13px] ${valor === v ? "border-pn-navy bg-pn-navy text-white" : "border-pn-borde bg-white text-pn-texto"}`}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

export function FichaElemento({ tipo, datos, cambiar }: { tipo: TipoSimbolo; datos: DatosElemento; cambiar: (c: Partial<DatosElemento>) => void }) {
  const campos = FICHAS[tipo] ?? [];
  const avisos = avisosElemento(tipo, datos, new Date());
  const ficha = datos.ficha ?? {};
  return (
    <div className="flex flex-col gap-2.5">
      <div>
        <span className={etiqueta}>Estado</span>
        <div className="grid grid-cols-4 gap-1" role="group" aria-label="Estado del elemento">
          {CONDICIONES.map((c) => {
            const activo = datos.condicion === c;
            return (
              <button
                key={c}
                type="button"
                aria-pressed={activo}
                onClick={() => cambiar({ condicion: activo ? undefined : c })}
                className="rounded-md border px-1 py-2 text-[12px] font-medium"
                style={activo ? { background: CONDICION_INFO[c].color, borderColor: CONDICION_INFO[c].color, color: "#fff" } : { borderColor: "#DCE1E6", color: "#172333" }}
              >
                {CONDICION_INFO[c].etiqueta}
              </button>
            );
          })}
        </div>
      </div>
      {campos.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {campos.map((c) => (
            <div key={c.clave} className={c.tipo === "opcion" && c.opciones.some((o) => o.length > 14) ? "col-span-2" : ""}>
              <CampoFicha c={c} valor={ficha[c.clave]} cambiar={(v) => cambiar({ ficha: { ...ficha, [c.clave]: v } })} />
            </div>
          ))}
        </div>
      )}
      <label className="block">
        <span className={etiqueta}>Nota</span>
        <input
          value={datos.nota ?? ""}
          onChange={(e) => cambiar({ nota: e.target.value })}
          placeholder={SIMBOLOS[tipo].sensible ? "Ubicación, marca o modelo" : "Observaciones"}
          className={campo}
        />
      </label>
      {avisos.length > 0 && (
        <p className="flex items-start gap-1.5 rounded-md bg-[#FDECEA] px-2.5 py-2 text-[12.5px] text-pn-alerta" role="alert">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {avisos.join(" · ")}
        </p>
      )}
    </div>
  );
}
