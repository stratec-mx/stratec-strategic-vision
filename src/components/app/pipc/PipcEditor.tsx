// Editor del Programa Interno de Protección Civil (plantilla PIPC-MOR) dentro de Documentos.
// PipcDatos: ejercicio, clasificación, variante, inmueble del plano y sugerencias de "No aplica".
// PipcBloque: un apartado de la guía con su "No aplica" y, si lleva lámina, lo que tomará del plano.

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Info, Map as MapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DocumentData, DocumentTemplate } from "@/lib/documentTemplates";
import type { Inmueble } from "@/lib/plano/inmuebles";
import {
  apartadosPipc, autoridad, CLASIFICACION_ETIQUETA, CONTENIDO_ETIQUETA, esCapitulo, letras, normalizePipc, OBLIG_ETIQUETA,
  pendientesPipc, PREGUNTAS_CONDICION, profundidad, soloAnexo, sugerenciasNoAplica, VARIANTE_ETIQUETA, visibleEnVariante,
  type Clasificacion, type CondicionesPipc, type PipcBlock, type PipcData, type SiNo, type Variante,
} from "@/lib/pipc/plantilla";

type Patch = (fn: (d: DocumentData) => DocumentData) => void;
type PlanoMod = typeof import("@/lib/pipc/planoPipc");

const label = "text-xs uppercase tracking-wider text-steel";

/** El módulo del plano trae el mapa (maplibre): se carga aparte, solo cuando hace falta. */
let planoPromesa: Promise<PlanoMod> | null = null;
function usePlano(): PlanoMod | null {
  const [mod, setMod] = useState<PlanoMod | null>(null);
  useEffect(() => {
    let vivo = true;
    planoPromesa ??= import("@/lib/pipc/planoPipc");
    planoPromesa.then((m) => vivo && setMod(m)).catch(() => undefined);
    return () => {
      vivo = false;
    };
  }, []);
  return mod;
}

const setPipc = (patch: Patch, fn: (p: PipcData) => PipcData) => patch((d) => ({ ...d, pipc: fn(normalizePipc(d.pipc)) }));

// ═══ Datos del Programa Interno ═══════════════════════════════════════════

