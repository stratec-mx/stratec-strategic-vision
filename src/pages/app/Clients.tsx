import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Plus, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { describeDbError } from "@/lib/dbErrors";
import { useAuth } from "@/hooks/useAuth";
import { withClientContacts } from "@/lib/contacts";
import { SelectorResponsable, useUsuariosConRol } from "@/components/app/Responsable";
import { AsignacionesCliente, useHayAsignaciones } from "@/components/app/AsignacionesCliente";
import { nombreResponsable } from "@/lib/responsables";
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
  const { can, isAdmin } = useAuth();
  const showContact = can("contactos");
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const usuarios = useUsuariosConRol(isAdmin);
  const hayAsignaciones = useHayAsignaciones(isAdmin);
  const [asignando, setAsignando] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<{ id: string; name: string; owner_id?: string | null } | null>(null);

  const load = async () => {
    const { data } = await supabase.from("clients").select("id, name, industry, contact_name, country, status, notes, owner_id, created_at, updated_at").order("created_at", { ascending: false });
    setRows(showContact ? await withClientContacts(data ?? []) : data ?? []);
  };
  useEffect(() => { load(); }, [showContact]); // eslint-disable-line react-hooks/exhaustive-deps

  const onCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = schema.safeParse(fd);
    if (!parsed.success) { toast({ title: "Datos inválidos", description: parsed.error.issues[0].message, variant: "destructive" }); return; }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("clients").insert({ ...parsed.data, owner_id: user?.id } as any);
    if (error) { console.error("[Clients.insert]", error?.code ?? "error"); toast({ title: "No se pudo registrar el cliente", description: describeDbError(error, "Intenta de nuevo."), variant: "destructive" }); return; }
    toast({ title: "Cliente registrado" });
    setOpen(false);
    load();
  };

  // Responsable principal (clients.owner_id). Solo el admin; la base vuelve a revisar el permiso.
  const asignar = async (cliente: { id: string; name: string }, owner: string | null) => {
    setAsignando(cliente.id);
    const { data, error } = await supabase.from("clients").update({ owner_id: owner }).eq("id", cliente.id).select("id");
    setAsignando(null);
    if (error || !data?.length) {
      if (error) console.error("[Clients.asignar]", error.code ?? "error");
      toast({ title: "No se pudo asignar el cliente", description: error ? describeDbError(error, "Intenta de nuevo.") : "Tu usuario no tiene permiso para cambiar el responsable.", variant: "destructive" });
      return;
    }
    toast({ title: owner ? "Responsable asignado" : "Cliente sin responsable", description: `${cliente.name} · ${nombreResponsable(owner, usuarios)}` });
    setRows((rs) => rs.map((r) => (r.id === cliente.id ? { ...r, owner_id: owner } : r)));
  };
  const columnas = isAdmin ? 6 : 5;

  return (
    <div>
      <PageHeader
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

      <div className="border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 border-b border-border">
            <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-steel">
              <th className="py-3 px-4 font-medium">Organización</th>
              <th className="py-3 px-4 font-medium">Sector</th>
              <th className="py-3 px-4 font-medium">Contacto</th>
              <th className="py-3 px-4 font-medium">País</th>
              <th className="py-3 px-4 font-medium">Estado</th>
              {isAdmin && <th className="py-3 px-4 font-medium">Responsable</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 && <tr><td colSpan={columnas} className="text-center py-12 text-steel">Sin clientes registrados.</td></tr>}
            {rows.map((c) => (
              <tr key={c.id} className="hover:bg-secondary/30 transition">
                <td className="py-3 px-4 text-navy">{c.name}</td>
                <td className="py-3 px-4 text-steel">{c.industry ?? "—"}</td>
                <td className="py-3 px-4 text-steel">
                  <div>{c.contact_name ?? "—"}</div>
                  <div className="text-xs">{showContact ? c.contact_email ?? "" : "Contacto restringido"}</div>
                </td>
                <td className="py-3 px-4 text-steel">{c.country ?? "—"}</td>
                <td className="py-3 px-4"><StatusBadge status={c.status} /></td>
                {isAdmin && (
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <SelectorResponsable
                        valor={c.owner_id} usuarios={usuarios} disabled={asignando === c.id}
                        etiqueta={`Responsable de ${c.name}`} onCambio={(id) => asignar(c, id)}
                      />
                      {hayAsignaciones && (
                        <Button type="button" size="icon" variant="ghost" className="h-8 w-8 rounded-none"
                          onClick={() => setDetalle(c)} aria-label={`Personas asignadas a ${c.name}`} title="Personas asignadas">
                          <Users className="h-4 w-4 text-steel" />
                        </Button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isAdmin && hayAsignaciones && <AsignacionesCliente cliente={detalle} usuarios={usuarios} onClose={() => setDetalle(null)} />}
    </div>
  );
};

export default Clients;
