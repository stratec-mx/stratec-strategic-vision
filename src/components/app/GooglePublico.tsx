// Sección del panel con datos de Google: qué buscan, cuántos te ven y te visitan,
// de dónde llegan y qué hacen en el sitio. Solo administradores (la función
// google-insights también lo verifica).
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, RefreshCw, Search, Users, AlertTriangle, Lightbulb } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  CANAL, DISPOSITIVO, EVENTO, MOTIVO, lecturas, motivoDe, rutaCorta, segundos, variacion,
  type Consulta, type DatosGoogle,
} from "@/lib/googleInsights";

const fmt = (n: number) => n.toLocaleString("es-MX");
const diaCorto = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
const tooltipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 0, fontSize: 12 };

export const GooglePublico = () => {
  const [dias, setDias] = useState("28");
  const [datos, setDatos] = useState<DatosGoogle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async (refrescar = false) => {
    setCargando(true);
    setError(null);
    const { data, error: err } = await supabase.functions.invoke("google-insights", { body: { dias: Number(dias), refrescar } });
    setCargando(false);
    if (err || !data) {
      // 404: la función todavía no está publicada en Supabase
      const status = (err as { context?: { status?: number } } | null)?.context?.status;
      setError(status === 404 ? "sin_funcion" : "No se pudieron cargar los datos de Google.");
      return;
    }
    setDatos(data as DatosGoogle);
  }, [dias]);

  useEffect(() => { cargar(); }, [cargar]);

  const sinConfigurar = error === "sin_funcion" || (datos && motivoDe(datos.gsc) === "sin_configurar" && motivoDe(datos.ga4) === "sin_configurar");

  return (
    <section className="mt-2">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <div className="eyebrow mb-1">Tu público en Google</div>
          <div className="font-display text-xl text-navy">Qué buscan, de dónde llegan y qué hacen en tu sitio</div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dias} onValueChange={setDias}>
            <SelectTrigger className="rounded-none h-9 w-36 text-xs" aria-label="Periodo"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 días</SelectItem>
              <SelectItem value="28">Últimos 28 días</SelectItem>
              <SelectItem value="90">Últimos 90 días</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => cargar(true)} disabled={cargando} className="rounded-none h-9 border-navy text-navy" aria-label="Actualizar datos de Google">
            {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {cargando && !datos ? (
        <div className="border border-border bg-card p-16 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-steel" /></div>
      ) : sinConfigurar ? (
        <Configurar cuenta={datos?.cuenta ?? null} />
      ) : error ? (
        <Aviso texto={error} />
      ) : datos ? (
        <div className={`space-y-6 transition-opacity ${cargando ? "opacity-60" : ""}`}>
          <Lecturas datos={datos} />
          <BloqueSearchConsole datos={datos} />
          <BloqueAnalytics datos={datos} />
          <p className="text-[11px] text-steel">
            Search Console tarda unos 3 días en tener los datos completos y Analytics, 1 día; por eso los periodos terminan antes de hoy.
            Actualizado {new Date(datos.generado).toLocaleString("es-MX", { timeZone: "America/Mexico_City", dateStyle: "short", timeStyle: "short" })}
          </p>
        </div>
      ) : null}
    </section>
  );
};

// ─── Bloques ────────────────────────────────────────────────────────────────

const Lecturas = ({ datos }: { datos: DatosGoogle }) => {
  const l = lecturas(datos);
  if (!l.length) return null;
  return (
    <div className="border border-border bg-card p-6">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="h-4 w-4 text-olive" />
        <div className="font-display text-lg text-navy">En pocas palabras</div>
      </div>
      <ul className="space-y-1.5 text-sm text-navy list-disc pl-5">
        {l.map((t) => <li key={t}>{t}</li>)}
      </ul>
    </div>
  );
};

