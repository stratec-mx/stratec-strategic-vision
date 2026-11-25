// Panel del exterior: datos del inmueble, ubicación (F-01), predio (F-02), colindancias (F-03)
// y elementos (F-05 a F-07).

import { useState } from "react";
import { Crosshair, Loader2, LocateFixed, MapPin, Pencil, Route, Search, Trash2, Footprints, ZoomIn } from "lucide-react";
import {
  area, fmtM, fmtM2, lados, largoLinea, leerCoordenadas, perimetro, LEYENDA_MEDIDAS, ORIENTACION_ETIQUETA, ORIENTACIONES,
  type LngLat, type Orientacion,
} from "@/lib/plano/geo";
import {
  ESTADO_INFO, ESTADOS, METODO_ETIQUETA, TIPO_COLINDANCIA_ETIQUETA, TIPOS_COLINDANCIA,
  type EstadoProyecto, type Inmueble, type MetodoMedicion, type TipoColindancia,
} from "@/lib/plano/inmuebles";
import { SIMBOLOS, TIPOS_SIMBOLO, type DatosCamara } from "@/lib/plano/simbolos";
import type { HerramientaMapa } from "./MapaInmuebles";

const campo = "w-full rounded-md border border-pn-borde bg-white px-2.5 py-2 text-[14px] text-pn-texto";
const etiqueta = "mb-1 block text-[12px] font-medium text-pn-sub";
const tarjeta = "rounded-md border border-pn-borde bg-white p-3";
const botonSec = "flex items-center justify-center gap-1.5 rounded-md border border-pn-borde bg-white px-3 py-2.5 text-[13px] font-medium text-pn-texto hover:bg-pn-calido disabled:opacity-50";
const botonPri = "flex items-center justify-center gap-1.5 rounded-md bg-pn-navy px-3 py-2.5 text-[13px] font-medium text-white disabled:opacity-50";

interface ResultadoBusqueda {
  nombre: string;
  p: LngLat;
}