export const PipcDatos = ({ template, data, patch }: { template: DocumentTemplate; data: DocumentData; patch: Patch }) => {
  const p = normalizePipc(data.pipc);
  const plano = usePlano();
  const inmuebles: Inmueble[] = useMemo(() => (plano ? plano.inmueblesDelNavegador() : []), [plano]);
  const inmuebleId = data.meta.inmuebleId;
  const vinculado = inmuebles.find((i) => i.id === inmuebleId);
  const sugerencias = sugerenciasNoAplica(p, template.blocks);
  const nSug = Object.keys(sugerencias).length;
  const pend = pendientesPipc(template, data);
  const capitulos = apartadosPipc(template.blocks).filter((b) => esCapitulo(b));
  const titulo = (code: string) => apartadosPipc(template.blocks).find((b) => b.code === code)?.title ?? code;

  const set = (fn: (x: PipcData) => PipcData) => setPipc(patch, fn);
  const setCond = (k: keyof CondicionesPipc, v: SiNo) => set((x) => ({ ...x, condiciones: { ...x.condiciones, [k]: v } }));

  return (
    <section className="border border-border bg-card">
      <header className="px-5 py-4 border-b border-border">
        <h2 className="font-display text-navy text-lg">Datos del Programa Interno</h2>
        <p className="text-xs text-steel mt-1">Formato de la CEPCM de Morelos. Los apartados que no aplican se conservan en el índice con «---» y su motivo.</p>
      </header>
      <div className="p-5 space-y-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label className={label}>Ejercicio</Label>
            <Input className="rounded-none" value={p.ejercicio} inputMode="numeric" onChange={(e) => set((x) => ({ ...x, ejercicio: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label className={label}>Clasificación (II.5.4)</Label>
            <Select value={p.clasificacion ?? "sin"} onValueChange={(v) => set((x) => ({ ...x, clasificacion: v === "sin" ? undefined : (v as Clasificacion) }))}>
              <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sin">Sin definir</SelectItem>
                {(Object.keys(CLASIFICACION_ETIQUETA) as Clasificacion[]).map((c) => <SelectItem key={c} value={c}>{CLASIFICACION_ETIQUETA[c]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className={label}>Variante</Label>
            <Select value={p.variante} onValueChange={(v) => set((x) => ({ ...x, variante: v as Variante, simulacrosMinimos: v === "institucional" ? x.simulacrosMinimos ?? 6 : x.simulacrosMinimos }))}>
              <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
              <SelectContent>{(Object.keys(VARIANTE_ETIQUETA) as Variante[]).map((v) => <SelectItem key={v} value={v}>{VARIANTE_ETIQUETA[v]}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {p.variante === "institucional" ? (
            <div className="space-y-2">
              <Label className={label}>Simulacros mínimos al año</Label>
              <Input type="number" min={1} className="rounded-none" value={p.simulacrosMinimos ?? ""} onChange={(e) => set((x) => ({ ...x, simulacrosMinimos: e.target.value ? Number(e.target.value) : undefined }))} />
            </div>
          ) : (
            <div className="space-y-2">
              <Label className={label}>Municipio (riesgo ordinario)</Label>
              <Input className="rounded-none" value={p.municipio ?? ""} placeholder="Cuernavaca" onChange={(e) => set((x) => ({ ...x, municipio: e.target.value }))} />
            </div>
          )}
        </div>
        {autoridad(p) && <p className="text-xs text-steel -mt-2">Se presenta ante: <b className="text-navy">{autoridad(p)}</b></p>}
        {p.variante === "institucional" && (
          <p className="text-xs text-steel -mt-2">Variante institucional: se agregan emergencia médica, incendio forestal o de pastizal y siniestros con póliza de seguro (III.1.6), y el número mínimo de simulacros (II.16).</p>
        )}

        {/* Inmueble del plano: se elige en "Inmueble del plano" de los datos generales (campo común a todas las plantillas) */}
        <div className="border border-border p-4 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-navy font-medium text-sm"><MapIcon className="h-4 w-4 text-olive" /> Láminas del plano</div>
            <Button asChild variant="outline" size="sm" className="rounded-none text-xs h-8">
              <Link to="/app/inmuebles">Abrir Inmuebles y plano</Link>
            </Button>
          </div>
          {!inmuebleId ? (
            <p className="text-xs text-steel">Elige el inmueble en «Inmueble del plano» (datos generales, arriba) para traer las láminas.</p>
          ) : plano && !vinculado ? (
            <p className="text-xs text-amber-700 flex gap-1.5"><AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />El inmueble no está en este navegador. Mientras el plano sea prototipo, las láminas solo salen en el equipo donde se capturó.</p>
          ) : (
            <p className="text-xs text-steel">{vinculado ? <b className="text-navy">{vinculado.nombre}. </b> : null}Las láminas salen dentro de I.8, I.9, I.10, II.7.1.1, II.7.2.1, II.8.1, II.8.2, II.9 y II.9.1, sin elementos de seguridad sensibles ni fotos con personas. Las medidas llevan la leyenda de aproximadas.</p>
          )}
        </div>

        {/* Preguntas para sugerir "No aplica" */}
        <div className="space-y-3">
          <div className={label}>¿Qué aplica a este establecimiento?</div>
          <div className="grid md:grid-cols-2 gap-x-6 gap-y-2">
            {PREGUNTAS_CONDICION.map(({ cond, pregunta }) => (
              <div key={cond} className="flex items-center justify-between gap-3 text-sm text-navy border-b border-border/60 py-1.5">
                <span>{pregunta}</span>
                <div className="flex shrink-0">
                  {([["si", "Sí"], ["no", "No"], [undefined, "—"]] as [SiNo, string][]).map(([v, t]) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setCond(cond, v)}
                      className={`h-7 w-9 text-xs border -ml-px ${p.condiciones[cond] === v ? "bg-navy text-smoke border-navy" : "border-border text-steel hover:bg-secondary"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {nSug > 0 && (
            <div className="border border-olive/40 bg-secondary/40 p-4 space-y-2">
              <div className="text-sm text-navy font-medium">Sugerencias de «No aplica» ({nSug})</div>
              <ul className="text-xs text-steel space-y-1">
                {Object.entries(sugerencias).map(([code, motivo]) => <li key={code}><b className="text-navy">{code}</b> {titulo(code)}: {motivo}</li>)}
              </ul>
              <Button type="button" size="sm" className="rounded-none bg-navy hover:bg-navy-deep text-smoke text-xs" onClick={() => set((x) => ({ ...x, noAplica: { ...x.noAplica, ...sugerencias } }))}>
                Marcar como «No aplica»
              </Button>
              <p className="text-[11px] text-steel">Es una sugerencia: confirma cada apartado. Puedes desmarcarlo en el propio apartado.</p>
            </div>
          )}
        </div>

        {/* Estado y navegación por capítulo */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-steel">
          <span>No aplica: <b className="text-navy">{pend.noAplica}</b></span>
          <span className={pend.sinMotivo.length ? "text-red-700" : ""}>Sin motivo: <b>{pend.sinMotivo.length}</b>{pend.sinMotivo.length ? ` (${pend.sinMotivo.map((b) => b.code).join(", ")})` : ""}</span>
          <span>Obligatorios por capturar: <b className="text-navy">{pend.vacios.length}</b></span>
        </div>
        <nav className="flex flex-wrap gap-1.5">
          {capitulos.map((c) => (
            <a key={c.code} href={`#pipc-${c.code}`} className="border border-border px-2.5 py-1 text-xs text-navy hover:bg-secondary">
              <span className="text-olive font-display mr-1">{c.code}</span>{c.title}
            </a>
          ))}
        </nav>
      </div>
    </section>
  );
};

// ═══ Un apartado ═══════════════════════════════════════════════════════════

export const PipcBloque = ({ block: b, data, patch }: { block: PipcBlock; data: DocumentData; patch: Patch }) => {
  const p = normalizePipc(data.pipc);
  const plano = usePlano();
  const inmueble = useMemo(() => (b.type === "plano" && plano ? plano.buscarInmueble(data.meta.inmuebleId) : undefined), [b.type, plano, data.meta.inmuebleId]);
  if (!visibleEnVariante(b, p)) return null;

  const depth = profundidad(b.code);
  const na = b.code in p.noAplica;
  const motivo = p.noAplica[b.code] ?? "";
  const setTexto = (v: string) => patch((d) => ({ ...d, sections: { ...d.sections, [b.key]: v } }));
  const setNa = (on: boolean) =>
    setPipc(patch, (x) => {
      const noAplica = { ...x.noAplica };
      if (on) noAplica[b.code] = noAplica[b.code] ?? "";
      else delete noAplica[b.code];
      return { ...x, noAplica };
    });
  const setMotivo = (v: string) => setPipc(patch, (x) => ({ ...x, noAplica: { ...x.noAplica, [b.code]: v } }));

  const capitulo = depth === 0;
  const encabezado = (
    <div className="flex items-baseline gap-3 min-w-0">
      <span className={`font-display text-olive shrink-0 ${capitulo ? "text-2xl" : depth === 1 ? "text-lg" : "text-sm"}`}>{b.code}</span>
      <h2 className={`font-display ${capitulo ? "text-smoke text-xl" : "text-navy"} ${depth === 1 ? "text-lg" : depth >= 2 ? "text-base" : ""}`}>{b.title}</h2>
    </div>
  );

  if (!b.contenido) {
    return capitulo ? (
      <div id={`pipc-${b.code}`} className="bg-navy px-5 py-4 scroll-mt-20 mt-10">{encabezado}{b.hint && <p className="text-xs text-smoke/70 mt-1">{b.hint}</p>}</div>
    ) : (
      <div className="pt-4 border-b border-navy/30 pb-2">{encabezado}</div>
    );
  }

  const chips = letras(b.contenido).map((l) => CONTENIDO_ETIQUETA[l]);
  const placeholder =
    b.type === "plano"
      ? "Nota opcional antes de la lámina."
      : soloAnexo(b)
        ? "Nota opcional. El documento se integra en la carpeta de anexos."
        : "Escribe aquí. Línea en blanco entre párrafos; «- » para viñetas; columnas separadas por «|» para tablas.";
  const filas = Math.min(10, Math.max(soloAnexo(b) || b.type === "plano" ? 2 : 4, (data.sections[b.key] ?? "").split("\n").length + 1));

  return (
    <section id={capitulo ? `pipc-${b.code}` : undefined} className={`border bg-card scroll-mt-20 ${na ? "border-dashed border-border opacity-80" : "border-border"} ${capitulo ? "mt-10" : ""} ${depth >= 2 ? "ml-4 sm:ml-8" : ""}`}>
      <header className={`px-5 py-3 flex flex-wrap items-start justify-between gap-3 ${capitulo ? "bg-navy" : "border-b border-border"}`}>
        <div className="min-w-0">
          {encabezado}
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {chips.map((c) => <span key={c} className="text-[10px] uppercase tracking-wider border border-border bg-secondary/60 px-1.5 py-0.5 text-steel">{c}</span>)}
            <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 ${b.oblig === "si" ? "text-navy" : "text-amber-700"}`}>
              {OBLIG_ETIQUETA[b.oblig]}{b.condicion ? `: ${b.condicion}` : ""}
            </span>
            {b.norma && <span className="text-[10px] font-mono text-steel px-1.5 py-0.5">{b.norma}</span>}
          </div>
        </div>
        <label className={`flex items-center gap-2 text-xs shrink-0 cursor-pointer ${capitulo ? "text-smoke" : "text-steel"}`}>
          <Checkbox checked={na} onCheckedChange={(v) => setNa(v === true)} aria-label={`${b.code} no aplica`} />
          No aplica
        </label>
      </header>
      <div className="p-4 space-y-3">
        {b.hint && !na && <p className="text-xs text-steel">{b.hint}</p>}
        {b.restriccion && (
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 flex gap-2">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span><b>Nota interna (no sale en el documento):</b> {b.restriccion}</span>
          </p>
        )}
        {na ? (
          <div className="space-y-1">
            <Input
              className={`rounded-none text-sm ${motivo.trim() ? "" : "border-red-400"}`}
              value={motivo}
              placeholder="Motivo (obligatorio), p. ej. «El establecimiento no cuenta con instalación de gas L.P.»"
              onChange={(e) => setMotivo(e.target.value)}
            />
            {!motivo.trim() && <p className="text-[11px] text-red-700">Escribe el motivo: lo ve el revisor y sale en el documento.</p>}
          </div>
        ) : (
          <>
            {b.type === "plano" && (
              <div className="text-xs border border-border bg-secondary/30 px-3 py-2 flex gap-2 text-navy">
                <MapIcon className="h-3.5 w-3.5 shrink-0 mt-0.5 text-olive" />
                {!data.meta.inmuebleId ? (
                  <span className="text-steel">Sin inmueble: elige uno en «Inmueble del plano» (datos generales) para traer la lámina.</span>
                ) : !plano ? (
                  <span className="text-steel">Cargando el plano…</span>
                ) : inmueble ? (
                  <span><b>{inmueble.nombre}:</b> {plano.resumenVista(inmueble, b.vista)}</span>
                ) : (
                  <span className="text-amber-700">El inmueble no está en este navegador: el PDF saldrá sin la lámina.</span>
                )}
              </div>
            )}
            {b.generado === "anexos" || b.generado === "bibliografia" ? (
              <p className="text-xs text-steel">Se genera al armar el PDF.</p>
            ) : null}
            {b.generado !== "anexos" && (
              <Textarea className="rounded-none text-sm leading-relaxed" rows={filas} value={data.sections[b.key] ?? ""} placeholder={placeholder} onChange={(e) => setTexto(e.target.value)} />
            )}
          </>
        )}
      </div>
    </section>
  );
};
