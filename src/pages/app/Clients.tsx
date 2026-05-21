import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2).max(150),
  industry: z.string().trim().max(120).optional().or(z.literal("")),
  contact_name: z.string().trim().max(120).optional().or(z.literal("")),
  contact_email: z.string().trim().email().max(255).optional().or(z.literal("")),
  contact_phone: z.string().trim().max(40).optional().or(z.literal("")),
  country: z.string().trim().max(80).optional().or(z.literal("")),
});

const Clients = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const onCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = schema.safeParse(fd);
    if (!parsed.success) { toast({ title: "Datos inválidos", description: parsed.error.issues[0].message, variant: "destructive" }); return; }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("clients").insert({ ...parsed.data, owner_id: user?.id } as any);
    if (error) { console.error("[Clients.insert]", error?.code ?? "error"); toast({ title: "Error", description: "No se pudo registrar el cliente.", variant: "destructive" }); return; }
    toast({ title: "Cliente registrado" });
    setOpen(false);
    load();
  };

  return (
    <div>
      <PageHeader
        eyebrow="Cartera institucional"
        title="Clientes"
        description="Cartera activa de organizaciones bajo cobertura STRATEC."
        actions={
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button className="rounded-none bg-navy hover:bg-navy-deep text-smoke text-xs uppercase tracking-wider h-10"><Plus className="h-4 w-4 mr-1" /> Nuevo cliente</Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
              <SheetHeader><SheetTitle className="font-display text-2xl text-navy font-light">Registrar cliente</SheetTitle></SheetHeader>
              <form onSubmit={onCreate} className="mt-6 space-y-4">
                {[
                  ["name","Razón social",true],
                  ["industry","Sector",false],
                  ["contact_name","Contacto",false],
                  ["contact_email","Correo del contacto",false],
                  ["contact_phone","Teléfono",false],
                  ["country","País",false],
                ].map(([n,l,r]) => (
                  <div key={n as string} className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-steel">{l as string}</Label>
                    <Input name={n as string} required={r as boolean} className="rounded-none h-11 border-border" />
                  </div>
                ))}
                <Button type="submit" className="w-full rounded-none bg-navy hover:bg-navy-deep text-smoke text-xs uppercase tracking-wider h-11">Registrar</Button>
              </form>
            </SheetContent>
          </Sheet>
        }
      />

      <div className="border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 border-b border-border">
            <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-steel">
              <th className="py-3 px-4 font-medium">Organización</th>
              <th className="py-3 px-4 font-medium">Sector</th>
              <th className="py-3 px-4 font-medium">Contacto</th>
              <th className="py-3 px-4 font-medium">País</th>
              <th className="py-3 px-4 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-steel">Sin clientes registrados.</td></tr>}
            {rows.map((c) => (
              <tr key={c.id} className="hover:bg-secondary/30 transition">
                <td className="py-3 px-4 text-navy">{c.name}</td>
                <td className="py-3 px-4 text-steel">{c.industry ?? "—"}</td>
                <td className="py-3 px-4 text-steel">
                  <div>{c.contact_name ?? "—"}</div>
                  <div className="text-xs">{c.contact_email ?? ""}</div>
                </td>
                <td className="py-3 px-4 text-steel">{c.country ?? "—"}</td>
                <td className="py-3 px-4"><StatusBadge status={c.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Clients;
