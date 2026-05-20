import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Item = { description: string; qty: number; unit_price: number };
const STATUS = ["draft", "sent", "accepted", "rejected", "expired"] as const;
const STATUS_LABEL: Record<string, string> = { draft: "Borrador", sent: "Enviada", accepted: "Aceptada", rejected: "Rechazada", expired: "Expirada" };

const Quotes = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [list, setList] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ number: "", client_name: "", currency: "USD", notes: "", valid_until: "" });
  const [items, setItems] = useState<Item[]>([{ description: "", qty: 1, unit_price: 0 }]);
  const [taxRate, setTaxRate] = useState(16);

  const subtotal = items.reduce((s, i) => s + i.qty * i.unit_price, 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  const load = async () => {
    const { data } = await supabase.from("quotes").select("*").order("created_at", { ascending: false });
    setList(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const addItem = () => setItems([...items, { description: "", qty: 1, unit_price: 0 }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, k: keyof Item, v: any) => setItems(items.map((it, idx) => idx === i ? { ...it, [k]: v } : it));

  const submit = async () => {
    if (!form.number || !form.client_name) {
      toast({ title: "Datos requeridos", description: "Número de cotización y cliente.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("quotes").insert({
      number: form.number,
      currency: form.currency,
      notes: form.notes || null,
      valid_until: form.valid_until || null,
      items: items as any,
      subtotal, tax, total,
      owner_id: user?.id,
    });
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Cotización creada", description: `${form.number} · ${form.currency} ${total.toFixed(2)}` });
    setOpen(false);
    setForm({ number: "", client_name: "", currency: "USD", notes: "", valid_until: "" });
    setItems([{ description: "", qty: 1, unit_price: 0 }]);
    load();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("quotes").update({ status: status as any }).eq("id", id);
    load();
  };

  return (
    <div>
      <PageHeader
        eyebrow="Comercial"
        title="Cotizaciones"
        description="Generación y seguimiento de propuestas económicas institucionales."
        actions={
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button className="rounded-none bg-navy hover:bg-navy-deep text-smoke text-xs uppercase tracking-wider h-10">
                <Plus className="h-4 w-4 mr-2" /> Nueva cotización
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
              <SheetHeader><SheetTitle className="font-display text-navy">Nueva cotización</SheetTitle></SheetHeader>
              <div className="mt-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-steel">Número</Label>
                    <Input className="rounded-none" value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} placeholder="COT-2026-001" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-steel">Moneda</Label>
                    <Select value={form.currency} onValueChange={v => setForm({ ...form, currency: v })}>
                      <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="MXN">MXN</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-steel">Cliente / Organización</Label>
                  <Input className="rounded-none" value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-steel">Vigencia hasta</Label>
                  <Input type="date" className="rounded-none" value={form.valid_until} onChange={e => setForm({ ...form, valid_until: e.target.value })} />
                </div>

                <div className="border-t border-border pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-xs uppercase tracking-wider text-steel">Conceptos</Label>
                    <Button type="button" size="sm" variant="ghost" onClick={addItem} className="rounded-none text-xs h-8"><Plus className="h-3 w-3 mr-1" />Agregar</Button>
                  </div>
                  <div className="space-y-2">
                    {items.map((it, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 items-center">
                        <Input className="rounded-none col-span-6" placeholder="Descripción" value={it.description} onChange={e => updateItem(i, "description", e.target.value)} />
                        <Input className="rounded-none col-span-2" type="number" min={1} value={it.qty} onChange={e => updateItem(i, "qty", Number(e.target.value))} />
                        <Input className="rounded-none col-span-3" type="number" min={0} step="0.01" placeholder="Precio" value={it.unit_price} onChange={e => updateItem(i, "unit_price", Number(e.target.value))} />
                        <Button type="button" size="icon" variant="ghost" className="col-span-1 h-9 w-9" onClick={() => removeItem(i)} disabled={items.length === 1}>
                          <Trash2 className="h-4 w-4 text-steel" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-steel">Impuesto (%)</Label>
                  <Input type="number" className="rounded-none w-32" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} />
                </div>

                <div className="bg-secondary/40 border border-border p-4 space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-steel">Subtotal</span><span className="text-navy">{form.currency} {subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-steel">Impuesto</span><span className="text-navy">{form.currency} {tax.toFixed(2)}</span></div>
                  <div className="flex justify-between font-display text-lg pt-2 border-t border-border"><span className="text-navy">Total</span><span className="text-navy">{form.currency} {total.toFixed(2)}</span></div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-steel">Notas</Label>
                  <Textarea className="rounded-none" rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                </div>

                <Button onClick={submit} disabled={saving} className="w-full rounded-none bg-navy hover:bg-navy-deep text-smoke uppercase tracking-wider text-xs h-12">
                  {saving ? "Guardando…" : "Guardar cotización"}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        }
      />

      <div className="border border-border bg-card">
        {list.length === 0 ? (
          <div className="p-16 text-center">
            <FileText className="h-8 w-8 text-olive mx-auto mb-3" />
            <div className="text-navy font-display text-lg">Sin cotizaciones</div>
            <p className="text-sm text-steel mt-1">Cree la primera propuesta económica.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-xs uppercase tracking-wider text-steel">Número</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-steel">Total</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-steel">Vigencia</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-steel">Estado</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-steel">Creada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((q) => (
                <TableRow key={q.id} className="border-border">
                  <TableCell className="font-medium text-navy">{q.number}</TableCell>
                  <TableCell className="text-navy">{q.currency} {Number(q.total).toLocaleString("en-US", { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-steel text-sm">{q.valid_until ?? "—"}</TableCell>
                  <TableCell>
                    <Select value={q.status} onValueChange={(v) => updateStatus(q.id, v)}>
                      <SelectTrigger className="rounded-none h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUS.map(s => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-steel text-sm">{new Date(q.created_at).toLocaleDateString("es")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default Quotes;
