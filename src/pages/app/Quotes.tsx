import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, FileText, FileDown, Loader2, Eye, RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { describeDbError } from "@/lib/dbErrors";
import { withClientContacts, withLeadContacts } from "@/lib/contacts";
import { SERVICE_CATALOG, CUSTOM_SERVICE, CUSTOM_CODE, findService } from "@/lib/quoteCatalog";
import { previewQuotePdf, saveBlob, formatMoney, type QuotePdfData } from "@/lib/quotePdf";
import { ClientClassifier } from "@/components/app/ClientClassifier";
import { RatesDialog } from "@/components/app/RatesDialog";
import {
  classify, suggestPrice, internalAlerts, parseLeadProfile, priceDeviation, quoteTraceSummary, QUOTE_SCOPE, DEFAULT_PROFILE, PRICE_RANGE,
  type ClientProfile, type ServiceRate, type PriceTrace,
} from "@/lib/pricing";

const itemSchema = z.object({
  code: z.string().trim().min(1, "Selecciona un servicio en cada concepto").max(20),
  title: z.string().trim().min(1, "Cada concepto necesita un nombre").max(200, "Nombre de concepto demasiado largo"),
  description: z.string().trim().max(1000, "Descripción demasiado larga").optional().or(z.literal("")),
  qty: z.number().positive("Cantidad debe ser > 0").max(100000),
  unit_price: z.number().min(0, "Precio inválido").max(100_000_000),
  /** Horas estimadas del concepto (interno, no aparece en el PDF) */
  hours: z.number().min(0, "Horas inválidas").max(100000).optional(),
});
const quoteSchema = z.object({
  number: z.string().trim().min(1, "Folio requerido").max(50),
  currency: z.enum(["USD", "MXN", "EUR"]),
  notes: z.string().trim().max(4000).optional().or(z.literal("")),
  valid_until: z.string().max(20).optional().or(z.literal("")),
  taxRate: z.number().min(0, "Impuesto inválido").max(100, "Impuesto inválido"),
  items: z.array(itemSchema).min(1, "Agregue al menos un concepto"),
});
const newClientSchema = z.object({
  name: z.string().trim().min(1, "Nombre del cliente requerido").max(200),
  contact_name: z.string().trim().max(200).optional().or(z.literal("")),
  contact_email: z.string().trim().email("Correo del cliente inválido").max(255).optional().or(z.literal("")),
});

/** auto: el precio sigue la tarifa sugerida hasta que se edita a mano. No se guarda. */
type Item = { code: string; title: string; description: string; qty: number; unit_price: number; hours?: number; auto?: boolean; reason?: string };
type ClientRow = { id: string; name: string; contact_name: string | null; contact_email: string | null; contact_phone: string | null };

const NEW_CLIENT = "__new__";
const STATUS = ["draft", "sent", "accepted", "rejected", "expired"] as const;
const STATUS_LABEL: Record<string, string> = { draft: "Borrador", sent: "Enviada", accepted: "Aceptada", rejected: "Rechazada", expired: "Expirada" };

const emptyItem = (): Item => ({ code: "", title: "", description: "", qty: 1, unit_price: 0 });
const isoInDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Normaliza conceptos guardados (incluye el formato anterior sin código). */
const normalizeItems = (raw: unknown): Item[] =>
  (Array.isArray(raw) ? raw : []).map((r: any) => ({
    code: r?.code ?? "",
    title: r?.title ?? r?.description ?? "",
    description: r?.title ? r?.description ?? "" : "",
    qty: Number(r?.qty) || 0,
    unit_price: Number(r?.unit_price) || 0,
    hours: Number(r?.hours) || 0,
  }));

/** Horas estimadas de una cotización guardada (suma de sus conceptos). */
const estimatedHours = (raw: unknown) => normalizeItems(raw).reduce((s, i) => s + (i.hours ?? 0), 0);

