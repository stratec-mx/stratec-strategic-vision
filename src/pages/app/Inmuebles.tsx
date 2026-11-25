// Módulo Inmuebles y plano (Documento 04 de M-DESR). PROTOTIPO para probar en teléfono y computadora:
// guarda solo en este navegador, con inmuebles ficticios. No escribe en la base de datos.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Building2, ChevronRight, Map as MapaIcono, PencilRuler, Plus, RotateCcw, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useGps } from "@/hooks/useGps";
import { aLocal, area, distancia, fmtM, fmtM2, lados, ORIENTACION_ETIQUETA, ORIENTACIONES, verticesPorTramos, type LngLat } from "@/lib/plano/geo";
import { borrarTodo, cargar, ESTADO_INFO, ESTADOS, guardar, nuevoInmueble, type Datos, type Inmueble, type VerticePredio } from "@/lib/plano/inmuebles";
import { CAMARA_INICIAL, registrarPersonalizados, SIMBOLOS, type SimboloPersonal, type TipoSimbolo } from "@/lib/plano/simbolos";
import { nuevoId, type Croquis, type P } from "@/lib/plano/croquis";
import { MapaInmuebles, type HerramientaMapa, type MapaHandle } from "@/components/plano/MapaInmuebles";
import { fondosDisponibles, type Fondo } from "@/lib/plano/fondos";
import { PanelExterior, type Cliente, type VerSituacion } from "@/components/plano/PanelExterior";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { CroquisEditor } from "@/components/plano/CroquisEditor";

const AYUDA_MAPA: Partial<Record<HerramientaMapa, string>> = {
  ubicar: "Toca el mapa donde está el inmueble.",
  vertices: "Toca cada esquina del predio, en orden. Usa “Quitar el último” si te equivocas y “Cerrar predio” al terminar.",
  editar: "Arrastra un vértice para moverlo. Tócalo para elegirlo y borrarlo. El “+” naranja agrega un vértice en ese lado.",
  hallazgo: "Toca el lugar del hallazgo. Después pon título y foto en el panel.",
  ruta: "Toca cada punto de la ruta, en orden hacia el punto de reunión. Toca el último punto otra vez para terminar.",
};

/** Ajusta la lista de colindancias al número de lados del predio. */
const ajustarColindancias = (cols: Inmueble["colindancias"], n: number) => {
  const r = cols.slice(0, n);
  while (r.length < n) r.push({});
  return r;
};

/**
 * Colindancias de un predio nuevo: cada lado hereda los datos del lado anterior que daba
 * hacia la misma orientación (al volver a trazar, el orden de los lados puede cambiar).
 */
function colindanciasPorOrientacion(anterior: Inmueble, nuevo: LngLat[]): Inmueble["colindancias"] {
  const viejos = lados(anterior.perimetro.map((v) => [v.lng, v.lat]));
  const usados = new Set<number>();
  return lados(nuevo).map((l) => {
    const previo = viejos.find((v) => !usados.has(v.indice) && (anterior.colindancias[v.indice]?.orientacion ?? v.orientacion) === l.orientacion);
    if (!previo) return {};
    usados.add(previo.indice);
    const { tipo, descripcion } = anterior.colindancias[previo.indice] ?? {};
    return { tipo, descripcion };
  });
}

/** Contorno del predio en metros, con el origen en la esquina noroeste (el marco del croquis). */
function predioLocal(inm: Inmueble): P[] | undefined {
  if (inm.perimetro.length < 3) return undefined;
  const origen: LngLat = [Math.min(...inm.perimetro.map((v) => v.lng)), Math.max(...inm.perimetro.map((v) => v.lat))];
  return inm.perimetro.map((v) => aLocal(origen, [v.lng, v.lat]));
}

const leerSesion = (k: string): string | null => {
  try {
    return sessionStorage.getItem(`stratec.plano.${k}`);
  } catch {
    return null;
  }
};
const guardarSesion = (k: string, v: string | null) => {
  try {
    if (v === null) sessionStorage.removeItem(`stratec.plano.${k}`);
    else sessionStorage.setItem(`stratec.plano.${k}`, v);
  } catch {
    /* sin almacenamiento */
  }
};

