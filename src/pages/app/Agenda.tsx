import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Plus, CalendarDays, Clock, MapPin, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Agenda = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [list, setList] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", attendee_name: "", attendee_email: "", organization: "",
    starts_at: "", ends_at: "", location: "", notes: "",
  });

  const load = async () => {
    const { data } = await supabase.from("appointments").select("*").order("starts_at", { ascending: true });
    setList(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.title || !form.starts_at || !form.ends_at) {
      toast({ title: "Datos requeridos", description: "Título e intervalo de fechas.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("appointments").insert({
      title: form.title,
      attendee_name: form.attendee_name || null,
      attendee_email: form.attendee_email || null,
      organization: form.organization || null,
      starts_at: form.starts_at,
      ends_at: form.ends_at,
      location: form.location || null,
      notes: form.notes || null,
      owner_id: user?.id,
    });
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Cita registrada", description: form.title });
    setOpen(false);
    setForm({ title: "", attendee_name: "", attendee_email: "", organization: "", starts_at: "", ends_at: "", location: "", notes: "" });
    load();
  };

  const now = Date.now();
  const upcoming = list.filter(a => new Date(a.starts_at).getTime() >= now);
  const past = list.filter(a => new Date(a.starts_at).getTime() < now);

  const Card = ({ a, dim = false }: { a: any; dim?: boolean }) => {
    const start = new Date(a.starts_at);
    const end = new Date(a.ends_at);
    return (
      <div className={`border border-border bg-card p-5 ${dim ? "opacity-60" : ""}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wider text-olive">
              {start.toLocaleDateString("es", { weekday: "short", day: "2-digit", month: "short" })}
            </div>
            <div className="font-display text-lg text-navy mt-1 truncate">{a.title}</div>
            <div className="mt-3 space-y-1.5 text-sm text-steel">
              <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" />{start.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })} – {end.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}</div>
              {a.attendee_name && <div className="flex items-center gap-2"><User className="h-3.5 w-3.5" />{a.attendee_name}{a.organization ? ` · ${a.organization}` : ""}</div>}
              {a.location && <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{a.location}</div>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        eyebrow="Operación"
        title="Agenda ejecutiva"
        description="Citas institucionales y disponibilidad consolidada."
        actions={
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button className="rounded-none bg-navy hover:bg-navy-deep text-smoke text-xs uppercase tracking-wider h-10">
                <Plus className="h-4 w-4 mr-2" /> Nueva cita
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
              <SheetHeader><SheetTitle className="font-display text-navy">Registrar cita</SheetTitle></SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-steel">Título</Label>
                  <Input className="rounded-none" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-steel">Inicio</Label>
                    <Input type="datetime-local" className="rounded-none" value={form.starts_at} onChange={e => setForm({ ...form, starts_at: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-steel">Fin</Label>
                    <Input type="datetime-local" className="rounded-none" value={form.ends_at} onChange={e => setForm({ ...form, ends_at: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-steel">Asistente</Label>
                  <Input className="rounded-none" value={form.attendee_name} onChange={e => setForm({ ...form, attendee_name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-steel">Correo</Label>
                    <Input type="email" className="rounded-none" value={form.attendee_email} onChange={e => setForm({ ...form, attendee_email: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-steel">Organización</Label>
                    <Input className="rounded-none" value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-steel">Ubicación / enlace</Label>
                  <Input className="rounded-none" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-steel">Notas</Label>
                  <Textarea rows={3} className="rounded-none" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                </div>
                <Button onClick={submit} disabled={saving} className="w-full rounded-none bg-navy hover:bg-navy-deep text-smoke uppercase tracking-wider text-xs h-12">
                  {saving ? "Guardando…" : "Registrar"}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        }
      />

      <div className="space-y-10">
        <section>
          <div className="eyebrow mb-4">— Próximas</div>
          {upcoming.length === 0 ? (
            <div className="border border-dashed border-border p-12 text-center">
              <CalendarDays className="h-7 w-7 text-olive mx-auto mb-2" />
              <div className="text-sm text-steel">Sin citas programadas.</div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcoming.map(a => <Card key={a.id} a={a} />)}
            </div>
          )}
        </section>

        {past.length > 0 && (
          <section>
            <div className="eyebrow mb-4">— Histórico</div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {past.slice(0, 12).map(a => <Card key={a.id} a={a} dim />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Agenda;