/** Fecha local de Cuernavaca en formato AAAA-MM-DD (para filtrar el registro por día, mes o año). */
const fechaMx = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });
type Periodo = "todo" | "anio" | "mes" | "dia";
const csvCell = (v: unknown) => {
  const t = v == null ? "" : String(v);
  return /[",\n;]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};

const DRAFT_KEY = "stratec.quoteDraft.v1";
type Draft = {
  form: { number: string; currency: string; notes: string; valid_until: string };
  clientId: string;
  newClient: { name: string; contact_name: string; contact_email: string };
  items: Item[];
  taxRate: number;
  profile?: ClientProfile;
};
const readDraft = (): Draft | null => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
};

const Quotes = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [list, setList] = useState<any[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pdfBusy, setPdfBusy] = useState<string | null>(null);

  const [preview, setPreview] = useState<{ url: string; fileName: string; blob: Blob } | null>(null);
  const hoy = fechaMx(new Date().toISOString());
  const [periodo, setPeriodo] = useState<Periodo>("todo");
  const [fechaFiltro, setFechaFiltro] = useState(hoy);
  const [busqueda, setBusqueda] = useState("");

  // El borrador se conserva aunque se cierre el panel o se recargue la página
  const draft = useMemo(readDraft, []);
  const [form, setForm] = useState(draft?.form ?? { number: "", currency: "MXN", notes: "", valid_until: isoInDays(30) });
  const [clientId, setClientId] = useState<string>(draft?.clientId ?? "");
  const [newClient, setNewClient] = useState(draft?.newClient ?? { name: "", contact_name: "", contact_email: "" });
  const [items, setItems] = useState<Item[]>(draft?.items?.length ? draft.items : [emptyItem()]);
  const [taxRate, setTaxRate] = useState(draft?.taxRate ?? 16);
  const [profile, setProfile] = useState<ClientProfile>({ ...DEFAULT_PROFILE, ...(draft?.profile ?? {}) });
  const [rates, setRates] = useState<Record<string, ServiceRate>>({});
  const classification = useMemo(() => classify(profile), [profile]);
  const alerts = useMemo(() => internalAlerts(items.map((i) => i.code), profile), [items, profile]);
  const suggestionFor = (code: string) => suggestPrice(code, rates, classification);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, clientId, newClient, items, taxRate, profile } satisfies Draft));
    } catch {
      /* almacenamiento lleno o bloqueado: el borrador solo vive en memoria */
    }
  }, [form, clientId, newClient, items, taxRate, profile]);

  // Los conceptos con precio automático se recalculan al cambiar la clasificación o las tarifas
  useEffect(() => {
    setItems((prev) => {
      let changed = false;
      const next = prev.map((it) => {
        if (!it.auto || !it.code) return it;
        const sug = suggestPrice(it.code, rates, classification);
        if (!sug || sug.price === it.unit_price) return it;
        changed = true;
        return { ...it, unit_price: sug.price };
      });
      return changed ? next : prev;
    });
  }, [rates, classification]);

  const closePreview = () => {
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(null);
  };

  const subtotal = items.reduce((s, i) => s + i.qty * i.unit_price, 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;
  const totalHours = items.reduce((s, i) => s + (i.hours ?? 0), 0);

  const load = async () => {
    const [q, c, r] = await Promise.all([
      supabase.from("quotes").select("*, clients(name, contact_name)").order("created_at", { ascending: false }),
      // Correo y teléfono vienen de la vista client_contacts (no de la tabla)
      supabase.from("clients").select("id, name, contact_name").order("name"),
      // Si la tabla aún no existe (03-tarifas.sql pendiente) simplemente no hay sugerencias
      supabase.from("service_rates").select("code, price_low, price_medium, price_high, extra_site_pct"),
    ]);
    setRates(Object.fromEntries(((r.data ?? []) as ServiceRate[]).map((x) => [x.code, x])));
    setList(q.data ?? []);
    setClients((await withClientContacts((c.data ?? []) as { id: string; name: string; contact_name: string | null }[])) as ClientRow[]);
  };
  useEffect(() => { load(); }, []);

  // Desde Leads: /app/quotes?lead=<id> arma la cotización con el perfil del diagnóstico
  const [searchParams, setSearchParams] = useSearchParams();
  const leadId = searchParams.get("lead");
  useEffect(() => {
    if (!leadId) return;
    // Se quita ?lead de la URL para que recargar no vuelva a armar la cotización
    setSearchParams({}, { replace: true });
    (async () => {
      const { data: lead } = await supabase.from("leads").select("id, full_name, organization, notes").eq("id", leadId).maybeSingle();
      if (!lead) return;
      const parsed = parseLeadProfile(lead.notes);
      if (!parsed) {
        toast({ title: "Este lead no trae perfil del diagnóstico", description: "Captura la clasificación a mano." });
        return;
      }
      const hasDraft = clientId || items.some((i) => i.code);
      if (hasDraft && !window.confirm("¿Reemplazar la cotización en preparación con los datos de este lead?")) return;
      const [withContact] = await withLeadContacts([lead]);
      const placeholderName = lead.full_name.startsWith("Sin nombre");
      const org = lead.organization && lead.organization !== "No indicada" ? lead.organization : "";
      setClientId(NEW_CLIENT);
      setNewClient({
        name: org || (placeholderName ? "" : lead.full_name),
        contact_name: placeholderName ? "" : lead.full_name,
        contact_email: withContact?.email ?? "",
      });
      setProfile({ ...DEFAULT_PROFILE, ...parsed.profile });
      const codes = parsed.codes.filter((c) => findService(c));
      setItems(
        codes.length
          ? codes.map((code) => {
              const svc = findService(code)!;
              return { code, title: svc.title, description: svc.summary, qty: 1, unit_price: 0, auto: true };
            })
          : [emptyItem()],
      );
      const scopes = codes.map((c) => QUOTE_SCOPE[c]).filter(Boolean);
      setForm((f) => ({ ...f, number: "", notes: scopes.join("\n") }));
      setOpen(true);
      toast({ title: "Cotización armada desde el diagnóstico", description: "Revisa la clasificación (niveles y materiales peligrosos no vienen del sitio) y los conceptos." });
    })();
  }, [leadId]); // eslint-disable-line react-hooks/exhaustive-deps

  const suggestedNumber = useMemo(() => {
    const year = new Date().getFullYear();
    const prefix = `COT-${year}-`;
    const max = list
      .map((q) => String(q.number ?? ""))
      .filter((n) => n.startsWith(prefix))
      .map((n) => parseInt(n.slice(prefix.length), 10))
      .filter((n) => !Number.isNaN(n))
      .reduce((a, b) => Math.max(a, b), 0);
    return `${prefix}${String(max + 1).padStart(3, "0")}`;
  }, [list]);

  const resetForm = () => {
    localStorage.removeItem(DRAFT_KEY);
    setForm({ number: suggestedNumber, currency: "MXN", notes: "", valid_until: isoInDays(30) });
    setClientId("");
    setNewClient({ name: "", contact_name: "", contact_email: "" });
    setItems([emptyItem()]);
    setTaxRate(16);
    setProfile(DEFAULT_PROFILE);
  };

  const onOpenChange = (v: boolean) => {
    if (v && !form.number) setForm((f) => ({ ...f, number: suggestedNumber }));
    setOpen(v);
  };

  const addItem = () => setItems([...items, emptyItem()]);
  /** Viáticos o terceros: concepto especial con nombre ya puesto; el precio lo captura el consultor. */
  const addSpecial = (title: string, description: string) =>
    setItems([...items.filter((it) => it.code || it.title || it.unit_price), { code: CUSTOM_CODE, title, description, qty: 1, unit_price: 0 }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, patch: Partial<Item>) => setItems(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  const selectService = (i: number, code: string) => {
    const svc = findService(code);
    const prev = items[i];
    const prevSvc = findService(prev.code);
    // Solo sobrescribe la descripción si el usuario no la había personalizado
    const keepDesc = prev.description && prev.description !== prevSvc?.summary;
    const sug = suggestionFor(code);
    updateItem(i, {
      code,
      title: code === CUSTOM_CODE ? (prev.code === CUSTOM_CODE ? prev.title : "") : svc?.title ?? "",
      description: keepDesc ? prev.description : svc?.summary ?? "",
      auto: true,
      ...(sug ? { unit_price: sug.price } : {}),
    });
    // El alcance del servicio va en la propuesta (no en la página web)
    const scope = QUOTE_SCOPE[code];
    if (scope && !form.notes.includes(scope)) setForm((f) => ({ ...f, notes: f.notes.trim() ? `${f.notes.trim()}\n${scope}` : scope }));
  };

  /** Cliente en el formato que usa el PDF, a partir de la selección actual. */
  const currentClient = (): QuotePdfData["client"] | null => {
    if (clientId === NEW_CLIENT) {
      return newClient.name.trim()
        ? { name: newClient.name.trim(), contact: newClient.contact_name || null, email: newClient.contact_email || null }
        : null;
    }
    const c = clients.find((x) => x.id === clientId);
    return c ? { name: c.name, contact: c.contact_name, email: c.contact_email, phone: c.contact_phone } : null;
  };

  const validate = () => {
    // Sin folio capturado se usa el sugerido (el que se ve en el campo)
    const parsed = quoteSchema.safeParse({ ...form, number: form.number.trim() || suggestedNumber, taxRate, items });
    if (!parsed.success) {
      toast({ title: "Datos inválidos", description: parsed.error.issues[0].message, variant: "destructive" });
      return null;
    }
    const sinJustificar = items.find((it) => {
      const sug = it.code ? suggestionFor(it.code) : null;
      return priceDeviation(it.unit_price, sug?.price).outOfRange && (it.reason ?? "").trim().length < 10;
    });
    if (sinJustificar) {
      toast({
        title: "Falta justificar un precio",
        description: `«${sinJustificar.title || sinJustificar.code}» está fuera del rango (−${PRICE_RANGE.belowPct}% / +${PRICE_RANGE.abovePct}% del sugerido). Escribe el motivo (mínimo 10 caracteres).`,
        variant: "destructive",
      });
      return null;
    }
    if (!clientId) {
      toast({ title: "Datos inválidos", description: "Selecciona un cliente o crea uno nuevo.", variant: "destructive" });
      return null;
    }
    if (clientId === NEW_CLIENT) {
      const nc = newClientSchema.safeParse(newClient);
      if (!nc.success) {
        toast({ title: "Datos inválidos", description: nc.error.issues[0].message, variant: "destructive" });
        return null;
      }
    }
    return parsed.data;
  };

  const makePdf = async (data: QuotePdfData, key: string) => {
    setPdfBusy(key);
    try {
      if (preview) URL.revokeObjectURL(preview.url);
      setPreview(await previewQuotePdf(data));
    } catch (e: any) {
      console.error("[Quotes.pdf]", e);
      toast({ title: "No se pudo generar el PDF", description: e?.message ?? "Intenta de nuevo.", variant: "destructive" });
    } finally {
      setPdfBusy(null);
    }
  };

  const previewPdf = async () => {
    const data = validate();
    const client = currentClient();
    if (!data || !client) return;
    await makePdf(
      {
        number: data.number,
        issuedAt: new Date(),
        validUntil: data.valid_until || null,
        currency: data.currency,
        taxRate: data.taxRate,
        client,
        items: data.items.map((i) => ({ code: i.code, title: i.title, description: i.description || "", qty: i.qty, unit_price: i.unit_price })),
        notes: data.notes || null,
      },
      "form",
    );
  };

  const submit = async (withPdf: boolean) => {
    const data = validate();
    if (!data) return;
    setSaving(true);

    let finalClientId = clientId;
    if (clientId === NEW_CLIENT) {
      const { data: created, error } = await supabase
        .from("clients")
        .insert({
          name: newClient.name.trim(),
          contact_name: newClient.contact_name.trim() || null,
          contact_email: newClient.contact_email.trim() || null,
          owner_id: user?.id,
        } as any)
        .select("id")
        .single();
      if (error || !created) {
        setSaving(false);
        console.error("[Quotes.newClient]", error?.code ?? "error");
        toast({ title: "No se pudo registrar el cliente nuevo", description: describeDbError(error, "Intenta de nuevo."), variant: "destructive" });
        return;
      }
      finalClientId = created.id;
    }

    // Totales recalculados a partir de los datos validados
    const safeSubtotal = data.items.reduce((s, i) => s + i.qty * i.unit_price, 0);
    const safeTax = safeSubtotal * (data.taxRate / 100);
    const safeTotal = safeSubtotal + safeTax;
    const client = currentClient();

    // Registro del precio dentro de cada concepto (no se imprime en el PDF)
    const at = new Date().toISOString();
    const savedItems = data.items.map((it, idx) => {
      const sug = it.code && it.code !== CUSTOM_CODE ? suggestionFor(it.code) : null;
      const dev = priceDeviation(it.unit_price, sug?.price);
      const pricing: PriceTrace = {
        suggested: sug?.price ?? null,
        basis: sug?.detail ?? (it.code === CUSTOM_CODE ? "Concepto especial (sin tarifa)" : "Sin tarifa capturada"),
        risk: classification.risk,
        complexity: classification.complexity,
        complexity_manual: profile.complexity != null,
        scope: classification.scope,
        sites: classification.sites,
        deviation_pct: dev.pct,
        out_of_range: dev.outOfRange,
        reason: (items[idx]?.reason ?? "").trim(),
        by: user?.email ?? null,
        at,
      };
      return { ...it, pricing };
    });

    const { error } = await supabase.from("quotes").insert({
      number: data.number,
      client_id: finalClientId,
      currency: data.currency,
      notes: data.notes || null,
      valid_until: data.valid_until || null,
      items: savedItems as any,
      subtotal: safeSubtotal,
      tax: safeTax,
      total: safeTotal,
      owner_id: user?.id,
    });
    setSaving(false);
    if (error) {
      console.error("[Quotes.insert]", error?.code ?? "error");
      toast({ title: "No se pudo guardar la cotización", description: describeDbError(error, "Intenta de nuevo."), variant: "destructive" });
      return;
    }
    toast({ title: "Cotización creada", description: `${data.number} · ${formatMoney(safeTotal, data.currency)} ${data.currency}` });

    if (withPdf && client) {
      await makePdf(
        {
          number: data.number,
          issuedAt: new Date(),
          validUntil: data.valid_until || null,
          currency: data.currency,
          taxRate: data.taxRate,
          client,
          items: data.items.map((i) => ({ code: i.code, title: i.title, description: i.description || "", qty: i.qty, unit_price: i.unit_price })),
          notes: data.notes || null,
        },
        "form",
      );
    }
    setOpen(false);
    await load();
    resetFormAfterSave();
  };

  // Se ejecuta tras recargar la lista para que el folio sugerido avance
  const resetFormAfterSave = () => {
    localStorage.removeItem(DRAFT_KEY);
    setClientId("");
    setNewClient({ name: "", contact_name: "", contact_email: "" });
    setItems([emptyItem()]);
    setTaxRate(16);
    setProfile(DEFAULT_PROFILE);
    setForm({ number: "", currency: "MXN", notes: "", valid_until: isoInDays(30) });
  };

  const downloadSaved = (q: any) => {
    const sub = Number(q.subtotal) || 0;
    const rate = sub > 0 ? Math.round((Number(q.tax) / sub) * 10000) / 100 : 0;
    makePdf(
      {
        number: q.number,
        issuedAt: new Date(q.created_at),
        validUntil: q.valid_until,
        currency: q.currency,
        taxRate: rate,
        client: {
          name: q.clients?.name ?? "Cliente",
          contact: q.clients?.contact_name,
          email: clients.find((c) => c.id === q.client_id)?.contact_email,
          phone: clients.find((c) => c.id === q.client_id)?.contact_phone,
        },
        // Solo los campos que imprime el PDF: las horas son internas
        items: normalizeItems(q.items).map((i) => ({ code: i.code, title: i.title, description: i.description, qty: i.qty, unit_price: i.unit_price })),
        notes: q.notes,
      },
      q.id,
    );
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("quotes").update({ status: status as any }).eq("id", id);
    load();
  };

  /** Horas reales invertidas: comparadas con las estimadas dicen si la tarifa es rentable. */
  const saveHours = async (id: string, raw: string, prev: number | null) => {
    const value = raw.trim() === "" ? null : Math.max(0, Number(raw) || 0);
    if (value === (prev == null ? null : Number(prev))) return;
    const { error } = await supabase.from("quotes").update({ hours_actual: value }).eq("id", id);
    if (error) {
      const missing = error.code === "42703" || error.code === "PGRST204";
      toast({
        title: "No se pudieron guardar las horas",
        description: missing ? "Falta ejecutar supabase/setup/03-tarifas.sql en Supabase (paso 2c del README)." : describeDbError(error, "Intenta de nuevo."),
        variant: "destructive",
      });
      return;
    }
    load();
  };

  // ─── Registro de cotizaciones generadas ──────────────────────────────────
  const registro = useMemo(() => {
    const b = busqueda.trim().toLowerCase();
    const prefijo = periodo === "anio" ? fechaFiltro.slice(0, 4) : periodo === "mes" ? fechaFiltro.slice(0, 7) : periodo === "dia" ? fechaFiltro : "";
    return list.filter((q) => {
      if (prefijo && !fechaMx(q.created_at).startsWith(prefijo)) return false;
      if (b && !`${q.number} ${q.clients?.name ?? ""}`.toLowerCase().includes(b)) return false;
      return true;
    });
  }, [list, periodo, fechaFiltro, busqueda]);

  const totalesPorMoneda = useMemo(
    () => registro.reduce<Record<string, number>>((acc, q) => ({ ...acc, [q.currency]: (acc[q.currency] ?? 0) + (Number(q.total) || 0) }), {}),
    [registro],
  );

  const exportarCsv = () => {
    const encabezado = ["Fecha", "Folio", "Cliente", "Estado", "Moneda", "Subtotal", "IVA", "Total", "Sugerido", "Diferencia %", "Requiere revisión", "Horas estimadas", "Horas reales", "Elaboró", "Vigencia"];
    const filas = registro.map((q) => {
      const tr = quoteTraceSummary(q.items);
      return [
        fechaMx(q.created_at), q.number, q.clients?.name ?? "", STATUS_LABEL[q.status] ?? q.status, q.currency,
        Number(q.subtotal) || 0, Number(q.tax) || 0, Number(q.total) || 0,
        tr ? tr.suggested : "", tr?.deviationPct ?? "", tr ? (tr.review ? "Sí" : "No") : "",
        estimatedHours(q.items) || "", q.hours_actual ?? "", tr?.by ?? "", q.valid_until ?? "",
      ];
    });
    const csv = "\uFEFF" + [encabezado, ...filas].map((f) => f.map(csvCell).join(",")).join("\r\n");
    saveBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), `registro-cotizaciones-${periodo === "todo" ? "completo" : fechaFiltro.slice(0, periodo === "anio" ? 4 : periodo === "mes" ? 7 : 10)}.csv`);
  };

  const parents = SERVICE_CATALOG.filter((s) => !s.parentCode);
  const childrenOf = (code: string) => SERVICE_CATALOG.filter((s) => s.parentCode === code);

  // Se monta dentro del panel cuando está abierto (para que no lo cierre) y fuera cuando no
  const previewDialog = (
    <Dialog open={!!preview} onOpenChange={(v) => !v && closePreview()}>
      <DialogContent className="max-w-5xl w-[95vw] h-[92vh] p-0 gap-0 flex flex-col rounded-none">
        <DialogHeader className="px-5 py-3 border-b border-border flex-row items-center justify-between space-y-0">
          <DialogTitle className="font-display text-navy text-base truncate pr-4">{preview?.fileName}</DialogTitle>
          <Button
            size="sm"
            onClick={() => preview && saveBlob(preview.blob, preview.fileName)}
            className="rounded-none bg-navy hover:bg-navy-deep text-smoke text-xs uppercase tracking-wider h-9 mr-8 shrink-0"
          >
            <FileDown className="h-4 w-4 mr-2" /> Descargar
          </Button>
        </DialogHeader>
        {preview && <iframe title="Vista previa de la propuesta" src={preview.url} className="flex-1 w-full bg-secondary" />}
      </DialogContent>
    </Dialog>
  );

  return (
    <div>
      <PageHeader
        eyebrow="Comercial"
        title="Cotizaciones"
        description="Generación y seguimiento de propuestas económicas institucionales."
        actions={
          <div className="flex gap-2">
          <RatesDialog rates={rates} onSaved={load} />
          <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetTrigger asChild>
              <Button className="rounded-none bg-navy hover:bg-navy-deep text-smoke text-xs uppercase tracking-wider h-10">
                <Plus className="h-4 w-4 mr-2" /> Nueva cotización
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
              <SheetHeader><SheetTitle className="font-display text-navy">Nueva cotización</SheetTitle></SheetHeader>
              <div className="mt-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-steel">Folio</Label>
                    <Input className="rounded-none" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} placeholder={suggestedNumber} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-steel">Moneda</Label>
                    <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                      <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MXN">MXN — Pesos mexicanos</SelectItem>
                        <SelectItem value="USD">USD — Dólares</SelectItem>
                        <SelectItem value="EUR">EUR — Euros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-steel">Cliente / Organización</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger className="rounded-none"><SelectValue placeholder="Selecciona un cliente" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NEW_CLIENT}>+ Cliente nuevo</SelectItem>
                      {clients.length > 0 && <SelectSeparator />}
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {clientId === NEW_CLIENT && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      <Input className="rounded-none" placeholder="Nombre de la organización" value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} />
                      <Input className="rounded-none" placeholder="Atención (contacto)" value={newClient.contact_name} onChange={(e) => setNewClient({ ...newClient, contact_name: e.target.value })} />
                      <Input className="rounded-none" type="email" placeholder="Correo" value={newClient.contact_email} onChange={(e) => setNewClient({ ...newClient, contact_email: e.target.value })} />
                    </div>
                  )}
                </div>

                <ClientClassifier profile={profile} onChange={setProfile} result={classification} alerts={alerts} />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-steel">Vigencia hasta</Label>
                    <Input type="date" className="rounded-none" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-steel">IVA (%)</Label>
                    <Input type="number" className="rounded-none" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} />
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-xs uppercase tracking-wider text-steel">Conceptos</Label>
                    <div className="flex gap-1">
                      <Button type="button" size="sm" variant="ghost" onClick={() => addSpecial("Viáticos y traslados", "Traslado, hospedaje y alimentación del equipo consultor.")} className="rounded-none text-xs h-8"><Plus className="h-3 w-3 mr-1" />Viáticos</Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => addSpecial("Servicios de terceros", "Especialistas o laboratorios externos requeridos por el alcance.")} className="rounded-none text-xs h-8"><Plus className="h-3 w-3 mr-1" />Terceros</Button>
                      <Button type="button" size="sm" variant="ghost" onClick={addItem} className="rounded-none text-xs h-8"><Plus className="h-3 w-3 mr-1" />Concepto</Button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {items.map((it, i) => (
                      <div key={i} className="border border-border p-3 space-y-2 bg-secondary/20">
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-11">
                            <Select value={it.code} onValueChange={(v) => selectService(i, v)}>
                              <SelectTrigger className="rounded-none bg-background">
                                <SelectValue placeholder="Selecciona un servicio" />
                              </SelectTrigger>
                              <SelectContent className="max-h-80">
                                {parents.map((p) => (
                                  <SelectGroup key={p.code}>
                                    <SelectLabel className="text-[10px] uppercase tracking-wider text-steel">{p.title}</SelectLabel>
                                    <SelectItem value={p.code} className="group focus:bg-secondary focus:text-navy">
                                      <span className="font-mono text-xs text-olive mr-2 transition-colors group-focus:text-navy group-focus:font-semibold">{p.code}</span>{p.title}
                                    </SelectItem>
                                    {childrenOf(p.code).map((c) => (
                                      <SelectItem key={c.code} value={c.code} className="pl-10 group focus:bg-secondary focus:text-navy">
                                        <span className="font-mono text-xs text-olive mr-2 transition-colors group-focus:text-navy group-focus:font-semibold">{c.code}</span>{c.title}
                                      </SelectItem>
                                    ))}
                                  </SelectGroup>
                                ))}
                                <SelectSeparator />
                                <SelectItem value={CUSTOM_CODE} className="group focus:bg-secondary focus:text-navy">
                                  <span className="font-mono text-xs text-olive mr-2 transition-colors group-focus:text-navy group-focus:font-semibold">{CUSTOM_CODE}</span>{CUSTOM_SERVICE.title}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button type="button" size="icon" variant="ghost" className="col-span-1 h-9 w-9" onClick={() => removeItem(i)} disabled={items.length === 1} aria-label="Quitar concepto">
                            <Trash2 className="h-4 w-4 text-steel" />
                          </Button>
                        </div>
                        {it.code === CUSTOM_CODE && (
                          <Input className="rounded-none bg-background" placeholder="Nombre del concepto" value={it.title} onChange={(e) => updateItem(i, { title: e.target.value })} />
                        )}
                        <Textarea
                          className="rounded-none bg-background text-sm"
                          rows={2}
                          placeholder="Descripción / alcance del concepto (aparece en el PDF)"
                          value={it.description}
                          onChange={(e) => updateItem(i, { description: e.target.value })}
                        />
                        <div className="grid grid-cols-12 gap-2 items-end">
                          <div className="col-span-2 space-y-1">
                            <Label className="text-[10px] uppercase tracking-wider text-steel">Cantidad</Label>
                            <Input className="rounded-none bg-background" type="number" min={1} value={it.qty} onChange={(e) => updateItem(i, { qty: Number(e.target.value) })} />
                          </div>
                          <div className="col-span-2 space-y-1">
                            <Label className="text-[10px] uppercase tracking-wider text-steel" title="Horas estimadas de trabajo. Interno: no aparece en el PDF">Horas est.</Label>
                            <Input className="rounded-none bg-background" type="number" min={0} step="0.5" value={it.hours || ""} onChange={(e) => updateItem(i, { hours: Math.max(0, Number(e.target.value) || 0) })} />
                          </div>
                          <div className="col-span-4 space-y-1">
                            <Label className="text-[10px] uppercase tracking-wider text-steel">Precio unitario</Label>
                            <Input className="rounded-none bg-background" type="number" min={0} step="0.01" value={it.unit_price} onChange={(e) => updateItem(i, { unit_price: Number(e.target.value), auto: false })} />
                          </div>
                          <div className="col-span-4 text-right text-sm text-navy pb-2">
                            {formatMoney(it.qty * it.unit_price, form.currency)}
                          </div>
                        </div>
                        {it.code && it.code !== CUSTOM_CODE && (() => {
                          const sug = suggestionFor(it.code);
                          if (!sug) return <p className="text-[11px] text-steel">Sin tarifa capturada para este servicio y complejidad.</p>;
                          const dev = priceDeviation(it.unit_price, sug.price);
                          const ajustado = !it.auto && dev.pct != null && dev.pct !== 0;
                          return (
                            <div className="space-y-1.5">
                              <p className="text-[11px] text-steel flex items-center gap-2 flex-wrap">
                                <span>Sugerido: <span className="text-navy">{formatMoney(sug.price, form.currency)}</span> · {sug.detail}</span>
                                {it.auto ? <span className="text-olive">(automático)</span> : (
                                  <>
                                    {ajustado && (
                                      <span className={dev.outOfRange ? "text-red-700 font-medium" : "text-navy"}>
                                        Final {dev.pct! > 0 ? "+" : ""}{dev.pct}% ({it.unit_price < sug.price ? "−" : "+"}{formatMoney(Math.abs(it.unit_price - sug.price), form.currency)})
                                      </span>
                                    )}
                                    <button type="button" className="underline text-navy" onClick={() => updateItem(i, { unit_price: sug.price, auto: true, reason: "" })}>Usar sugerido</button>
                                  </>
                                )}
                              </p>
                              {ajustado && (
                                <Input
                                  className={`rounded-none bg-background h-8 text-xs ${dev.outOfRange && (it.reason ?? "").trim().length < 10 ? "border-red-400" : ""}`}
                                  placeholder={dev.outOfRange ? `Obligatorio: motivo del ajuste (fuera de −${PRICE_RANGE.belowPct}% / +${PRICE_RANGE.abovePct}%)` : "Motivo del ajuste (opcional)"}
                                  value={it.reason ?? ""}
                                  onChange={(e) => updateItem(i, { reason: e.target.value })}
                                />
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-secondary/40 border border-border p-4 space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-steel">Subtotal</span><span className="text-navy">{formatMoney(subtotal, form.currency)}</span></div>
                  <div className="flex justify-between"><span className="text-steel">IVA ({taxRate}%)</span><span className="text-navy">{formatMoney(tax, form.currency)}</span></div>
                  <div className="flex justify-between font-display text-lg pt-2 border-t border-border"><span className="text-navy">Total</span><span className="text-navy">{formatMoney(total, form.currency)} {form.currency}</span></div>
                  {totalHours > 0 && (
                    <div className="flex justify-between text-[11px] text-steel pt-1">
                      <span>Horas estimadas (interno): {totalHours}</span>
                      <span>{formatMoney(subtotal / totalHours, form.currency)} por hora, antes de IVA</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-steel">Alcance y observaciones (forma de pago, tiempos, exclusiones)</Label>
                  <Textarea className="rounded-none" rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Ej. Forma de pago: 50% de anticipo y 50% contra entrega. Tiempo de ejecución: 3 semanas." />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button type="button" variant="outline" onClick={previewPdf} disabled={saving || pdfBusy === "form"} className="rounded-none uppercase tracking-wider text-xs h-12 border-navy text-navy">
                    {pdfBusy === "form" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
                    Vista previa PDF
                  </Button>
                  <Button onClick={() => submit(true)} disabled={saving} className="rounded-none bg-navy hover:bg-navy-deep text-smoke uppercase tracking-wider text-xs h-12">
                    {saving ? "Guardando…" : "Guardar y ver PDF"}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button type="button" variant="ghost" onClick={() => submit(false)} disabled={saving} className="rounded-none uppercase tracking-wider text-xs h-10 text-steel">
                    Solo guardar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={saving}
                    onClick={() => { if (window.confirm("¿Borrar todos los datos de esta cotización en preparación?")) resetForm(); }}
                    className="rounded-none uppercase tracking-wider text-xs h-10 text-steel"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-2" /> Limpiar formulario
                  </Button>
                </div>
                <p className="text-[11px] text-steel text-center">El borrador se guarda automáticamente en este navegador hasta que lo guardes o lo limpies.</p>

                {open && previewDialog}
              </div>
            </SheetContent>
          </Sheet>
          </div>
        }
      />

      {!open && previewDialog}

      <div className="flex flex-wrap items-end gap-3 mb-3">
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-steel">Periodo</Label>
          <Select value={periodo} onValueChange={(v) => setPeriodo(v as Periodo)}>
            <SelectTrigger className="rounded-none h-9 w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">Todo</SelectItem>
              <SelectItem value="anio">Año</SelectItem>
              <SelectItem value="mes">Mes</SelectItem>
              <SelectItem value="dia">Día</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {periodo === "anio" && (
          <Select value={fechaFiltro.slice(0, 4)} onValueChange={(v) => setFechaFiltro(`${v}${fechaFiltro.slice(4)}`)}>
            <SelectTrigger className="rounded-none h-9 w-28" aria-label="Año"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Array.from(new Set([hoy.slice(0, 4), ...list.map((q) => fechaMx(q.created_at).slice(0, 4))])).sort().reverse().map((y) => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {periodo === "mes" && (
          <Input type="month" aria-label="Mes" className="rounded-none h-9 w-44" value={fechaFiltro.slice(0, 7)} onChange={(e) => e.target.value && setFechaFiltro(`${e.target.value}-01`)} />
        )}
        {periodo === "dia" && (
          <Input type="date" aria-label="Día" className="rounded-none h-9 w-44" value={fechaFiltro} onChange={(e) => e.target.value && setFechaFiltro(e.target.value)} />
        )}
        <Input placeholder="Buscar folio o cliente" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="rounded-none h-9 w-56" />
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-steel">
            {registro.length} cotizacion{registro.length === 1 ? "" : "es"} · {Object.entries(totalesPorMoneda).map(([m, t]) => `${formatMoney(t, m)} ${m}`).join(" · ") || "—"}
          </span>
          <Button type="button" variant="outline" size="sm" onClick={exportarCsv} disabled={!registro.length} className="rounded-none h-9 text-xs uppercase tracking-wider border-navy text-navy">
            <FileDown className="h-4 w-4 mr-2" /> CSV
          </Button>
        </div>
      </div>

      <div className="border border-border bg-card overflow-x-auto">
        {registro.length === 0 ? (
          <div className="p-16 text-center">
            <FileText className="h-8 w-8 text-olive mx-auto mb-3" />
            <div className="text-navy font-display text-lg">{list.length ? "Sin cotizaciones en este periodo" : "Sin cotizaciones"}</div>
            <p className="text-sm text-steel mt-1">{list.length ? "Cambia el periodo o la búsqueda." : "Cree la primera propuesta económica."}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-xs uppercase tracking-wider text-steel">Creada</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-steel">Folio</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-steel">Cliente</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-steel" title="Suma de precios sugeridos y diferencia del precio final (antes de IVA)">Sugerido / dif.</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-steel">Total</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-steel">Vigencia</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-steel" title="Horas estimadas / horas reales (interno)">Horas est. / reales</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-steel">Estado</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-steel text-right">PDF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registro.map((q) => {
                const tr = quoteTraceSummary(q.items);
                return (
                <TableRow key={q.id} className="border-border">
                  <TableCell className="text-steel text-sm whitespace-nowrap">
                    {new Date(q.created_at).toLocaleDateString("es-MX", { timeZone: "America/Mexico_City", day: "2-digit", month: "short", year: "numeric" })}
                    {tr?.by && <span className="block text-[10px] text-steel/80">{tr.by}</span>}
                  </TableCell>
                  <TableCell className="font-medium text-navy whitespace-nowrap">{q.number}</TableCell>
                  <TableCell className="text-steel text-sm">{q.clients?.name ?? "—"}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {!tr ? (
                      <span className="text-[11px] text-steel" title="Creada antes del registro de precios">Sin registro</span>
                    ) : (
                      <>
                        <span className="text-steel">{tr.suggested ? formatMoney(tr.suggested, q.currency) : "Sin tarifa"}</span>
                        {tr.deviationPct != null && tr.deviationPct !== 0 && (
                          <span className={`ml-2 text-[11px] ${tr.review ? "text-red-700" : "text-navy"}`}>{tr.deviationPct > 0 ? "+" : ""}{tr.deviationPct}%</span>
                        )}
                        {tr.review && <span className="ml-2 text-[10px] uppercase tracking-wider px-1.5 py-0.5 border border-red-200 bg-red-50 text-red-800" title="Precio fuera de rango, con justificación">Revisar</span>}
                      </>
                    )}
                  </TableCell>
                  <TableCell className="text-navy whitespace-nowrap">{formatMoney(Number(q.total), q.currency)} {q.currency}</TableCell>
                  <TableCell className="text-steel text-sm whitespace-nowrap">{q.valid_until ?? "—"}</TableCell>
                  <TableCell className="text-sm">
                    {(() => {
                      const est = estimatedHours(q.items);
                      const real = Number(q.hours_actual) || 0;
                      const sub = Number(q.subtotal) || 0;
                      return (
                        <div className="flex items-center gap-2">
                          <span className="text-steel w-8 text-right">{est || "—"}</span>
                          <span className="text-steel">/</span>
                          <Input
                            key={`${q.id}-${q.hours_actual ?? ""}`}
                            type="number"
                            min={0}
                            step="0.5"
                            defaultValue={q.hours_actual ?? ""}
                            onBlur={(e) => saveHours(q.id, e.target.value, q.hours_actual)}
                            className="rounded-none h-8 w-20 text-xs"
                            aria-label={`Horas reales de ${q.number}`}
                          />
                          {real > 0 && sub > 0 && (
                            <span className="text-[11px] text-steel whitespace-nowrap">{formatMoney(sub / real, q.currency)}/h</span>
                          )}
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    <Select value={q.status} onValueChange={(v) => updateStatus(q.id, v)}>
                      <SelectTrigger className="rounded-none h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUS.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" className="rounded-none h-8 text-xs text-navy" onClick={() => downloadSaved(q)} disabled={pdfBusy === q.id} aria-label={`Ver PDF de ${q.number}`}>
                      {pdfBusy === q.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default Quotes;