export default function Inmuebles() {
  const [datos, setDatos] = useState<Datos>(cargar);
  const [selId, setSelId] = useState<string | null>(() => leerSesion("sel"));
  const [vista, setVista] = useState<"mapa" | "croquis">(() => (leerSesion("vista") === "croquis" ? "croquis" : "mapa"));
  const [verticeSel, setVerticeSel] = useState<number | null>(null);
  const [verSituacion, setVerSituacion] = useState<VerSituacion>("todo");
  const [listaAbierta, setListaAbierta] = useState(false);
  const [hallazgoSel, setHallazgoSel] = useState<string | null>(null);
  // Predio por medidas: punto de inicio y tramos (largo y rumbo).
  const [inicioMedidas, setInicioMedidas] = useState<LngLat | null>(null);
  const [tramos, setTramos] = useState<{ largo: string; rumbo: string }[]>([{ largo: "", rumbo: "90" }]);
  const verticesMedidas = useMemo(
    () => (inicioMedidas ? verticesPorTramos(inicioMedidas, tramos.map((t) => ({ largo: Number(t.largo.replace(",", ".")) || 0, rumbo: Number(t.rumbo) || 0 }))) : []),
    [inicioMedidas, tramos],
  );
  const [herramienta, setHerramienta] = useState<HerramientaMapa>("navegar");
  const [elementoSel, setElementoSel] = useState<string | null>(null);
  const [ladoSel, setLadoSel] = useState<number | null>(null);
  const [recorrido, setRecorrido] = useState<VerticePredio[]>([]);
  const [clientes, setClientes] = useState<Cliente[] | null>(null);
  const [guardado, setGuardado] = useState<"ok" | "error">("ok");
  // Fondos de Esri y Google: aparecen solo si el despliegue tiene su llave (D-P10).
  const fondos = fondosDisponibles();
  const [fondo, setFondo] = useState<Fondo>(() => {
    try {
      const f = localStorage.getItem("stratec.plano.fondo") as Fondo | null;
      return f && fondos.some((x) => x.id === f) ? f : "osm";
    } catch {
      return "osm";
    }
  });
  const [avisoMapa, setAvisoMapa] = useState<string | null>(null);
  const mapa = useRef<MapaHandle>(null);

  const sel = datos.inmuebles.find((i) => i.id === selId) ?? null;
  const gps = useGps(herramienta === "recorrido");

  const cambiarFondo = (f: Fondo) => {
    setFondo(f);
    setAvisoMapa(null);
    try {
      localStorage.setItem("stratec.plano.fondo", f);
    } catch {
      /* sin almacenamiento */
    }
  };

  useEffect(() => {
    if (!avisoMapa) return;
    const t = setTimeout(() => setAvisoMapa(null), 6000);
    return () => clearTimeout(t);
  }, [avisoMapa]);

  // Guardar en el navegador (con una pequeña espera para no escribir en cada tecla).
  useEffect(() => {
    const t = setTimeout(() => setGuardado(guardar(datos) ? "ok" : "error"), 400);
    return () => clearTimeout(t);
  }, [datos]);

  // Clientes existentes, solo lectura (Documento 04 §5.1).
  useEffect(() => {
    let vivo = true;
    supabase
      .from("clients")
      .select("id, name")
      .order("name")
      .then(({ data, error }) => {
        if (vivo) setClientes(error ? [] : ((data ?? []) as Cliente[]));
      });
    return () => {
      vivo = false;
    };
  }, []);

  const cambiar = useCallback(
    (f: (i: Inmueble) => Inmueble) => {
      if (!selId) return;
      setDatos((d) => ({ ...d, inmuebles: d.inmuebles.map((i) => (i.id === selId ? { ...f(i), actualizado: new Date().toISOString() } : i)) }));
    },
    [selId],
  );

  const elegirInmueble = useCallback(
    (id: string) => {
      const inm = datos.inmuebles.find((i) => i.id === id);
      if (!inm) return;
      setSelId(id);
      setElementoSel(null);
      setLadoSel(null);
      setHerramienta("navegar");
      setRecorrido([]);
      mapa.current?.volarInmueble(inm, true);
    },
    [datos.inmuebles],
  );

  const irACartera = () => {
    setSelId(null);
    setElementoSel(null);
    setLadoSel(null);
    setHerramienta("navegar");
    setVista("mapa");
    setTimeout(() => mapa.current?.volarCartera(), 50);
  };

  const cambiarHerramienta = (h: HerramientaMapa) => {
    if (h !== herramienta) setRecorrido([]);
    if (h === "medidas") {
      setInicioMedidas(sel?.ubicacion ? [sel.ubicacion.lng, sel.ubicacion.lat] : (mapa.current?.centro() ?? null));
      setTramos([{ largo: "", rumbo: "90" }]);
    }
    setVerticeSel(null);
    setHerramienta(h);
  };

  // Recuerda dónde estabas si la página se recarga (solo en esta pestaña).
  useEffect(() => {
    guardarSesion("sel", selId);
    guardarSesion("vista", vista);
  }, [selId, vista]);

  // ── Eventos del mapa ──
  const alClicMapa = (p: LngLat) => {
    if (!sel) return;
    if (herramienta === "ubicar") {
      cambiar((i) => ({ ...i, ubicacion: { lng: p[0], lat: p[1], fecha: new Date().toISOString() } }));
      setHerramienta("navegar");
    } else if (herramienta === "hallazgo") {
      const id = nuevoId("h");
      cambiar((i) => ({ ...i, hallazgos: [...(i.hallazgos ?? []), { id, titulo: "", fecha: new Date().toISOString(), lng: p[0], lat: p[1], fotos: [], estado: "propuesta" }] }));
      setHallazgoSel(id);
      setHerramienta("navegar");
    } else if (herramienta === "medidas") {
      setInicioMedidas(p);
    } else if (herramienta === "vertices") {
      setRecorrido((r) => [...r, { lng: p[0], lat: p[1], origen: "manual" }]);
    } else if (herramienta.startsWith("simbolo:")) {
      const tipo = herramienta.slice(8) as TipoSimbolo;
      const id = nuevoId("x");
      cambiar((i) => ({ ...i, elementos: [...i.elementos, { id, tipo, lng: p[0], lat: p[1], ...(tipo === "camara" ? { camara: { ...CAMARA_INICIAL } } : {}) }] }));
      setElementoSel(id);
      setHerramienta("navegar");
    }
  };

  // ── Edición del predio con el dedo ──
  const moverVertice = (k: number, p: LngLat) =>
    cambiar((i) => ({ ...i, perimetro: i.perimetro.map((v, n) => (n === k ? { lng: p[0], lat: p[1], origen: "manual" as const } : v)) }));

  const insertarVertice = (k: number, p: LngLat) => {
    cambiar((i) => {
      const perimetro = [...i.perimetro];
      perimetro.splice(k, 0, { lng: p[0], lat: p[1], origen: "manual" });
      // El lado partido conserva su colindancia en las dos mitades.
      const cols = ajustarColindancias(i.colindancias, i.perimetro.length);
      cols.splice(k, 0, { ...(cols[k - 1] ?? {}) });
      return { ...i, perimetro, colindancias: cols };
    });
    setVerticeSel(k);
  };

  const borrarVertice = (k: number) => {
    cambiar((i) => {
      if (i.perimetro.length <= 3) return i;
      const cols = ajustarColindancias(i.colindancias, i.perimetro.length);
      cols.splice(k, 1);
      return { ...i, perimetro: i.perimetro.filter((_, n) => n !== k), colindancias: cols };
    });
    setVerticeSel(null);
  };

  const alRutaDibujada = (coords: LngLat[]) => {
    if (coords.length >= 2) cambiar((i) => ({ ...i, rutas: [...i.rutas, { id: nuevoId("r"), coords }] }));
    setHerramienta("navegar");
  };

  // ── GPS ──
  const ubicarConGps = async () => {
    try {
      const p = await gps.pedirUna();
      cambiar((i) => ({ ...i, ubicacion: { lng: p.lng, lat: p.lat, precision: p.precision, fecha: p.fecha } }));
      mapa.current?.volarA([p.lng, p.lat], 18.5);
    } catch {
      /* el error se muestra en el panel */
    }
  };

  const marcarVertice = () => {
    if (!gps.pos) return;
    setRecorrido((r) => [...r, { lng: gps.pos!.lng, lat: gps.pos!.lat, precision: gps.pos!.precision, origen: "gps" }]);
  };

  const cerrarRecorrido = () => {
    if (recorrido.length < 3) return;
    const vs = recorrido;
    const porGps = herramienta === "recorrido";
    cambiar((i) => ({
      ...i,
      perimetro: vs,
      metodo: porGps ? "gps_campo" : i.metodo === "gps_campo" ? "levantamiento_campo" : i.metodo,
      colindancias: colindanciasPorOrientacion(i, vs.map((v) => [v.lng, v.lat])),
    }));
    setRecorrido([]);
    setHerramienta("navegar");
  };

  // Durante el recorrido, el mapa sigue al consultor.
  useEffect(() => {
    if (herramienta === "recorrido" && gps.pos) mapa.current?.volarA([gps.pos.lng, gps.pos.lat], 19);
    // Solo al recibir la primera lectura de cada recorrido.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [herramienta, !!gps.pos]);

  // ── Elementos que crea el usuario ──
  const crearPersonal = (p: Omit<SimboloPersonal, "id">) => {
    const nuevo: SimboloPersonal = { ...p, id: nuevoId("p") };
    const catalogo = [...(datos.catalogo ?? []), nuevo];
    registrarPersonalizados(catalogo);
    setDatos((d) => ({ ...d, catalogo }));
    setHerramienta(`simbolo:personal:${nuevo.id}` as HerramientaMapa);
  };

  // ── Inmuebles ──
  const agregarInmueble = () => {
    const inm = nuevoInmueble(mapa.current?.centro() ?? [-99.2342, 18.9186]);
    setDatos((d) => ({ ...d, inmuebles: [...d.inmuebles, inm] }));
    setSelId(inm.id);
    setVista("mapa");
    setHerramienta("navegar");
  };

  const borrarInmueble = () => {
    if (!sel || !window.confirm(`¿Borrar “${sel.nombre}” del prototipo?`)) return;
    setDatos((d) => ({ ...d, inmuebles: d.inmuebles.filter((i) => i.id !== sel.id) }));
    irACartera();
  };

  const restablecer = () => {
    if (!window.confirm("¿Borrar todo lo capturado en este navegador y volver a los inmuebles de prueba?")) return;
    setDatos(borrarTodo());
    irACartera();
  };

  const cambiarCroquis = useCallback((c: Croquis) => cambiar((i) => ({ ...i, croquis: c })), [cambiar]);
  const predio = useMemo(() => (sel ? predioLocal(sel) : undefined), [sel]);
  const elSel = sel?.elementos.find((e) => e.id === elementoSel);

  const migas = (
    <nav aria-label="Navegación del mapa" className="flex flex-wrap items-center gap-1 text-[13px]">
      <button type="button" onClick={irACartera} className={`rounded px-1.5 py-1 ${sel ? "text-pn-navy hover:bg-pn-calido" : "font-semibold text-pn-texto"}`}>
        Cartera
      </button>
      {sel && (
        <>
          <ChevronRight className="h-3.5 w-3.5 text-pn-sub" />
          <button type="button" onClick={() => { setVista("mapa"); setTimeout(() => mapa.current?.volarMunicipio(sel), 50); }} className="rounded px-1.5 py-1 text-pn-navy hover:bg-pn-calido">
            {sel.municipio || "Municipio"}
          </button>
          <ChevronRight className="h-3.5 w-3.5 text-pn-sub" />
          <button type="button" onClick={() => { setVista("mapa"); setElementoSel(null); setTimeout(() => mapa.current?.volarInmueble(sel), 50); }} className={`rounded px-1.5 py-1 ${elSel ? "text-pn-navy hover:bg-pn-calido" : "font-semibold text-pn-texto"}`}>
            {sel.nombre}
          </button>
          {elSel && vista === "mapa" && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-pn-sub" />
              <button type="button" onClick={() => mapa.current?.volarA([elSel.lng, elSel.lat], 20.5)} className="rounded px-1.5 py-1 font-semibold text-pn-texto">
                {SIMBOLOS[elSel.tipo].etiqueta}
              </button>
            </>
          )}
        </>
      )}
    </nav>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#F3C98B] bg-[#FFF7E8] px-3 py-2 text-[12.5px] text-[#7A4B00]">
        <span>
          <b>Prototipo.</b> Lo que captures se guarda solo en este navegador, con inmuebles ficticios; no llega a la base de datos.
          {guardado === "error" && " No se pudo guardar: el navegador no permite almacenamiento."}
        </span>
        <button type="button" onClick={restablecer} className="flex items-center gap-1 font-medium underline-offset-2 hover:underline">
          <RotateCcw className="h-3.5 w-3.5" /> Volver a los datos de prueba
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setListaAbierta(true)}
            className={`flex items-center gap-1.5 rounded-md border border-pn-borde bg-white px-3 py-2 text-[13px] font-medium text-pn-texto ${vista === "mapa" ? "lg:hidden" : ""}`}
          >
            <Building2 className="h-4 w-4" /> Inmuebles ({datos.inmuebles.length})
          </button>
          {migas}
        </div>
        {sel && (
          <div className="flex rounded-md border border-pn-borde bg-white p-0.5" role="tablist" aria-label="Vista">
            {([["mapa", "Exterior (mapa)", MapaIcono], ["croquis", "Croquis interior", PencilRuler]] as const).map(([v, t, Icono]) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={vista === v}
                onClick={() => setVista(v)}
                className={`flex items-center gap-1.5 rounded px-3 py-2 text-[13px] font-medium ${vista === v ? "bg-pn-navy text-white" : "text-pn-texto hover:bg-pn-calido"}`}
              >
                <Icono className="h-4 w-4" /> {t}
              </button>
            ))}
          </div>
        )}
      </div>

      <Sheet open={listaAbierta} onOpenChange={setListaAbierta}>
        <SheetContent side="left" className="w-[300px] overflow-y-auto p-3">
          <SheetTitle className="mb-2 text-[14px]">Inmuebles registrados</SheetTitle>
          <ListaInmuebles
            datos={datos}
            selId={selId}
            elegir={(id) => {
              setListaAbierta(false);
              setVista("mapa");
              elegirInmueble(id);
            }}
            agregar={() => {
              setListaAbierta(false);
              agregarInmueble();
            }}
          />
        </SheetContent>
      </Sheet>

      <div className={vista === "mapa" ? "flex flex-col gap-3 lg:flex-row" : "hidden"}>
        <aside className="hidden w-56 shrink-0 overflow-y-auto rounded-md border border-pn-borde bg-white p-2 lg:block lg:h-[calc(100dvh-230px)]" aria-label="Inmuebles registrados">
          <h3 className="px-1.5 pb-1.5 pt-1 text-[12px] font-semibold uppercase tracking-wide text-pn-sub">Inmuebles registrados</h3>
          <ListaInmuebles datos={datos} selId={selId} elegir={elegirInmueble} agregar={agregarInmueble} compacta />
        </aside>
        <div className="relative h-[58vh] min-h-[340px] w-full overflow-hidden rounded-md border border-pn-borde lg:h-[calc(100dvh-230px)] lg:w-auto lg:min-w-0 lg:flex-1">
          <MapaInmuebles
            ref={mapa}
            inmuebles={datos.inmuebles}
            sel={sel}
            herramienta={herramienta}
            elementoSel={elementoSel}
            ladoSel={ladoSel}
            gps={herramienta === "recorrido" ? gps.pos : null}
            recorrido={herramienta === "medidas" ? verticesMedidas.map(([lng, lat]) => ({ lng, lat, origen: "manual" as const })) : recorrido}
            verSituacion={verSituacion}
            fondo={fondo}
            onErrorFondo={(m) => {
              setAvisoMapa(m);
              setFondo("osm");
            }}
            onElegirInmueble={elegirInmueble}
            onClicMapa={alClicMapa}
            verticeSel={verticeSel}
            onMoverVertice={moverVertice}
            onInsertarVertice={insertarVertice}
            onElegirVertice={setVerticeSel}
            onRutaDibujada={alRutaDibujada}
            onElegirElemento={setElementoSel}
            onMoverElemento={(id, p) => cambiar((i) => ({ ...i, elementos: i.elementos.map((e) => (e.id === id ? { ...e, lng: p[0], lat: p[1] } : e)) }))}
            onCamara={(id, c) => cambiar((i) => ({ ...i, elementos: i.elementos.map((e) => (e.id === id && e.camara ? { ...e, camara: { ...e.camara, ...c } } : e)) }))}
            onElegirLado={(i) => setLadoSel((l) => (l === i ? null : i))}
            hallazgoSel={hallazgoSel}
            onElegirHallazgo={setHallazgoSel}
          />

          {/* Fondo: mapa de calles (OpenStreetMap) o satélite (Esri, solo en pantalla) */}
          {fondos.length > 1 && (
            <div className="absolute bottom-9 left-2 flex flex-wrap rounded-md border border-pn-borde bg-white p-0.5 shadow-sm" role="group" aria-label="Fondo del mapa">
              {fondos.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={fondo === f.id}
                  onClick={() => cambiarFondo(f.id)}
                  className={`rounded px-2.5 py-1.5 text-[12px] font-medium ${fondo === f.id ? "bg-pn-navy text-white" : "text-pn-texto hover:bg-pn-calido"}`}
                >
                  {f.etiqueta}
                </button>
              ))}
            </div>
          )}
          {avisoMapa && (
            <div role="status" className="absolute bottom-20 left-2 right-2 rounded-md bg-pn-navy px-3 py-2 text-[12.5px] text-white shadow sm:right-auto sm:max-w-sm">
              {avisoMapa}
            </div>
          )}

          {/* Ayuda de la herramienta activa */}
          {(AYUDA_MAPA[herramienta] || herramienta.startsWith("simbolo:")) && (
            <div className="absolute left-2 right-12 top-2 flex items-start justify-between gap-2 rounded-md bg-pn-navy/95 px-3 py-2 text-[13px] text-white shadow sm:right-auto sm:max-w-md">
              <span>{herramienta.startsWith("simbolo:") ? `Toca el mapa donde va: ${SIMBOLOS[herramienta.slice(8) as TipoSimbolo].etiqueta.toLowerCase()}.` : AYUDA_MAPA[herramienta]}</span>
              <button type="button" onClick={() => setHerramienta("navegar")} className="shrink-0 rounded bg-white/15 px-2 py-0.5 text-[12px]">
                {herramienta === "editar" ? "Listo" : "Cancelar"}
              </button>
            </div>
          )}

          {/* Predio por medidas: cada lado con su largo y su rumbo (del plano del cliente o de cinta/distanciómetro) */}
          {herramienta === "medidas" && (
            <div className="absolute inset-x-2 bottom-8 max-h-[70%] overflow-y-auto rounded-lg border border-pn-borde bg-white/97 p-3 shadow-lg sm:left-auto sm:w-[380px]">
              <div className="mb-1 text-[13px] font-semibold text-pn-texto">Predio por medidas</div>
              <p className="mb-2 text-[12px] text-pn-sub">Toca el mapa para mover el punto de inicio (esquina 1). Cada lado: largo y hacia dónde va. El último lado se cierra solo.</p>
              <ol className="flex flex-col gap-1.5">
                {tramos.map((t, k) => (
                  <li key={k} className="flex items-center gap-1.5">
                    <span className="w-12 shrink-0 text-[12px] text-pn-sub">Lado {k + 1}</span>
                    <input
                      inputMode="decimal"
                      value={t.largo}
                      onChange={(e) => setTramos((ts) => ts.map((x, n) => (n === k ? { ...x, largo: e.target.value } : x)))}
                      placeholder="m"
                      aria-label={`Largo del lado ${k + 1} en metros`}
                      className="w-20 rounded-md border border-pn-borde px-2 py-1.5 text-[14px]"
                    />
                    <select
                      value={t.rumbo}
                      onChange={(e) => setTramos((ts) => ts.map((x, n) => (n === k ? { ...x, rumbo: e.target.value } : x)))}
                      aria-label={`Hacia dónde va el lado ${k + 1}`}
                      className="min-w-0 flex-1 rounded-md border border-pn-borde px-2 py-1.5 text-[13px]"
                    >
                      {ORIENTACIONES.map((o, n) => (
                        <option key={o} value={String(n * 45)}>Hacia el {ORIENTACION_ETIQUETA[o].toLowerCase()} ({n * 45}°)</option>
                      ))}
                      {!ORIENTACIONES.some((_, n) => String(n * 45) === t.rumbo) && <option value={t.rumbo}>{t.rumbo}°</option>}
                    </select>
                    <input
                      inputMode="numeric"
                      value={t.rumbo}
                      onChange={(e) => setTramos((ts) => ts.map((x, n) => (n === k ? { ...x, rumbo: e.target.value.replace(/[^0-9.]/g, "") } : x)))}
                      aria-label={`Rumbo exacto del lado ${k + 1} en grados`}
                      className="w-14 rounded-md border border-pn-borde px-1.5 py-1.5 text-[13px]"
                    />
                  </li>
                ))}
              </ol>
              {verticesMedidas.length >= 3 && (
                <p className="mt-1.5 text-[12px] text-pn-sub">Cierre: {fmtM(distancia(verticesMedidas[verticesMedidas.length - 1], verticesMedidas[0]))} hasta la esquina 1.</p>
              )}
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                <button type="button" onClick={() => setTramos((ts) => [...ts, { largo: "", rumbo: String(((Number(ts[ts.length - 1]?.rumbo) || 0) + 90) % 360) }])} className="rounded-md border border-pn-borde py-2 text-[12.5px]">
                  + Lado
                </button>
                <button type="button" onClick={() => setTramos((ts) => (ts.length > 1 ? ts.slice(0, -1) : ts))} className="rounded-md border border-pn-borde py-2 text-[12.5px]">
                  Quitar lado
                </button>
                <button
                  type="button"
                  disabled={verticesMedidas.length < 3}
                  onClick={() => {
                    const vs = verticesMedidas.map(([lng, lat]) => ({ lng, lat, origen: "manual" as const }));
                    cambiar((i) => ({ ...i, perimetro: vs, metodo: "plano_cliente", colindancias: colindanciasPorOrientacion(i, verticesMedidas) }));
                    setHerramienta("navegar");
                  }}
                  className="rounded-md bg-[#287A59] py-2 text-[12.5px] font-medium text-white disabled:opacity-50"
                >
                  Cerrar predio
                </button>
              </div>
            </div>
          )}

          {/* Trazo a mano: los vértices se ponen tocando el mapa */}
          {herramienta === "vertices" && (
            <div className="absolute inset-x-2 bottom-8 rounded-lg border border-pn-borde bg-white/97 p-3 shadow-lg sm:left-auto sm:w-[340px]">
              <div className="mb-2 text-[13px] font-semibold text-pn-texto">Vértices a mano · {recorrido.length}</div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setRecorrido((r) => r.slice(0, -1))} disabled={!recorrido.length} className="rounded-md border border-pn-borde py-2.5 text-[13px] disabled:opacity-50">
                  Quitar el último
                </button>
                <button type="button" onClick={cerrarRecorrido} disabled={recorrido.length < 3} className="rounded-md bg-[#287A59] py-2.5 text-[13px] font-medium text-white disabled:opacity-50">
                  Cerrar predio
                </button>
              </div>
            </div>
          )}

          {/* Edición: borrar el vértice elegido */}
          {herramienta === "editar" && verticeSel !== null && sel && (
            <div className="absolute inset-x-2 bottom-8 flex items-center justify-between gap-2 rounded-lg border border-pn-borde bg-white/97 p-3 shadow-lg sm:left-auto sm:w-[340px]">
              <span className="text-[13px] font-semibold text-pn-texto">Vértice {verticeSel + 1}</span>
              <button
                type="button"
                onClick={() => borrarVertice(verticeSel)}
                disabled={sel.perimetro.length <= 3}
                title={sel.perimetro.length <= 3 ? "Un predio necesita al menos 3 vértices" : undefined}
                className="rounded-md border border-[#F1C5C0] px-3 py-2 text-[13px] text-pn-alerta disabled:opacity-50"
              >
                Borrar vértice
              </button>
            </div>
          )}

          {/* Recorrido GPS: botón grande para marcar cada vértice */}
          {herramienta === "recorrido" && (
            <div className="absolute inset-x-2 bottom-8 rounded-lg border border-pn-borde bg-white/97 p-3 shadow-lg sm:left-auto sm:w-[340px]">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[13px] font-semibold text-pn-texto">Recorrido GPS · {recorrido.length} vértices</span>
                <button type="button" aria-label="Cancelar recorrido" onClick={() => cambiarHerramienta("navegar")} className="text-pn-sub">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className={`mb-2 text-[12.5px] ${gps.pos && gps.pos.precision > 10 ? "text-[#7A4B00]" : "text-pn-sub"}`}>
                {gps.error
                  ? gps.error
                  : gps.pos
                    ? `Precisión actual: ± ${Math.round(gps.pos.precision)} m${gps.pos.precision > 10 ? ". Es baja: espera unos segundos al aire libre." : ""}`
                    : "Buscando señal GPS…"}
              </p>
              <button type="button" onClick={marcarVertice} disabled={!gps.pos} className="mb-2 w-full rounded-lg bg-pn-navy py-4 text-[16px] font-semibold text-white disabled:opacity-50">
                Marcar vértice aquí
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setRecorrido((r) => r.slice(0, -1))} disabled={!recorrido.length} className="rounded-md border border-pn-borde py-2 text-[13px] disabled:opacity-50">
                  Quitar el último
                </button>
                <button type="button" onClick={cerrarRecorrido} disabled={recorrido.length < 3} className="rounded-md bg-[#287A59] py-2 text-[13px] font-medium text-white disabled:opacity-50">
                  Cerrar predio
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="w-full shrink-0 lg:h-[calc(100dvh-230px)] lg:w-[360px] lg:overflow-y-auto">
          {sel ? (
            <PanelExterior
              inm={sel}
              cambiar={cambiar}
              borrar={borrarInmueble}
              clientes={clientes}
              herramienta={herramienta}
              setHerramienta={cambiarHerramienta}
              elementoSel={elementoSel}
              setElementoSel={setElementoSel}
              ladoSel={ladoSel}
              setLadoSel={setLadoSel}
              ubicarConGps={ubicarConGps}
              gpsBuscando={gps.buscando}
              gpsError={gps.error}
              volarA={(p, z) => mapa.current?.volarA(p, z)}
              verSituacion={verSituacion}
              setVerSituacion={setVerSituacion}
              crearPersonal={crearPersonal}
              hallazgoSel={hallazgoSel}
              setHallazgoSel={setHallazgoSel}
            />
          ) : (
            <Cartera datos={datos} elegir={elegirInmueble} agregar={agregarInmueble} />
          )}
        </aside>
      </div>

      {vista === "croquis" && sel && (
        <CroquisEditor key={sel.id} croquis={sel.croquis} onChange={cambiarCroquis} predio={predio} />
      )}
    </div>
  );
}

