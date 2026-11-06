import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/app/PageHeader";
import { PdfPreviewDialog, type PdfPreview } from "@/components/app/PdfPreviewDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Eye, FilePlus2, FileStack, Loader2, Plus, Trash2, Check, AlertTriangle } from "lucide-react";
import {
  DOCUMENT_TEMPLATES, findTemplate, emptyDocumentData, normalizeDocumentData,
  newFinding, newRisk, newAction, riskScore, riskLevel,
  SEVERITY_LABEL, PRIORITY_LABEL, TERM_LABEL, VERDICT_LABEL, RISK_LEVEL_LABEL, LEVEL_RGB, PROBABILITY_LABEL, IMPACT_LABEL,
  type DocumentData, type DocumentTemplate, type Finding, type Risk, type Action, type Severity, type Priority, type Term, type Verdict,
} from "@/lib/documentTemplates";
import { previewDocumentPdf } from "@/lib/documentPdf";

type ClientRow = { id: string; name: string; contact_name: string | null };

const STATUS = ["draft", "review", "final", "delivered"] as const;
const STATUS_LABEL: Record<string, string> = { draft: "Borrador", review: "En revisión", final: "Final", delivered: "Entregado" };

const label = "text-xs uppercase tracking-wider text-steel";
const rgb = (c: [number, number, number]) => `rgb(${c[0]},${c[1]},${c[2]})`;

const isMissingTable = (err: any) =>
  !!err && (err.code === "42P01" || err.code === "PGRST205" || /documents/.test(String(err.message ?? "")) && /exist|schema cache/i.test(String(err.message ?? "")));

const MigrationNotice = () => (
  <div className="border border-amber-300 bg-amber-50 p-6 flex gap-4">
    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
    <div className="text-sm text-navy space-y-2">
      <div className="font-medium">Falta crear la tabla de documentos en la base de datos.</div>
      <p className="text-steel">
        Abre Supabase → SQL Editor, pega el contenido del archivo
        <code className="mx-1 px-1 bg-white border border-border">supabase/migrations/20261106210000_create_documents.sql</code>
        y presiona <b>Run</b>. Después recarga esta página.
      </p>
    </div>
  </div>
);

// ═════════════════════════════════════════════════════════════════════════
// Lista de documentos
// ═════════════════════════════════════════════════════════════════════════

