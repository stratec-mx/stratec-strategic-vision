import { useState } from "react";
import { ChevronDown, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  GIROS, HAZMAT, RISK_LABEL, COMPLEXITIES, COMPLEXITY_LABEL, SCOPES, SCOPE_LABEL,
  type Classification, type ClientProfile, type Complexity, type GiroId, type HazmatId, type Scope,
} from "@/lib/pricing";

const RISK_TONE = {
  bajo: "bg-emerald-50 text-emerald-800 border-emerald-200",
  medio: "bg-amber-50 text-amber-800 border-amber-200",
  alto: "bg-orange-50 text-orange-800 border-orange-200",
  critico: "bg-red-50 text-red-800 border-red-200",
};
const NEUTRAL = "bg-background text-navy border-border";
const AUTO = "__auto__";

/** Clasificación del cliente para sugerir precios. Todo lo que muestra es interno. */
export const ClientClassifier = ({
  profile,
  onChange,
  result,
  alerts,
}: {
  profile: ClientProfile;
  onChange: (p: ClientProfile) => void;
  result: Classification;
  alerts: string[];
}) => {
  const [open, setOpen] = useState(true);
  const set = (patch: Partial<ClientProfile>) => onChange({ ...profile, ...patch });
  const num = (v: string) => Math.max(0, Number(v) || 0);

  return (
    <div className="border border-border bg-secondary/20">
      <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left">
        <span className="text-xs uppercase tracking-wider text-steel">Clasificación del cliente (interna)</span>
        <span className="flex items-center gap-2 flex-wrap justify-end">
          <span className={`text-[11px] px-2 py-0.5 border ${RISK_TONE[result.risk]}`} title="Informativo: no cambia el precio">{RISK_LABEL[result.risk]}</span>
          <span className={`text-[11px] px-2 py-0.5 border ${NEUTRAL}`} title="Define la tarifa">{COMPLEXITY_LABEL[result.complexity]}</span>
          <span className={`text-[11px] px-2 py-0.5 border ${NEUTRAL}`}>{SCOPE_LABEL[result.scope]}{result.sites > 1 ? ` · ${result.sites}` : ""}</span>
          <ChevronDown className={`h-4 w-4 text-steel transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1 col-span-2">
              <Label className="text-[10px] uppercase tracking-wider text-steel">Giro</Label>
              <Select value={profile.giro} onValueChange={(v) => set({ giro: v as GiroId })}>
                <SelectTrigger className="rounded-none bg-background h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{GIROS.map((g) => <SelectItem key={g.id} value={g.id}>{g.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-[10px] uppercase tracking-wider text-steel">Materiales peligrosos</Label>
              <Select value={profile.hazmat} onValueChange={(v) => set({ hazmat: v as HazmatId })}>
                <SelectTrigger className="rounded-none bg-background h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{HAZMAT.map((h) => <SelectItem key={h.id} value={h.id}>{h.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-steel" title="Del inmueble mayor">Superficie (m²)</Label>
              <Input type="number" min={0} className="rounded-none bg-background h-9" value={profile.area || ""} onChange={(e) => set({ area: num(e.target.value) })} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-steel" title="Trabajadores más visitantes al mismo tiempo, en el inmueble mayor">Personas</Label>
              <Input type="number" min={0} className="rounded-none bg-background h-9" value={profile.people || ""} onChange={(e) => set({ people: num(e.target.value) })} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-steel">Niveles</Label>
              <Input type="number" min={1} className="rounded-none bg-background h-9" value={profile.floors || ""} onChange={(e) => set({ floors: Math.max(1, num(e.target.value)) })} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-steel">Inmuebles</Label>
              <Input type="number" min={1} className="rounded-none bg-background h-9" value={profile.sites || ""} onChange={(e) => set({ sites: Math.max(1, num(e.target.value)) })} />
            </div>
          </div>
          <p className="text-[11px] text-steel -mt-2">Superficie y personas: las del inmueble mayor. Los demás inmuebles se cobran con el % por inmueble adicional de cada tarifa.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-steel">Alcance</Label>
              <Select value={profile.scope} onValueChange={(v) => set({ scope: v as Scope })}>
                <SelectTrigger className="rounded-none bg-background h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{SCOPES.map((s) => <SelectItem key={s} value={s}>{SCOPE_LABEL[s]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-steel">Complejidad (define la tarifa)</Label>
              <Select value={profile.complexity ?? AUTO} onValueChange={(v) => set({ complexity: v === AUTO ? null : (v as Complexity) })}>
                <SelectTrigger className="rounded-none bg-background h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={AUTO}>Sugerida: {COMPLEXITY_LABEL[result.complexitySuggested].replace("Complejidad ", "")}</SelectItem>
                  {COMPLEXITIES.map((c) => <SelectItem key={c} value={c}>{COMPLEXITY_LABEL[c]} (a mano)</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-navy">
            <input type="checkbox" checked={profile.morelos} onChange={(e) => set({ morelos: e.target.checked })} />
            El inmueble está en Morelos
          </label>

          <div className="text-[11px] text-steel space-y-0.5">
            <p><span className="text-navy">Riesgo ({result.riskPoints} pts, no cambia el precio):</span> {result.riskFactors.join(" · ") || "sin factores"}</p>
            <p><span className="text-navy">Complejidad ({result.complexityPoints} pts):</span> {result.complexityFactors.join(" · ") || "sin factores"}</p>
          </div>
          {alerts.map((a) => (
            <div key={a} className="flex gap-2 items-start text-[12px] text-amber-900 bg-amber-50 border border-amber-200 px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" /> {a}
            </div>
          ))}
          <p className="text-[11px] text-steel/80">Clasificación interna para tarificar y priorizar; no aparece en el PDF ni sustituye la clasificación oficial de la autoridad.</p>
        </div>
      )}
    </div>
  );
};