/** Lista lateral de inmuebles: acceso directo a cada uno desde cualquier vista. */
function ListaInmuebles({ datos, selId, elegir, agregar, compacta }: { datos: Datos; selId: string | null; elegir: (id: string) => void; agregar: () => void; compacta?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      {datos.inmuebles.map((i) => (
        <button
          key={i.id}
          type="button"
          onClick={() => elegir(i.id)}
          aria-current={i.id === selId ? "true" : undefined}
          className={`flex items-start gap-2 rounded-md px-2 py-2 text-left ${i.id === selId ? "bg-pn-navy text-white" : "hover:bg-pn-calido"}`}
        >
          <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: ESTADO_INFO[i.estado].color }} aria-hidden="true" />
          <span className="min-w-0">
            <span className={`block text-[13px] font-medium leading-snug ${compacta ? "" : "truncate"}`}>{i.nombre}</span>
            <span className={`block text-[11.5px] ${i.id === selId ? "text-white/75" : "text-pn-sub"}`}>
              {i.municipio || "Sin municipio"} · {ESTADO_INFO[i.estado].etiqueta}
            </span>
          </span>
        </button>
      ))}
      <button type="button" onClick={agregar} className="mt-1 flex items-center justify-center gap-1 rounded-md border border-dashed border-pn-acero px-2 py-2 text-[12.5px] text-pn-texto">
        <Plus className="h-3.5 w-3.5" /> Nuevo inmueble
      </button>
    </div>
  );
}