const BloqueSearchConsole = ({ datos }: { datos: DatosGoogle }) => {
  const g = datos.gsc;
  return (
    <div className="space-y-4">
      <Titulo icono={Search} texto="Búsquedas en Google" sub="Search Console" rango={g.ok ? g.rango : undefined} />
      {!g.ok ? <Aviso texto={MOTIVO[motivoDe(g) ?? "error"]} /> : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Dato etiqueta="Clics" valor={fmt(g.totales.actual.clics)} delta={variacion(g.totales.actual.clics, g.totales.anterior.clics)} ayuda="veces que te eligieron en Google" />
            <Dato etiqueta="Impresiones" valor={fmt(g.totales.actual.impresiones)} delta={variacion(g.totales.actual.impresiones, g.totales.anterior.impresiones)} ayuda="veces que apareciste en resultados" />
            <Dato etiqueta="CTR" valor={`${g.totales.actual.ctr}%`} delta={variacion(g.totales.actual.ctr, g.totales.anterior.ctr)} ayuda="de cada 100 que te ven, cuántos entran" />
            <Dato etiqueta="Posición media" valor={g.totales.actual.posicion ? String(g.totales.actual.posicion) : "—"} delta={variacion(g.totales.actual.posicion, g.totales.anterior.posicion)} menosEsMejor ayuda="1 = primer resultado" />
          </div>
          {g.diario.length > 1 && (
            <Tarjeta titulo="Clics e impresiones por día">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={g.diario.map((x) => ({ ...x, d: diaCorto(x.fecha) }))} margin={{ top: 5, right: 4, bottom: 5, left: -10 }}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="d" tick={{ fontSize: 11, fill: "hsl(var(--steel))" }} axisLine={false} tickLine={false} minTickGap={16} />
                    <YAxis yAxisId="i" tick={{ fontSize: 11, fill: "hsl(var(--steel))" }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="c" orientation="right" allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--steel))" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line yAxisId="i" type="monotone" dataKey="impresiones" name="Impresiones" stroke="hsl(var(--steel))" strokeWidth={1.5} dot={false} />
                    <Line yAxisId="c" type="monotone" dataKey="clics" name="Clics" stroke="#B48D36" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <Leyenda items={[["Impresiones", "hsl(var(--steel))"], ["Clics", "#B48D36"]]} />
            </Tarjeta>
          )}
          <div className="grid lg:grid-cols-2 gap-4">
            <Tarjeta titulo="Lo que más buscan antes de llegar" nota="Ordenado por clics">
              <TablaConsultas filas={g.consultas} vacio="Aún no hay búsquedas con datos en este periodo." />
            </Tarjeta>
            <div className="space-y-4">
              <Tarjeta titulo="Oportunidades" nota="Te ven seguido pero casi no te dan clic">
                <TablaConsultas filas={g.oportunidades} vacio="Sin oportunidades claras en este periodo." />
              </Tarjeta>
              <Tarjeta titulo="Páginas que más aparecen en Google">
                <Barras filas={g.paginas.map((p) => ({ nombre: rutaCorta(p.clave), valor: p.clics, extra: `${fmt(p.impresiones)} impr.` }))} unidad="clics" />
              </Tarjeta>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const BloqueAnalytics = ({ datos }: { datos: DatosGoogle }) => {
  const a = datos.ga4;
  return (
    <div className="space-y-4">
      <Titulo icono={Users} texto="Visitantes del sitio" sub="Google Analytics" rango={a.ok ? a.rango : undefined} />
      {!a.ok ? <Aviso texto={MOTIVO[motivoDe(a) ?? "error"]} /> : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Dato etiqueta="Visitantes" valor={fmt(a.totales.actual.usuarios)} delta={variacion(a.totales.actual.usuarios, a.totales.anterior.usuarios)} ayuda="personas distintas" />
            <Dato etiqueta="Nuevos" valor={fmt(a.totales.actual.nuevos)} delta={variacion(a.totales.actual.nuevos, a.totales.anterior.nuevos)} ayuda="primera vez en el sitio" />
            <Dato etiqueta="Visitas" valor={fmt(a.totales.actual.sesiones)} delta={variacion(a.totales.actual.sesiones, a.totales.anterior.sesiones)} ayuda="sesiones" />
            <Dato etiqueta="Interacción" valor={`${a.totales.actual.interaccion}%`} delta={variacion(a.totales.actual.interaccion, a.totales.anterior.interaccion)} ayuda="visitas en que sí leyeron o hicieron algo" />
            <Dato etiqueta="Tiempo medio" valor={segundos(a.totales.actual.duracion)} delta={variacion(a.totales.actual.duracion, a.totales.anterior.duracion)} ayuda="por visita" />
          </div>
          {a.diario.length > 1 && (
            <Tarjeta titulo="Visitantes por día">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={a.diario.map((x) => ({ ...x, d: diaCorto(x.fecha) }))} margin={{ top: 5, right: 12, bottom: 5, left: -10 }}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="d" tick={{ fontSize: 11, fill: "hsl(var(--steel))" }} axisLine={false} tickLine={false} minTickGap={16} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--steel))" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="usuarios" name="Visitantes" stroke="hsl(var(--navy))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Tarjeta>
          )}
          <div className="grid lg:grid-cols-3 gap-4">
            <Tarjeta titulo="Cómo llegan">
              <Barras filas={a.canales.map((c) => ({ nombre: CANAL[c.nombre] ?? c.nombre, valor: c.sesiones }))} unidad="visitas" />
            </Tarjeta>
            <Tarjeta titulo="Desde qué ciudad">
              <Barras filas={a.ciudades.map((c) => ({ nombre: c.nombre === "(not set)" ? "Sin identificar" : c.nombre, valor: c.usuarios }))} unidad="visitantes" />
            </Tarjeta>
            <Tarjeta titulo="Con qué dispositivo">
              <Barras filas={a.dispositivos.map((c) => ({ nombre: DISPOSITIVO[c.nombre] ?? c.nombre, valor: c.usuarios }))} unidad="visitantes" />
            </Tarjeta>
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <Tarjeta titulo="Páginas por donde entran" nota="% = visitas con interacción">
              <Barras filas={a.entradas.map((e) => ({ nombre: rutaCorta(e.pagina), valor: e.sesiones, extra: `${e.interaccion}%` }))} unidad="visitas" />
            </Tarjeta>
            <Tarjeta titulo="Qué hacen en el sitio" nota="Acciones de interés">
              <Barras filas={a.acciones.map((e) => ({ nombre: EVENTO[e.evento] ?? e.evento, valor: e.total }))} unidad="veces" vacio="Sin acciones registradas en este periodo." />
            </Tarjeta>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Piezas ─────────────────────────────────────────────────────────────────

const Titulo = ({ icono: Icono, texto, sub, rango }: { icono: typeof Search; texto: string; sub: string; rango?: { inicio: string; fin: string } }) => (
  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border pb-2">
    <Icono className="h-4 w-4 text-olive self-center" />
    <span className="font-display text-lg text-navy">{texto}</span>
    <span className="text-[10px] uppercase tracking-[0.2em] text-steel">{sub}</span>
    {rango && <span className="text-xs text-steel ml-auto">{diaCorto(rango.inicio)} – {diaCorto(rango.fin)}</span>}
  </div>
);

const Dato = ({ etiqueta, valor, delta, ayuda, menosEsMejor }: { etiqueta: string; valor: string; delta: number | null; ayuda: string; menosEsMejor?: boolean }) => {
  const bueno = delta == null || delta === 0 ? null : menosEsMejor ? delta < 0 : delta > 0;
  return (
    <div className="border border-border bg-card p-4">
      <div className="text-[10px] uppercase tracking-[0.2em] text-steel">{etiqueta}</div>
      <div className="mt-2 font-display text-2xl text-navy font-light">{valor}</div>
      <div className="mt-1 text-[11px] text-steel leading-snug">
        {delta != null && delta !== 0 && (
          <span className={`font-medium mr-1 ${bueno ? "text-green-700" : "text-red-700"}`}>{delta > 0 ? "▲" : "▼"} {Math.abs(delta)}%</span>
        )}
        {ayuda}
      </div>
    </div>
  );
};

const Tarjeta = ({ titulo, nota, children }: { titulo: string; nota?: string; children: React.ReactNode }) => (
  <div className="border border-border bg-card p-5">
    <div className="flex items-baseline justify-between gap-3 mb-3">
      <div className="text-sm font-medium text-navy">{titulo}</div>
      {nota && <div className="text-[11px] text-steel text-right">{nota}</div>}
    </div>
    {children}
  </div>
);

const Barras = ({ filas, unidad, vacio = "Sin datos en este periodo." }: { filas: { nombre: string; valor: number; extra?: string }[]; unidad: string; vacio?: string }) => {
  const max = Math.max(1, ...filas.map((f) => f.valor));
  if (!filas.length) return <p className="text-sm text-steel py-4 text-center">{vacio}</p>;
  return (
    <ul className="space-y-2.5">
      {filas.map((f, i) => (
        <li key={`${f.nombre}-${i}`}>
          <div className="flex items-baseline justify-between gap-3 text-xs">
            <span className="text-navy truncate" title={f.nombre}>{f.nombre}</span>
            <span className="text-steel whitespace-nowrap">{fmt(f.valor)} <span className="sr-only">{unidad}</span>{f.extra && <span className="ml-2 text-steel/80">{f.extra}</span>}</span>
          </div>
          <div className="mt-1 h-1.5 bg-secondary"><div className="h-full bg-navy/70" style={{ width: `${(f.valor / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
};

const TablaConsultas = ({ filas, vacio }: { filas: Consulta[]; vacio: string }) =>
  !filas.length ? <p className="text-sm text-steel py-4 text-center">{vacio}</p> : (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wider text-steel border-b border-border">
            <th className="py-2 pr-2 font-medium">Búsqueda</th>
            <th className="py-2 px-2 font-medium text-right">Clics</th>
            <th className="py-2 px-2 font-medium text-right">Impr.</th>
            <th className="py-2 px-2 font-medium text-right">CTR</th>
            <th className="py-2 pl-2 font-medium text-right" title="Posición media en Google">Pos.</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {filas.map((f) => (
            <tr key={f.clave}>
              <td className="py-1.5 pr-2 text-navy">{f.clave}</td>
              <td className="py-1.5 px-2 text-right text-navy">{fmt(f.clics)}</td>
              <td className="py-1.5 px-2 text-right text-steel">{fmt(f.impresiones)}</td>
              <td className="py-1.5 px-2 text-right text-steel">{f.ctr}%</td>
              <td className="py-1.5 pl-2 text-right text-steel">{f.posicion}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

const Leyenda = ({ items }: { items: [string, string][] }) => (
  <div className="mt-2 flex gap-4 text-[11px] text-steel">
    {items.map(([t, c]) => <span key={t} className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 inline-block" style={{ background: c }} />{t}</span>)}
  </div>
);

const Aviso = ({ texto }: { texto: string }) => (
  <div className="border border-amber-300 bg-amber-50 p-4 flex gap-3 text-sm text-navy">
    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
    <span>{texto}</span>
  </div>
);

const Configurar = ({ cuenta }: { cuenta: string | null }) => (
  <div className="border border-border bg-card p-6 text-sm text-navy space-y-3">
    <div className="font-display text-lg">Conecta Search Console y Google Analytics</div>
    <p className="text-steel">
      Esta sección mostrará las búsquedas con las que te encuentran, los clics e impresiones, y de dónde llegan tus visitantes.
      Falta darle al panel acceso de solo lectura a tus cuentas de Google. Los pasos están en <code className="px-1 bg-secondary">docs/google-insights.md</code>.
    </p>
    {cuenta && (
      <p className="text-steel">Cuenta que debes agregar como usuario en Search Console y en Analytics: <span className="text-navy font-medium break-all">{cuenta}</span></p>
    )}
  </div>
);
