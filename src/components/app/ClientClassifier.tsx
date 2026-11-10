import { useState } from "react";
import { ChevronDown, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GIROS, HAZMAT, RISK_LABEL, SIZE_LABEL, type Classification, type ClientProfile, type GiroId, type HazmatId } from "@/lib/pricing";

const LEVEL_TONE = { bajo: "bg-emerald-50 text-emerald-800 border-emerald-200", medio: "bg-amber-50 text-amber-800 border-amber-200", alto: "bg-red-50 text-red-800 border-red-200" };

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
        <span className="flex items-center gap-2">
          <span className={`text-[11px] px-2 py-0.5 border ${LEVEL_TONE[result.risk]}`}>{RISK_LABEL[result.risk]} · {result.riskPoints} pts</span>
          <span className={`text-[11px] px-2 py-0.5 border ${LEVEL_TONE[result.size]}`}>{SIZE_LABEL[result.size]}</span>
          <ChevronDown className={`h-4 w-4 text-steel transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
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
              <Label className="text-[10px] uppercase tracking-wider text-steel">Superficie (m²)</Label>
              <Input type="number" min={0} className="rounded-none bg-background h-9" value={profile.area || ""} onChange={(e) => set({ area: num(e.target.value) })} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-steel">Personas</Label>
              <Input type="number" min={0} className="rounded-none bg-background h-9" value={profile.people || ""} onChange={(e) => set({ people: num(e.target.value) })} title="Trabajadores más visitantes al mismo tiempo" />
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
          <label className="flex items-center gap-2 text-sm text-navy">
            <input type="checkbox" checked={profile.morelos} onChange={(e) => set({ morelos: e.target.checked })} />
            El inmueble está en Morelos
          </label>
          {result.factors.length > 0 && (
            <p className="text-[11px] text-steel">Suma de riesgo: {result.factors.join(" · ")}</p>
          )}
          {alerts.map((a) => (
            <div key={a} className="flex gap-2 items-start text-[12px] text-amber-900 bg-amber-50 border border-amber-200 px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" /> {a}
            </div>
          ))}
          <p className="text-[11px] text-steel/80">Clasificación interna para tarificar; no aparece en el PDF ni sustituye la clasificación oficial de la autoridad.</p>
        </div>
      )}
    </div>
  );
};
