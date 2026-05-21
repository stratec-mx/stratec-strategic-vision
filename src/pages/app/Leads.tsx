import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Plus, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const schema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  organization: z.string().trim().max(150).optional().or(z.literal("")),
  role_title: z.string().trim().max(120).optional().or(z.literal("")),
  source: z.enum(["web","referral","event","outbound","partner","other"]),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

const Leads = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    let q = supabase.from("leads").select("*").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter as any);
    const { data } = await q;
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, [filter]);

  const onCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = schema.safeParse(fd);
    if (!parsed.success) { toast({ title: "Datos inválidos", description: parsed.error.issues[0].message, variant: "destructive" }); return; }
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("leads").insert({ ...parsed.data, owner_id: user?.id, status: "new" } as any);
    setBusy(false);
    if (error) { console.error("[Leads.insert]", error?.code ?? "error"); toast({ title: "Error", description: "No se pudo registrar el lead.", variant: "destructive" }); return; }
    toast({ title: "Lead registrado" });
    setOpen(false);
    load();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("leads").update({ status: status as any }).eq("id", id);
    load();
  };

  return (
    <div>
      <PageHeader
        eyebrow="Gestión comercial"
        title="Leads"
        description="Captación, calificación y conversión de oportunidades."
        actions={
          <>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-44 rounded-none h-10 border-border"><Filter className="h-3.5 w-3.5 mr-2" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="new">Nuevo</SelectItem>
                <SelectItem value="contacted">Contactado</SelectItem>
                <SelectItem value="qualified">Calificado</SelectItem>
                <SelectItem value="unqualified">Descartado</SelectItem>
                <SelectItem value="converted">Convertido</SelectItem>
              </SelectContent>
            </Select>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button className="rounded-none bg-navy hover:bg-navy-deep text-smoke text-xs uppercase tracking-wider h-10"><Plus className="h-4 w-4 mr-1" /> Nuevo lead</Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader><SheetTitle className="font-display text-2xl text-navy font-light">Registrar lead</SheetTitle></SheetHeader>
                <form onSubmit={onCreate} className="mt-6 space-y-4">
                  <Field name="full_name" label="Nombre completo" required />
                  <div className="grid grid-cols-2 gap-3">
                    <Field name="email" label="Correo" type="email" />
                    <Field name="phone" label="Teléfono" />
                  </div>
                  <Field name="organization" label="Organización" />
                  <Field name="role_title" label="Cargo" />
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-steel">Origen</Label>
                    <Select name="source" defaultValue="web">
                      <SelectTrigger className="rounded-none h-11 border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="web">Web</SelectItem>
                        <SelectItem value="referral">Referido</SelectItem>
                        <SelectItem value="event">Evento</SelectItem>
                        <SelectItem value="outbound">Outbound</SelectItem>
                        <SelectItem value="partner">Partner</SelectItem>
                        <SelectItem value="other">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-steel">Notas</Label>
                    <Textarea name="notes" rows={4} maxLength={2000} className="rounded-none border-border resize-none" />
                  </div>
                  <Button type="submit" disabled={busy} className="w-full rounded-none bg-navy hover:bg-navy-deep text-smoke text-xs uppercase tracking-wider h-11">{busy ? "Guardando…" : "Registrar"}</Button>
                </form>
              </SheetContent>
            </Sheet>
          </>
        }
      />

      <div className="border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 border-b border-border">
            <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-steel">
              <th className="py-3 px-4 font-medium">Nombre</th>
              <th className="py-3 px-4 font-medium">Correo</th>
              <th className="py-3 px-4 font-medium">Cargo</th>
              <th className="py-3 px-4 font-medium">Organización</th>
              <th className="py-3 px-4 font-medium">Origen</th>
              <th className="py-3 px-4 font-medium">Estado</th>
              <th className="py-3 px-4 font-medium">Score</th>
              <th className="py-3 px-4 font-medium">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-steel">Sin leads registrados.</td></tr>}
            {rows.map((l) => (
              <tr key={l.id} className="hover:bg-secondary/30 transition">
                <td className="py-3 px-4">
                  <div className="text-navy">{l.full_name}</div>
                  <div className="text-xs text-steel">{l.phone ?? "—"}</div>
                </td>
                <td className="py-3 px-4 text-steel">{l.email ?? "—"}</td>
                <td className="py-3 px-4 text-steel">{l.role_title ?? "—"}</td>
                <td className="py-3 px-4 text-steel">{l.organization ?? "—"}</td>
                <td className="py-3 px-4 text-steel uppercase text-xs tracking-wider">{l.source}</td>
                <td className="py-3 px-4">
                  <Select value={l.status} onValueChange={(v) => updateStatus(l.id, v)}>
                    <SelectTrigger className="h-7 rounded-none border-transparent bg-transparent p-0 [&>svg]:hidden"><StatusBadge status={l.status} /></SelectTrigger>
                    <SelectContent>
                      {["new","contacted","qualified","unqualified","converted"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </td>
                <td className="py-3 px-4 text-navy font-mono">{l.score}</td>
                <td className="py-3 px-4 text-steel text-xs whitespace-nowrap">
                  {new Date(l.created_at).toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Field = ({ name, label, type = "text", required = false }: { name: string; label: string; type?: string; required?: boolean }) => (
  <div className="space-y-2">
    <Label className="text-xs uppercase tracking-wider text-steel">{label}</Label>
    <Input name={name} type={type} required={required} className="rounded-none h-11 border-border" />
  </div>
);

export default Leads;