export const DocumentsList = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [list, setList] = useState<any[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [missing, setMissing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const [templateId, setTemplateId] = useState(DOCUMENT_TEMPLATES[0].id);
  const [clientId, setClientId] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [preview, setPreview] = useState<PdfPreview | null>(null);

  const load = async () => {
    setLoading(true);
    const [d, c] = await Promise.all([
      supabase.from("documents").select("*, clients(name, contact_name)").order("updated_at", { ascending: false }),
      supabase.from("clients").select("id, name, contact_name").order("name"),
    ]);
    setMissing(isMissingTable(d.error));
    setList(d.data ?? []);
    setClients((c.data as ClientRow[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const nextFolio = (t: DocumentTemplate) => {
    const prefix = `${t.folioPrefix}-${new Date().getFullYear()}-`;
    const max = list
      .map((d) => String(d.folio ?? ""))
      .filter((f) => f.startsWith(prefix))
      .map((f) => parseInt(f.slice(prefix.length), 10))
      .filter((n) => !Number.isNaN(n))
      .reduce((a, b) => Math.max(a, b), 0);
    return `${prefix}${String(max + 1).padStart(3, "0")}`;
  };

  const create = async () => {
    const t = findTemplate(templateId);
    if (!t) return;
    if (!clientId) {
      toast({ title: "Selecciona un cliente", description: "El documento se emite a nombre de un cliente registrado.", variant: "destructive" });
      return;
    }
    setCreating(true);
    const client = clients.find((c) => c.id === clientId);
    const data = emptyDocumentData(t);
    data.meta.recipient = client?.contact_name ?? "";
    const { data: row, error } = await supabase
      .from("documents")
      .insert({ folio: nextFolio(t), template: t.id, title: t.name, client_id: clientId, data: data as any, owner_id: user?.id })
      .select("id")
      .single();
    setCreating(false);
    if (error || !row) {
      console.error("[Documents.create]", error?.code ?? "error");
      if (isMissingTable(error)) setMissing(true);
      toast({ title: "No se pudo crear el documento", description: isMissingTable(error) ? "Falta crear la tabla en la base de datos." : "Intenta de nuevo.", variant: "destructive" });
      return;
    }
    setOpen(false);
    navigate(`/app/documents/${row.id}`);
  };

  const viewPdf = async (d: any) => {
    const t = findTemplate(d.template);
    if (!t) return;
    setBusy(d.id);
    try {
      if (preview) URL.revokeObjectURL(preview.url);
      setPreview(
        await previewDocumentPdf({
          template: t,
          folio: d.folio,
          data: normalizeDocumentData(t, d.data),
          client: { name: d.clients?.name ?? "Cliente", contact: d.clients?.contact_name },
        }),
      );
    } catch (e: any) {
      toast({ title: "No se pudo generar el PDF", description: e?.message ?? "Intenta de nuevo.", variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Entregables"
        title="Documentos"
        description="Diagnósticos, análisis de riesgo, dictámenes y demás documentos que se entregan al cliente."
        actions={
          <Button onClick={() => setOpen(true)} disabled={missing} className="rounded-none bg-navy hover:bg-navy-deep text-smoke text-xs uppercase tracking-wider h-10">
            <FilePlus2 className="h-4 w-4 mr-2" /> Nuevo documento
          </Button>
        }
      />

      {missing && <div className="mb-6"><MigrationNotice /></div>}

      <div className="border border-border bg-card">
        {loading ? (
          <div className="p-16 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-steel" /></div>
        ) : list.length === 0 ? (
          <div className="p-16 text-center">
            <FileStack className="h-8 w-8 text-olive mx-auto mb-3" />
            <div className="text-navy font-display text-lg">Sin documentos</div>
            <p className="text-sm text-steel mt-1">Crea el primer entregable a partir de una plantilla.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className={label}>Folio</TableHead>
                <TableHead className={label}>Documento</TableHead>
                <TableHead className={label}>Cliente</TableHead>
                <TableHead className={label}>Estado</TableHead>
                <TableHead className={label}>Actualizado</TableHead>
                <TableHead className={`${label} text-right`}>PDF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((d) => (
                <TableRow key={d.id} className="border-border cursor-pointer" onClick={() => navigate(`/app/documents/${d.id}`)}>
                  <TableCell className="font-medium text-navy">{d.folio}</TableCell>
                  <TableCell className="text-navy">{d.data?.meta?.title || findTemplate(d.template)?.name || d.title}</TableCell>
                  <TableCell className="text-steel text-sm">{d.clients?.name ?? "—"}</TableCell>
                  <TableCell className="text-steel text-sm">{STATUS_LABEL[d.status] ?? d.status}</TableCell>
                  <TableCell className="text-steel text-sm">{new Date(d.updated_at).toLocaleDateString("es")}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="ghost" className="rounded-none h-8 text-navy" onClick={() => viewPdf(d)} disabled={busy === d.id} aria-label={`Ver PDF de ${d.folio}`}>
                      {busy === d.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl rounded-none">
          <DialogHeader><DialogTitle className="font-display text-navy">Nuevo documento</DialogTitle></DialogHeader>
          <div className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-2">
              {DOCUMENT_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplateId(t.id)}
                  className={`text-left border p-4 transition-colors ${templateId === t.id ? "border-navy bg-secondary" : "border-border hover:bg-secondary/50"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-navy">{t.name}</span>
                    <span className="font-mono text-[11px] text-olive">{t.serviceCode}</span>
                  </div>
                  <p className="text-xs text-steel mt-1 leading-relaxed">{t.description}</p>
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <Label className={label}>Cliente</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger className="rounded-none"><SelectValue placeholder="Selecciona un cliente" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {clients.length === 0 && (
                <p className="text-xs text-steel">No hay clientes registrados. Créalo en <Link to="/app/clients" className="underline">Clientes</Link> o desde una cotización.</p>
              )}
            </div>
            <Button onClick={create} disabled={creating} className="w-full rounded-none bg-navy hover:bg-navy-deep text-smoke uppercase tracking-wider text-xs h-12">
              {creating ? "Creando…" : "Crear y empezar a llenar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <PdfPreviewDialog preview={preview} onClose={() => { if (preview) URL.revokeObjectURL(preview.url); setPreview(null); }} />
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════
// Editor de un documento
// ═════════════════════════════════════════════════════════════════════════

type SaveState = "idle" | "saving" | "saved" | "error";

export const DocumentEditor = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [row, setRow] = useState<any | null>(null);
  const [missing, setMissing] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [data, setData] = useState<DocumentData | null>(null);
  const [clientId, setClientId] = useState("");
  const [status, setStatus] = useState("draft");
  const [save, setSave] = useState<SaveState>("idle");
  const [preview, setPreview] = useState<PdfPreview | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const dirty = useRef(false);
  const backupKey = `stratec.doc.${id}`;

  const template = useMemo(() => (row ? findTemplate(row.template) : undefined), [row]);

  useEffect(() => {
    (async () => {
      const [d, c] = await Promise.all([
        supabase.from("documents").select("*").eq("id", id!).maybeSingle(),
        supabase.from("clients").select("id, name, contact_name").order("name"),
      ]);
      setClients((c.data as ClientRow[]) ?? []);
      if (d.error) {
        setMissing(isMissingTable(d.error));
        setNotFound(!isMissingTable(d.error));
        return;
      }
      if (!d.data) { setNotFound(true); return; }
      const t = findTemplate(d.data.template);
      if (!t) { setNotFound(true); return; }
      // Si hay un respaldo local más reciente (p. ej. falló el guardado), se usa ese
      let initial = normalizeDocumentData(t, d.data.data);
      try {
        const bk = JSON.parse(localStorage.getItem(`stratec.doc.${id}`) ?? "null");
        if (bk?.savedAt && new Date(bk.savedAt) > new Date(d.data.updated_at)) initial = normalizeDocumentData(t, bk.data);
      } catch { /* respaldo inválido: se ignora */ }
      setRow(d.data);
      setData(initial);
      setClientId(d.data.client_id ?? "");
      setStatus(d.data.status);
    })();
  }, [id]);

  // Guardado automático (1.2 s después del último cambio) + respaldo local inmediato
  useEffect(() => {
    if (!data || !row || !dirty.current) return;
    try { localStorage.setItem(backupKey, JSON.stringify({ savedAt: new Date().toISOString(), data })); } catch { /* sin espacio */ }
    setSave("saving");
    const h = setTimeout(async () => {
      const { error } = await supabase
        .from("documents")
        .update({ data: data as any, client_id: clientId || null, status, title: data.meta.title?.trim() || template?.name || row.title })
        .eq("id", row.id);
      if (error) {
        console.error("[Documents.save]", error.code ?? "error");
        setSave("error");
      } else {
        setSave("saved");
        localStorage.removeItem(backupKey);
      }
    }, 1200);
    return () => clearTimeout(h);
  }, [data, clientId, status]); // eslint-disable-line react-hooks/exhaustive-deps

  const patch = useCallback((fn: (d: DocumentData) => DocumentData) => {
    dirty.current = true;
    setData((d) => (d ? fn(d) : d));
  }, []);
  const setMeta = (k: keyof DocumentData["meta"], v: string) => patch((d) => ({ ...d, meta: { ...d.meta, [k]: v } }));
  const setSection = (k: string, v: string) => patch((d) => ({ ...d, sections: { ...d.sections, [k]: v } }));

  function listOps<K extends "findings" | "risks" | "actions">(key: K, make: () => DocumentData[K][number]) {
    type T = DocumentData[K][number];
    return {
      add: () => patch((d) => ({ ...d, [key]: [...(d[key] as T[]), make()] })),
      remove: (i: number) => patch((d) => ({ ...d, [key]: (d[key] as T[]).filter((_, idx) => idx !== i) })),
      update: (i: number, p: Partial<T>) => patch((d) => ({ ...d, [key]: (d[key] as T[]).map((x, idx) => (idx === i ? { ...x, ...p } : x)) })),
    };
  }
  const findingsOps = listOps("findings", newFinding);
  const risksOps = listOps("risks", newRisk);
  const actionsOps = listOps("actions", newAction);

  const viewPdf = async () => {
    if (!data || !template || !row) return;
    setPdfBusy(true);
    try {
      const c = clients.find((x) => x.id === clientId);
      if (preview) URL.revokeObjectURL(preview.url);
      setPreview(await previewDocumentPdf({ template, folio: row.folio, data, client: { name: c?.name ?? "Cliente", contact: c?.contact_name } }));
    } catch (e: any) {
      toast({ title: "No se pudo generar el PDF", description: e?.message ?? "Intenta de nuevo.", variant: "destructive" });
    } finally {
      setPdfBusy(false);
    }
  };

  if (missing) return <div><BackLink /><MigrationNotice /></div>;
  if (notFound) return <div><BackLink /><p className="text-steel">No se encontró el documento.</p></div>;
  if (!data || !template || !row) return <div className="p-16 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-steel" /></div>;

  return (
    <div className="pb-24">
      <BackLink />
      <PageHeader
        eyebrow={`${template.name} · ${row.folio}`}
        title={data.meta.title?.trim() || template.name}
        description={clients.find((c) => c.id === clientId)?.name ?? "Sin cliente"}
        actions={
          <div className="flex items-center gap-3">
            <SaveIndicator state={save} />
            <Select value={status} onValueChange={(v) => { dirty.current = true; setStatus(v); }}>
              <SelectTrigger className="rounded-none h-10 w-36 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{STATUS.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}</SelectContent>
            </Select>
            <Button onClick={viewPdf} disabled={pdfBusy} className="rounded-none bg-navy hover:bg-navy-deep text-smoke text-xs uppercase tracking-wider h-10">
              {pdfBusy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />} Vista previa PDF
            </Button>
          </div>
        }
      />

      <div className="space-y-6 max-w-5xl">
        {/* Datos generales */}
        <Card title="Datos generales" hint="Aparecen en la portada y en la ficha del documento.">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Título en portada (opcional)">
              <Input className="rounded-none" value={data.meta.title ?? ""} placeholder={template.name} onChange={(e) => setMeta("title", e.target.value)} />
            </Field>
            <Field label="Cliente">
              <Select value={clientId} onValueChange={(v) => { dirty.current = true; setClientId(v); }}>
                <SelectTrigger className="rounded-none"><SelectValue placeholder="Selecciona un cliente" /></SelectTrigger>
                <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Atención (quien recibe)">
              <Input className="rounded-none" value={data.meta.recipient ?? ""} onChange={(e) => setMeta("recipient", e.target.value)} />
            </Field>
            <Field label="Elaboró (consultor)">
              <Input className="rounded-none" value={data.meta.consultant ?? ""} placeholder="Nombre y cargo" onChange={(e) => setMeta("consultant", e.target.value)} />
            </Field>
            <Field label="Ubicación del inmueble">
              <Input className="rounded-none" value={data.meta.location ?? ""} placeholder="Calle, colonia, municipio, estado" onChange={(e) => setMeta("location", e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha de inspección">
                <Input type="date" className="rounded-none" value={data.meta.visitDate ?? ""} onChange={(e) => setMeta("visitDate", e.target.value)} />
              </Field>
              <Field label="Fecha de emisión">
                <Input type="date" className="rounded-none" value={data.meta.issueDate ?? ""} onChange={(e) => setMeta("issueDate", e.target.value)} />
              </Field>
            </div>
          </div>
        </Card>

        {template.blocks.map((b, i) => {
          const n = String(i + 1).padStart(2, "0");
          if (b.type === "text")
            return (
              <Card key={b.key} n={n} title={b.title} hint={b.hint}>
                <Textarea
                  className="rounded-none min-h-[160px] text-sm leading-relaxed"
                  value={data.sections[b.key] ?? ""}
                  onChange={(e) => setSection(b.key, e.target.value)}
                  placeholder="Escribe aquí. Deja una línea en blanco entre párrafos; inicia con «- » para viñetas."
                />
              </Card>
            );
          if (b.type === "findings")
            return (
              <Card key="findings" n={n} title={b.title} hint={b.hint} onAdd={findingsOps.add} addLabel="Agregar hallazgo">
                {data.findings.map((f, k) => (
                  <RowBox key={f.id} index={k} onRemove={() => findingsOps.remove(k)}>
                    <div className="grid sm:grid-cols-12 gap-2">
                      <Input className="rounded-none sm:col-span-4" placeholder="Área (p. ej. Acceso principal)" value={f.area} onChange={(e) => findingsOps.update(k, { area: e.target.value })} />
                      <div className="sm:col-span-3">
                        <Select value={f.severity} onValueChange={(v) => findingsOps.update(k, { severity: v as Severity })}>
                          <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
                          <SelectContent>{(Object.keys(SEVERITY_LABEL) as Severity[]).map((s) => <SelectItem key={s} value={s}>Severidad {SEVERITY_LABEL[s].toLowerCase()}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <Textarea className="rounded-none sm:col-span-12 text-sm" rows={2} placeholder="Descripción del hallazgo" value={f.description} onChange={(e) => findingsOps.update(k, { description: e.target.value })} />
                    </div>
                  </RowBox>
                ))}
              </Card>
            );
          if (b.type === "risks")
            return (
              <Card key="risks" n={n} title={b.title} hint={b.hint} onAdd={risksOps.add} addLabel="Agregar riesgo">
                {data.risks.map((r, k) => (
                  <RiskRow key={r.id} risk={r} index={k} onChange={(p) => risksOps.update(k, p)} onRemove={() => risksOps.remove(k)} />
                ))}
              </Card>
            );
          if (b.type === "heatmap")
            return (
              <Card key="heatmap" n={n} title={b.title} hint="Se genera solo a partir de la matriz de riesgos.">
                <HeatmapPreview risks={data.risks} />
              </Card>
            );
          if (b.type === "actions")
            return (
              <Card key="actions" n={n} title={b.title} hint={b.hint} onAdd={actionsOps.add} addLabel="Agregar acción">
                {data.actions.map((a, k) => (
                  <RowBox key={a.id} index={k} onRemove={() => actionsOps.remove(k)}>
                    <div className="grid sm:grid-cols-12 gap-2">
                      <Textarea className="rounded-none sm:col-span-12 text-sm" rows={2} placeholder="Acción recomendada" value={a.action} onChange={(e) => actionsOps.update(k, { action: e.target.value })} />
                      <div className="sm:col-span-3">
                        <Select value={a.priority} onValueChange={(v) => actionsOps.update(k, { priority: v as Priority })}>
                          <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
                          <SelectContent>{(Object.keys(PRIORITY_LABEL) as Priority[]).map((p) => <SelectItem key={p} value={p}>Prioridad {PRIORITY_LABEL[p].toLowerCase()}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="sm:col-span-4">
                        <Select value={a.term} onValueChange={(v) => actionsOps.update(k, { term: v as Term })}>
                          <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
                          <SelectContent>{(Object.keys(TERM_LABEL) as Term[]).map((t) => <SelectItem key={t} value={t}>{TERM_LABEL[t]}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <Input className="rounded-none sm:col-span-5" placeholder="Responsable" value={a.responsible} onChange={(e) => actionsOps.update(k, { responsible: e.target.value })} />
                    </div>
                  </RowBox>
                ))}
              </Card>
            );
          if (b.type === "verdict")
            return (
              <Card key="verdict" n={n} title={b.title} hint={b.hint}>
                <div className="grid sm:grid-cols-3 gap-2">
                  {(Object.keys(VERDICT_LABEL) as Verdict[]).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => patch((d) => ({ ...d, verdict: v }))}
                      className={`border p-4 text-sm text-left transition-colors ${data.verdict === v ? "border-navy bg-secondary text-navy font-medium" : "border-border text-steel hover:bg-secondary/50"}`}
                    >
                      <span className="inline-block h-2.5 w-2.5 mr-2 align-middle" style={{ background: rgb(LEVEL_RGB[v === "favorable" ? "bajo" : v === "condicionado" ? "medio" : "critico"]) }} />
                      {VERDICT_LABEL[v]}
                    </button>
                  ))}
                </div>
              </Card>
            );
          return null;
        })}
      </div>

      <PdfPreviewDialog preview={preview} onClose={() => { if (preview) URL.revokeObjectURL(preview.url); setPreview(null); }} />
    </div>
  );
};

// ─── Piezas de UI ───────────────────────────────────────────────────────────

const BackLink = () => (
  <Link to="/app/documents" className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-steel hover:text-navy mb-4">
    <ArrowLeft className="h-3.5 w-3.5" /> Documentos
  </Link>
);

const SaveIndicator = ({ state }: { state: SaveState }) => (
  <span className="text-xs text-steel min-w-[92px] text-right">
    {state === "saving" && <span className="inline-flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />Guardando…</span>}
    {state === "saved" && <span className="inline-flex items-center gap-1"><Check className="h-3 w-3 text-olive" />Guardado</span>}
    {state === "error" && <span className="inline-flex items-center gap-1 text-red-700"><AlertTriangle className="h-3 w-3" />Sin guardar</span>}
  </span>
);

const Field = ({ label: l, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <Label className={label}>{l}</Label>
    {children}
  </div>
);

const Card = ({ n, title, hint, children, onAdd, addLabel }: { n?: string; title: string; hint?: string; children: React.ReactNode; onAdd?: () => void; addLabel?: string }) => (
  <section className="border border-border bg-card">
    <header className="px-5 py-4 border-b border-border flex items-start justify-between gap-4">
      <div>
        <div className="flex items-baseline gap-3">
          {n && <span className="font-display text-olive text-lg">{n}</span>}
          <h2 className="font-display text-navy text-lg">{title}</h2>
        </div>
        {hint && <p className="text-xs text-steel mt-1">{hint}</p>}
      </div>
      {onAdd && (
        <Button type="button" size="sm" variant="ghost" onClick={onAdd} className="rounded-none text-xs h-8 shrink-0">
          <Plus className="h-3 w-3 mr-1" />{addLabel}
        </Button>
      )}
    </header>
    <div className="p-5 space-y-3">{children}</div>
  </section>
);

const RowBox = ({ index, onRemove, children }: { index: number; onRemove: () => void; children: React.ReactNode }) => (
  <div className="border border-border bg-secondary/20 p-3 flex gap-3">
    <span className="font-mono text-xs text-olive pt-2.5 w-6 shrink-0">{String(index + 1).padStart(2, "0")}</span>
    <div className="flex-1 min-w-0">{children}</div>
    <Button type="button" size="icon" variant="ghost" className="h-9 w-9 shrink-0" onClick={onRemove} aria-label="Quitar">
      <Trash2 className="h-4 w-4 text-steel" />
    </Button>
  </div>
);

const LevelBadge = ({ score }: { score: number }) => {
  const lvl = riskLevel(score);
  return (
    <span className="inline-flex items-center justify-center px-2 h-9 text-[11px] uppercase tracking-wider text-white font-medium w-full" style={{ background: rgb(LEVEL_RGB[lvl]) }}>
      {RISK_LEVEL_LABEL[lvl]} · {score}
    </span>
  );
};

const RiskRow = ({ risk: r, index, onChange, onRemove }: { risk: Risk; index: number; onChange: (p: Partial<Risk>) => void; onRemove: () => void }) => (
  <RowBox index={index} onRemove={onRemove}>
    <div className="grid sm:grid-cols-12 gap-2">
      <Input className="rounded-none sm:col-span-12 font-medium" placeholder={`R-${String(index + 1).padStart(2, "0")} · Nombre del riesgo (p. ej. Robo a mano armada en recepción)`} value={r.name} onChange={(e) => onChange({ name: e.target.value })} />
      <Input className="rounded-none sm:col-span-6" placeholder="Causa / amenaza" value={r.cause} onChange={(e) => onChange({ cause: e.target.value })} />
      <Input className="rounded-none sm:col-span-6" placeholder="Consecuencia" value={r.consequence} onChange={(e) => onChange({ consequence: e.target.value })} />
      <div className="sm:col-span-4">
        <Select value={String(r.probability)} onValueChange={(v) => onChange({ probability: Number(v) })}>
          <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
          <SelectContent>{[1, 2, 3, 4, 5].map((p) => <SelectItem key={p} value={String(p)}>Probabilidad {p} · {PROBABILITY_LABEL[p]}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="sm:col-span-4">
        <Select value={String(r.impact)} onValueChange={(v) => onChange({ impact: Number(v) })}>
          <SelectTrigger className="rounded-none"><SelectValue /></SelectTrigger>
          <SelectContent>{[1, 2, 3, 4, 5].map((p) => <SelectItem key={p} value={String(p)}>Impacto {p} · {IMPACT_LABEL[p]}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="sm:col-span-4"><LevelBadge score={riskScore(r)} /></div>
      <Input className="rounded-none sm:col-span-6" placeholder="Controles existentes" value={r.controls} onChange={(e) => onChange({ controls: e.target.value })} />
      <Input className="rounded-none sm:col-span-6" placeholder="Tratamiento propuesto" value={r.treatment} onChange={(e) => onChange({ treatment: e.target.value })} />
    </div>
  </RowBox>
);

const HeatmapPreview = ({ risks }: { risks: Risk[] }) => (
  <div className="flex gap-6 flex-wrap items-start">
    <div>
      <div className="text-[10px] uppercase tracking-wider text-steel mb-1">Probabilidad ↑ · Impacto →</div>
      <div className="grid grid-cols-5 gap-0.5 w-[260px]">
        {[5, 4, 3, 2, 1].flatMap((p) =>
          [1, 2, 3, 4, 5].map((im) => {
            const ids = risks.map((r, i) => ({ r, i })).filter(({ r }) => r.probability === p && r.impact === im).map(({ i }) => `R-${String(i + 1).padStart(2, "0")}`);
            const c = LEVEL_RGB[riskLevel(p * im)];
            return (
              <div key={`${p}-${im}`} className="aspect-square flex items-center justify-center text-[9px] text-white font-medium text-center leading-tight" style={{ background: rgb(c), opacity: ids.length ? 1 : 0.3 }} title={`P${p} × I${im}`}>
                {ids.slice(0, 2).join(" ")}{ids.length > 2 ? ` +${ids.length - 2}` : ""}
              </div>
            );
          }),
        )}
      </div>
    </div>
    <div className="text-sm text-steel space-y-1 pt-5">
      {(["critico", "alto", "medio", "bajo"] as const).map((l) => (
        <div key={l} className="flex items-center gap-2">
          <span className="h-3 w-3 inline-block" style={{ background: rgb(LEVEL_RGB[l]) }} />
          {RISK_LEVEL_LABEL[l]}: <b className="text-navy">{risks.filter((r) => riskLevel(riskScore(r)) === l).length}</b>
        </div>
      ))}
    </div>
  </div>
);