async function buscarDireccion(q: string): Promise<ResultadoBusqueda[]> {
  // Nominatim (OpenStreetMap): búsqueda puntual al pulsar "Buscar", no mientras se escribe.
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=mx&accept-language=es&q=${encodeURIComponent(q)}`;
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error("La búsqueda no respondió.");
  const j = (await r.json()) as { display_name: string; lon: string; lat: string }[];
  return j.map((x) => ({ nombre: x.display_name, p: [Number(x.lon), Number(x.lat)] }));
}

export interface Cliente {
  id: string;
  name: string;
}

interface Props {
  inm: Inmueble;
  cambiar: (f: (i: Inmueble) => Inmueble) => void;
  borrar: () => void;
  clientes: Cliente[] | null;
  herramienta: HerramientaMapa;
  setHerramienta: (h: HerramientaMapa) => void;
  elementoSel: string | null;
  setElementoSel: (id: string | null) => void;
  ladoSel: number | null;
  setLadoSel: (i: number | null) => void;
  ubicarConGps: () => void;
  gpsBuscando: boolean;
  gpsError: string | null;
  volarA: (p: LngLat, zoom?: number) => void;
}

export function PanelExterior(p: Props) {
  const { inm, cambiar, herramienta, setHerramienta } = p;
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState<ResultadoBusqueda[] | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);

  const anillo: LngLat[] = inm.perimetro.map((v) => [v.lng, v.lat]);
  const tienePredio = anillo.length >= 3;
  const ls = tienePredio ? lados(anillo) : [];
  const gpsVs = inm.perimetro.filter((v) => v.origen === "gps" && v.precision !== undefined);
  const precisionMedia = gpsVs.length ? gpsVs.reduce((s, v) => s + (v.precision ?? 0), 0) / gpsVs.length : null;
  const elSel = inm.elementos.find((e) => e.id === p.elementoSel) ?? null;

  const fijarUbicacion = (pt: LngLat) => {
    cambiar((i) => ({ ...i, ubicacion: { lng: pt[0], lat: pt[1], fecha: new Date().toISOString() } }));
    p.volarA(pt, 18);
  };

  const buscar = async () => {
    const texto = q.trim();
    if (!texto) return;
    setErrorBusqueda(null);
    const coords = leerCoordenadas(texto);
    if (coords) {
      fijarUbicacion(coords);
      setResultados(null);
      return;
    }
    setBuscando(true);
    try {
      const r = await buscarDireccion(texto);
      setResultados(r);
      if (!r.length) setErrorBusqueda("No se encontró esa dirección. Prueba con calle, colonia y municipio, o pega coordenadas.");
    } catch {
      setErrorBusqueda("No se pudo buscar. Revisa la conexión o pega las coordenadas.");
    } finally {
      setBuscando(false);
    }
  };

  const setCol = (i: number, c: Partial<Inmueble["colindancias"][number]>) =>
    cambiar((x) => {
      const cols = [...x.colindancias];
      while (cols.length < x.perimetro.length) cols.push({});
      cols[i] = { ...cols[i], ...c };
      return { ...x, colindancias: cols };
    });

  const setCamara = (c: Partial<DatosCamara>) =>
    elSel && cambiar((x) => ({ ...x, elementos: x.elementos.map((e) => (e.id === elSel.id && e.camara ? { ...e, camara: { ...e.camara, ...c } } : e)) }));

  return (
    <div className="flex flex-col gap-3">
      {/* Datos */}
      <section className={tarjeta} aria-label="Datos del inmueble">
        <label className="mb-2 block">
          <span className={etiqueta}>Nombre del inmueble</span>
          <input value={inm.nombre} onChange={(e) => cambiar((x) => ({ ...x, nombre: e.target.value }))} className={campo} />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label>
            <span className={etiqueta}>Municipio</span>
            <input value={inm.municipio} onChange={(e) => cambiar((x) => ({ ...x, municipio: e.target.value }))} className={campo} />
          </label>
          <label>
            <span className={etiqueta}>Estado del proyecto</span>
            <select value={inm.estado} onChange={(e) => cambiar((x) => ({ ...x, estado: e.target.value as EstadoProyecto }))} className={campo}>
              {ESTADOS.map((s) => (
                <option key={s} value={s}>{ESTADO_INFO[s].etiqueta}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="mt-2 block">
          <span className={etiqueta}>Cliente (de la lista de Clientes, solo lectura)</span>
          {p.clientes && p.clientes.length > 0 ? (
            <select
              value={inm.clienteId ?? ""}
              onChange={(e) => {
                const c = p.clientes!.find((x) => x.id === e.target.value);
                cambiar((x) => ({ ...x, clienteId: c?.id, clienteNombre: c?.name ?? "Cliente ficticio" }));
              }}
              className={campo}
            >
              <option value="">Cliente ficticio (prueba)</option>
              {p.clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          ) : (
            <p className="rounded-md bg-pn-calido px-2.5 py-2 text-[13px] text-pn-sub">
              {inm.clienteNombre ?? "Cliente ficticio"}. {p.clientes === null ? "Cargando clientes…" : "No hay clientes disponibles para tu rol."}
            </p>
          )}
        </label>
      </section>

      {/* Ubicación */}
      <section className={tarjeta} aria-label="Ubicación">
        <h3 className="mb-2 text-[13px] font-semibold text-pn-texto">1 · Ubicación</h3>
        {inm.ubicacion ? (
          <p className="mb-2 text-[13px] text-pn-texto">
            {inm.ubicacion.lat.toFixed(6)}, {inm.ubicacion.lng.toFixed(6)}
            {inm.ubicacion.precision !== undefined && <span className="text-pn-sub"> · precisión GPS ± {Math.round(inm.ubicacion.precision)} m</span>}
          </p>
        ) : (
          <p className="mb-2 text-[13px] text-pn-sub">Sin ubicación.</p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={p.ubicarConGps} disabled={p.gpsBuscando} className={botonSec}>
            {p.gpsBuscando ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />} Usar mi GPS
          </button>
          <button type="button" onClick={() => setHerramienta(herramienta === "ubicar" ? "navegar" : "ubicar")} className={herramienta === "ubicar" ? botonPri : botonSec}>
            <MapPin className="h-4 w-4" /> Tocar en el mapa
          </button>
        </div>
        {p.gpsError && <p className="mt-2 text-[12px] text-pn-alerta">{p.gpsError}</p>}
        <form
          className="mt-2 flex gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            void buscar();
          }}
        >
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Dirección o coordenadas pegadas" aria-label="Buscar dirección o pegar coordenadas" className={campo} />
          <button type="submit" className={botonSec} aria-label="Buscar" disabled={buscando}>
            {buscando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </button>
        </form>
        {errorBusqueda && <p className="mt-1.5 text-[12px] text-pn-alerta">{errorBusqueda}</p>}
        {resultados && resultados.length > 0 && (
          <ul className="mt-1.5 flex flex-col gap-1">
            {resultados.map((r) => (
              <li key={`${r.p[0]},${r.p[1]}`}>
                <button
                  type="button"
                  onClick={() => {
                    fijarUbicacion(r.p);
                    setResultados(null);
                  }}
                  className="w-full rounded px-2 py-1.5 text-left text-[12.5px] text-pn-texto hover:bg-pn-calido"
                >
                  {r.nombre}
                </button>
              </li>
            ))}
            <li className="px-2 text-[11px] text-pn-sub">Búsqueda: © colaboradores de OpenStreetMap (Nominatim)</li>
          </ul>
        )}
      </section>

      {/* Predio */}
      <section className={tarjeta} aria-label="Predio">
        <h3 className="mb-2 text-[13px] font-semibold text-pn-texto">2 · Delimitar el predio</h3>
        <label className="mb-2 block">
          <span className={etiqueta}>Origen de las medidas</span>
          <select value={inm.metodo} onChange={(e) => cambiar((x) => ({ ...x, metodo: e.target.value as MetodoMedicion }))} className={campo}>
            {(Object.keys(METODO_ETIQUETA) as MetodoMedicion[]).map((m) => (
              <option key={m} value={m}>{METODO_ETIQUETA[m]}</option>
            ))}
          </select>
        </label>
        {inm.metodo === "plano_cliente" && (
          <p className="mb-2 rounded-md bg-pn-calido px-2.5 py-2 text-[12px] text-pn-sub">
            Coloca los vértices según las medidas del plano del cliente. En la versión con base de datos el plano se sube como anexo.
          </p>
        )}
        {tienePredio && (
          <dl className="mb-2 grid grid-cols-2 gap-x-3 gap-y-1 rounded-md bg-pn-calido px-3 py-2 text-[13px]">
            <dt className="text-pn-sub">Superficie</dt>
            <dd className="tnum font-semibold text-pn-texto">{fmtM2(area(anillo))}</dd>
            <dt className="text-pn-sub">Perímetro</dt>
            <dd className="tnum font-semibold text-pn-texto">{fmtM(perimetro(anillo))}</dd>
            <dt className="text-pn-sub">Vértices</dt>
            <dd className="tnum text-pn-texto">{anillo.length}</dd>
            {precisionMedia !== null && (
              <>
                <dt className="text-pn-sub">Precisión GPS</dt>
                <dd className="tnum text-pn-texto">± {Math.round(precisionMedia)} m en promedio</dd>
              </>
            )}
          </dl>
        )}
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setHerramienta("recorrido")} className={herramienta === "recorrido" ? botonPri : botonSec}>
            <Footprints className="h-4 w-4" /> Recorrido GPS
          </button>
          <button type="button" onClick={() => setHerramienta(herramienta === "vertices" ? "navegar" : "vertices")} className={herramienta === "vertices" ? botonPri : botonSec}>
            <Crosshair className="h-4 w-4" /> Vértices a mano
          </button>
          {tienePredio && (
            <button type="button" onClick={() => setHerramienta(herramienta === "editar" ? "navegar" : "editar")} className={herramienta === "editar" ? botonPri : botonSec}>
              <Pencil className="h-4 w-4" /> {herramienta === "editar" ? "Listo" : "Mover vértices"}
            </button>
          )}
          {tienePredio && (
            <button
              type="button"
              onClick={() => window.confirm("¿Borrar el perímetro del predio y sus colindancias?") && cambiar((x) => ({ ...x, perimetro: [], colindancias: [] }))}
              className={`${botonSec} text-pn-alerta`}
            >
              <Trash2 className="h-4 w-4" /> Borrar predio
            </button>
          )}
        </div>
      </section>

      {/* Colindancias */}
      {tienePredio && (
        <section className={tarjeta} aria-label="Colindancias">
          <h3 className="mb-1 text-[13px] font-semibold text-pn-texto">3 · Colindancias</h3>
          <p className="mb-2 text-[12px] text-pn-sub">La orientación se calcula sola según hacia dónde da cada lado; puedes corregirla.</p>
          <div className="flex flex-col gap-2">
            {ls.map((l) => {
              const c = inm.colindancias[l.indice] ?? {};
              const abierto = p.ladoSel === l.indice;
              return (
                <div key={l.indice} className={`rounded-md border ${abierto ? "border-[#F59E0B]" : "border-pn-borde"}`}>
                  <button
                    type="button"
                    onClick={() => p.setLadoSel(abierto ? null : l.indice)}
                    className="flex w-full items-center justify-between px-2.5 py-2 text-left text-[13px]"
                    aria-expanded={abierto}
                  >
                    <span className="font-medium text-pn-texto">
                      Lado {l.indice + 1} · {ORIENTACION_ETIQUETA[c.orientacion ?? l.orientacion]}
                    </span>
                    <span className="text-pn-sub">
                      {c.tipo ? TIPO_COLINDANCIA_ETIQUETA[c.tipo] : "sin tipo"} · {fmtM(l.largo)}
                    </span>
                  </button>
                  {abierto && (
                    <div className="grid grid-cols-2 gap-2 border-t border-pn-borde p-2.5">
                      <label>
                        <span className={etiqueta}>Orientación</span>
                        <select value={c.orientacion ?? ""} onChange={(e) => setCol(l.indice, { orientacion: (e.target.value || undefined) as Orientacion | undefined })} className={campo}>
                          <option value="">{ORIENTACION_ETIQUETA[l.orientacion]} (calculada)</option>
                          {ORIENTACIONES.map((o) => (
                            <option key={o} value={o}>{ORIENTACION_ETIQUETA[o]}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span className={etiqueta}>Colinda con</span>
                        <select value={c.tipo ?? ""} onChange={(e) => setCol(l.indice, { tipo: (e.target.value || undefined) as TipoColindancia | undefined })} className={campo}>
                          <option value="">Elegir…</option>
                          {TIPOS_COLINDANCIA.map((t) => (
                            <option key={t} value={t}>{TIPO_COLINDANCIA_ETIQUETA[t]}</option>
                          ))}
                        </select>
                      </label>
                      <label className="col-span-2">
                        <span className={etiqueta}>Descripción</span>
                        <input value={c.descripcion ?? ""} onChange={(e) => setCol(l.indice, { descripcion: e.target.value })} placeholder="Ej. calle de dos carriles, barda de 3 m" className={campo} />
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Elementos */}
      <section className={tarjeta} aria-label="Elementos">
        <h3 className="mb-2 text-[13px] font-semibold text-pn-texto">4 · Símbolos y elementos</h3>
        <div className="grid grid-cols-2 gap-1.5">
          {TIPOS_SIMBOLO.map((t) => {
            const h = `simbolo:${t}` as HerramientaMapa;
            return (
              <button key={t} type="button" onClick={() => setHerramienta(herramienta === h ? "navegar" : h)} className={herramienta === h ? botonPri : botonSec}>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white" style={{ background: SIMBOLOS[t].color }}>{SIMBOLOS[t].glifo}</span>
                {SIMBOLOS[t].etiqueta}
              </button>
            );
          })}
          <button type="button" onClick={() => setHerramienta(herramienta === "ruta" ? "navegar" : "ruta")} className={`${herramienta === "ruta" ? botonPri : botonSec} col-span-2`}>
            <Route className="h-4 w-4" /> Ruta de evacuación
          </button>
        </div>

        {elSel && (
          <div className="mt-3 rounded-md border-2 border-[#1D4ED8]/40 p-2.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[13px] font-semibold text-pn-texto">
                {SIMBOLOS[elSel.tipo].etiqueta}
                {SIMBOLOS[elSel.tipo].sensible && <span className="ml-1.5 rounded bg-[#FDECEA] px-1.5 py-0.5 text-[11px] text-pn-alerta">sensible</span>}
              </span>
              <button type="button" onClick={() => p.volarA([elSel.lng, elSel.lat], 20.5)} className="flex items-center gap-1 text-[12px] text-pn-navy" aria-label="Acercar al elemento">
                <ZoomIn className="h-3.5 w-3.5" /> Acercar
              </button>
            </div>
            {elSel.camara && (
              <div className="flex flex-col gap-2">
                <label>
                  <span className={etiqueta}>Dirección: {elSel.camara.direccion}°</span>
                  <input type="range" min={0} max={359} value={elSel.camara.direccion} onChange={(e) => setCamara({ direccion: Number(e.target.value) })} className="w-full" />
                </label>
                <label>
                  <span className={etiqueta}>Ángulo de visión: {elSel.camara.angulo}°</span>
                  <input type="range" min={10} max={180} value={elSel.camara.angulo} onChange={(e) => setCamara({ angulo: Number(e.target.value) })} className="w-full" />
                </label>
                <label>
                  <span className={etiqueta}>Alcance: {elSel.camara.alcance} m</span>
                  <input type="range" min={2} max={80} step={0.5} value={elSel.camara.alcance} onChange={(e) => setCamara({ alcance: Number(e.target.value) })} className="w-full" />
                </label>
                <p className="text-[12px] text-pn-sub">También puedes arrastrar el punto blanco de la punta del cono.</p>
              </div>
            )}
            <label className="mt-2 block">
              <span className={etiqueta}>Nota</span>
              <input
                value={elSel.nota ?? ""}
                onChange={(e) => cambiar((x) => ({ ...x, elementos: x.elementos.map((el) => (el.id === elSel.id ? { ...el, nota: e.target.value } : el)) }))}
                placeholder={elSel.tipo === "extintor" ? "Ej. PQS 6 kg, vigente a 2027" : "Características u observaciones"}
                className={campo}
              />
            </label>
            <button
              type="button"
              onClick={() => {
                cambiar((x) => ({ ...x, elementos: x.elementos.filter((el) => el.id !== elSel.id) }));
                p.setElementoSel(null);
              }}
              className="mt-2 flex items-center gap-1.5 text-[13px] text-pn-alerta"
            >
              <Trash2 className="h-4 w-4" /> Borrar
            </button>
          </div>
        )}

        {(inm.elementos.length > 0 || inm.rutas.length > 0) && (
          <ul className="mt-3 flex flex-col gap-0.5 border-t border-pn-borde pt-2">
            {inm.elementos.map((e, i) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => {
                    p.setElementoSel(e.id);
                    p.volarA([e.lng, e.lat], 20.5);
                  }}
                  className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px] ${e.id === p.elementoSel ? "bg-[#DBE7FB]" : "hover:bg-pn-calido"}`}
                >
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white" style={{ background: SIMBOLOS[e.tipo].color }}>{SIMBOLOS[e.tipo].glifo}</span>
                  {SIMBOLOS[e.tipo].etiqueta} {i + 1}
                  {e.nota && <span className="truncate text-pn-sub">· {e.nota}</span>}
                </button>
              </li>
            ))}
            {inm.rutas.map((r, i) => (
              <li key={r.id} className="flex items-center justify-between rounded px-2 py-1.5 text-[13px]">
                <span className="flex items-center gap-2">
                  <span className="h-1 w-5 rounded bg-[#1B7F3B]" /> Ruta de evacuación {i + 1} · {fmtM(largoLinea(r.coords))}
                </span>
                <button type="button" onClick={() => cambiar((x) => ({ ...x, rutas: x.rutas.filter((y) => y.id !== r.id) }))} aria-label={`Borrar ruta ${i + 1}`} className="text-pn-alerta">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-[11.5px] leading-snug text-pn-sub">
        {LEYENDA_MEDIDAS} Cartografía base: © colaboradores de OpenStreetMap.
      </p>
      <button type="button" onClick={p.borrar} className="self-start text-[12px] text-pn-alerta underline-offset-2 hover:underline">
        Borrar este inmueble del prototipo
      </button>
    </div>
  );
}