/** Lista de la cartera (F-14): todos los inmuebles, con su estado. */
function Cartera({ datos, elegir, agregar }: { datos: Datos; elegir: (id: string) => void; agregar: () => void }) {
  return (
    <div className="flex flex-col gap-3">
      <section className="rounded-md border border-pn-borde bg-white p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-[13px] font-semibold text-pn-texto">Cartera de inmuebles</h3>
          <button type="button" onClick={agregar} className="flex items-center gap-1 rounded-md bg-pn-navy px-2.5 py-1.5 text-[12.5px] font-medium text-white">
            <Plus className="h-3.5 w-3.5" /> Nuevo inmueble
          </button>
        </div>
        <p className="mb-2 text-[12.5px] text-pn-sub">Toca un inmueble para acercarte: de la cartera al municipio y de ahí al predio.</p>
        <ul className="flex flex-col gap-1">
          {datos.inmuebles.map((i) => (
            <li key={i.id}>
              <button type="button" onClick={() => elegir(i.id)} className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left hover:bg-pn-calido">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: ESTADO_INFO[i.estado].color }} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-medium text-pn-texto">{i.nombre}</span>
                  <span className="block text-[12px] text-pn-sub">
                    {i.municipio || "Sin municipio"} · {ESTADO_INFO[i.estado].etiqueta}
                    {i.perimetro.length >= 3 && ` · ${fmtM2(area(i.perimetro.map((v) => [v.lng, v.lat])))}`}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 text-pn-sub" />
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-md border border-pn-borde bg-white p-3" aria-label="Simbología de estados">
        <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-pn-sub">Estado del proyecto</h3>
        <ul className="grid grid-cols-2 gap-1.5 text-[12.5px] text-pn-texto">
          {ESTADOS.map((s) => (
            <li key={s} className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ background: ESTADO_INFO[s].color }} /> {ESTADO_INFO[s].etiqueta}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11.5px] text-pn-sub">En la versión con base de datos, cada persona verá solo los inmuebles de sus proyectos; el administrador, todos.</p>
      </section>
    </div>
  );
}
