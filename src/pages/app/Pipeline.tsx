import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
const dealSchema = z.object({
    title: z.string().trim().min(2, "Título del acuerdo requerido").max(200),
    client_id: z.string().uuid("Cliente inválido").optional().or(z.literal("")),
    value: z.number().min(0, "El valor no puede ser negativo").optional(),
    stage: z.enum(["prospeccion", "diagnostico", "propuesta", "negociacion", "cierre"]),
    probability: z.number().min(0).max(100).optional(),
    expected_close: z.string().optional(),
    notes: z.string().trim().max(1000).optional(),
});


const STAGES = [
  { id: "prospeccion", label: "Prospección" },
  { id: "diagnostico", label: "Diagnóstico" },
  { id: "propuesta", label: "Propuesta" },
  { id: "negociacion", label: "Negociación" },
  { id: "cierre", label: "Cierre" },
] as const;

const Pipeline = () => {
  const { toast } = useToast();
  const [deals, setDeals] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  const load = async () => {
    const [{ data: d }, { data: c }] = await Promise.all([
      supabase.from("deals").select("*").order("position"),
      supabase.from("clients").select("id, name").order("name"),
    ]);
    setDeals(d ?? []);
    setClients(c ?? []);
  };
  useEffect(() => { load(); }, []);

  const onCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget)) as any;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("deals").insert({
      title: fd.title,
      client_id: fd.client_id || null,
      value_amount: Number(fd.value_amount || 0),
      currency: fd.currency || "USD",
      stage: fd.stage,
      owner_id: user?.id,
    });
        if (error) { toast({ title: "Error", description: "No se pudo registrar el acuerdo. Intenta de nuevo.", variant: "destructive" }); return; }
    setOpen(false);
    load();
  };

  const moveToStage = async (id: string, stage: string) => {
    await supabase.from("deals").update({ stage: stage as any }).eq("id", id);
    load();
  };

  return (
    <div>
      <PageHeader
        eyebrow="Pipeline comercial"
        title="Embudo de negociación"
        description="Seguimiento visual de oportunidades por etapa institucional."
        actions={
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button className="rounded-none bg-navy hover:bg-navy-deep text-smoke text-xs uppercase tracking-wider h-10"><Plus className="h-4 w-4 mr-1" /> Nueva oportunidad</Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
              <SheetHeader><SheetTitle className="font-display text-2xl text-navy font-light">Registrar oportunidad</SheetTitle></SheetHeader>
              <form onSubmit={onCreate} className="mt-6 space-y-4">
                <div className="space-y-2"><Label className="text-xs uppercase tracking-wider text-steel">Título</Label><Input name="title" required className="rounded-none h-11 border-border" /></div>
                <div className="space-y-2"><Label className="text-xs uppercase tracking-wider text-steel">Cliente</Label>
                  <Select name="client_id"><SelectTrigger className="rounded-none h-11 border-border"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label className="text-xs uppercase tracking-wider text-steel">Valor</Label><Input name="value_amount" type="number" min={0} step="0.01" className="rounded-none h-11 border-border" /></div>
                  <div className="space-y-2"><Label className="text-xs uppercase tracking-wider text-steel">Moneda</Label>
                    <Select name="currency" defaultValue="USD"><SelectTrigger className="rounded-none h-11 border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>{["USD","MXN","EUR"].map(c=> <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2"><Label className="text-xs uppercase tracking-wider text-steel">Etapa</Label>
                  <Select name="stage" defaultValue="prospeccion"><SelectTrigger className="rounded-none h-11 border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>{STAGES.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full rounded-none bg-navy hover:bg-navy-deep text-smoke text-xs uppercase tracking-wider h-11">Registrar</Button>
              </form>
            </SheetContent>
          </Sheet>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {STAGES.map((s) => {
          const col = deals.filter(d => d.stage === s.id);
          const total = col.reduce((a, d) => a + Number(d.value_amount), 0);
          return (
            <div
              key={s.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (dragId) { moveToStage(dragId, s.id); setDragId(null); } }}
              className="bg-card border border-border min-h-[60vh]"
            >
              <div className="px-4 py-3 border-b border-border bg-secondary/40">
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-[0.2em] text-navy font-medium">{s.label}</div>
                  <div className="text-xs text-steel font-mono">{col.length}</div>
                </div>
                <div className="mt-1 text-xs text-steel">${total.toLocaleString("en-US")}</div>
              </div>
              <div className="p-3 space-y-2">
                {col.map((d) => (
                  <motion.div
                    layout
                    key={d.id}
                    draggable
                    onDragStart={() => setDragId(d.id)}
                    className="border border-border bg-smoke p-3 cursor-grab hover:border-navy/40 hover:shadow-[var(--shadow-card)] transition"
                  >
                    <div className="text-sm text-navy">{d.title}</div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-steel font-mono">{d.currency} {Number(d.value_amount).toLocaleString("en-US")}</span>
                      <span className="text-olive">{d.probability}%</span>
                    </div>
                  </motion.div>
                ))}
                {col.length === 0 && <div className="text-xs text-steel/60 text-center py-6">—</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Pipeline;
