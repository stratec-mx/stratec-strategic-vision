import { useEffect, useState } from "react";
import { Loader2, Tags } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { describeDbError } from "@/lib/dbErrors";
import { SERVICE_CATALOG } from "@/lib/quoteCatalog";
import { basisOf, type ServiceRate } from "@/lib/pricing";

type Row = { price_low: string; price_medium: string; price_high: string; extra_site_pct: string };
const toRow = (r?: ServiceRate): Row => ({
  price_low: r?.price_low != null ? String(r.price_low) : "",
  price_medium: r?.price_medium != null ? String(r.price_medium) : "",
  price_high: r?.price_high != null ? String(r.price_high) : "",
  extra_site_pct: r?.extra_site_pct != null ? String(r.extra_site_pct) : "50",
});
const toNum = (v: string) => (v.trim() === "" ? null : Math.max(0, Number(v) || 0));

/** Captura de tarifas por servicio y nivel. Los precios viven en Supabase, no en el código. */
export const RatesDialog = ({ rates, onSaved }: { rates: Record<string, ServiceRate>; onSaved: () => void }) => {
  const { toast } = useToast();
  const { user, can } = useAuth();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Record<string, Row>>({});
  const [saving, setSaving] = useState(false);
  const editable = can("quotes", "write");

  useEffect(() => {
    if (open) setRows(Object.fromEntries(SERVICE_CATALOG.map((s) => [s.code, toRow(rates[s.code])])));
  }, [open, rates]);

  const set = (code: string, patch: Partial<Row>) => setRows((r) => ({ ...r, [code]: { ...r[code], ...patch } }));

  const save = async () => {
    setSaving(true);
    const payload = Object.entries(rows)
      // Solo servicios con algún precio, o que ya tenían tarifa (para poder vaciarla)
      .filter(([code, r]) => r.price_low || r.price_medium || r.price_high || rates[code])
      .map(([code, r]) => ({
        code,
        price_low: toNum(r.price_low),
        price_medium: toNum(r.price_medium),
        price_high: toNum(r.price_high),
        // La base de datos acepta de 0 a 200 %
        extra_site_pct: Math.min(200, toNum(r.extra_site_pct) ?? 0),
        updated_at: new Date().toISOString(),
        updated_by: user?.id ?? null,
      }));
    if (payload.length === 0) {
      setSaving(false);
      setOpen(false);
      return;
    }
    const { error } = await supabase.from("service_rates").upsert(payload, { onConflict: "code" });
    setSaving(false);
    if (error) {
      const missing = error.code === "42P01" || error.code === "PGRST205";
      toast({
        title: "No se pudieron guardar las tarifas",
        description: missing ? "Falta ejecutar supabase/setup/03-tarifas.sql en Supabase (paso 2c del README)." : describeDbError(error, "Intenta de nuevo."),
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Tarifas guardadas", description: "Las cotizaciones nuevas ya usan estos precios." });
    onSaved();
    setOpen(false);
  };

  const cell = "rounded-none h-8 text-right text-sm bg-background";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-none text-xs uppercase tracking-wider h-10 border-navy text-navy">
          <Tags className="h-4 w-4 mr-2" /> Tarifas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto rounded-none">
        <DialogHeader>
          <DialogTitle className="font-display text-navy">Tarifas por servicio</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-steel -mt-2">
          Precio antes de IVA por nivel. Protección civil y dictamen usan el nivel de riesgo del cliente; los demás servicios, su tamaño.
          Deja vacío lo que no quieras sugerir. "% por inmueble" se suma por cada inmueble adicional.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-steel text-left">
                <th className="py-2 pr-2 font-normal">Servicio</th>
                <th className="py-2 px-1 font-normal text-right">Bajo / pequeña</th>
                <th className="py-2 px-1 font-normal text-right">Medio / mediana</th>
                <th className="py-2 px-1 font-normal text-right">Alto / grande</th>
                <th className="py-2 pl-1 font-normal text-right">% por inmueble</th>
              </tr>
            </thead>
            <tbody>
              {SERVICE_CATALOG.map((s) => {
                const r = rows[s.code] ?? toRow();
                return (
                  <tr key={s.code} className="border-t border-border">
                    <td className="py-2 pr-2">
                      <span className="font-mono text-[11px] text-olive mr-2">{s.code}</span>
                      <span className="text-navy">{s.title}</span>
                      <span className="block text-[10px] text-steel">Por {basisOf(s.code)}</span>
                    </td>
                    {(["price_low", "price_medium", "price_high"] as const).map((k) => (
                      <td key={k} className="py-2 px-1 w-32">
                        <Input type="number" min={0} disabled={!editable} className={cell} value={r[k]} onChange={(e) => set(s.code, { [k]: e.target.value })} />
                      </td>
                    ))}
                    <td className="py-2 pl-1 w-24">
                      <Input type="number" min={0} max={200} disabled={!editable} className={cell} value={r.extra_site_pct} onChange={(e) => set(s.code, { extra_site_pct: e.target.value })} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {editable && (
          <Button onClick={save} disabled={saving} className="rounded-none bg-navy hover:bg-navy-deep text-smoke uppercase tracking-wider text-xs h-11">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar tarifas"}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};
