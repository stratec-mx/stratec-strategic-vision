// Inmuebles de ejemplo del prototipo, para probar el panel de punta a punta.
//
// - "Ejemplo: H. Ayuntamiento de Temixco": ubicación y contorno REALES, tomados de OpenStreetMap
//   (way 115153850, © colaboradores de OpenStreetMap, licencia ODbL). TODO lo demás es de ejemplo:
//   elementos, hallazgos, croquis interior y fotos (ilustraciones, no fotos reales). Por la regla 5 del
//   Documento 04, en un edificio real no se ponen cámaras, accesos ni puntos ciegos, aunque sean ficticios.
// - Los elementos de seguridad y tecnología (cámara, torniquete, pluma…) van en la bodega ficticia.

import { aLocal, destino, type LngLat } from "./geo";
import { agregarAbertura, agregarMuro, cambiarEspacio, dist, nivelVacio, nuevoId, poligonoEspacio, puntoInterior, type Croquis, type Nivel, type P } from "./croquis";
import type { ElementoMapa, Hallazgo, Inmueble } from "./inmuebles";
import type { FotoRef } from "./fotos";

export const ID_EJEMPLO_TEMIXCO = "ejemplo-temixco";

/** Contorno del edificio en OpenStreetMap (way 115153850). */
const CONTORNO_TEMIXCO: LngLat[] = [
  [-99.2237575, 18.8456393],
  [-99.2240579, 18.8455022],
  [-99.2242779, 18.8454692],
  [-99.2242377, 18.8451037],
  [-99.2238568, 18.8451519],
];

const foto = (archivo: string, fecha: string): FotoRef => ({ id: `ejemplo-${archivo}`, fecha, origen: "camara", personas: false, url: `/plano-ejemplo/${archivo}.svg` });

const centro = (pts: LngLat[]): LngLat => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
const medio = (a: LngLat, b: LngLat): LngLat => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

function croquisTemixco(): Croquis {
  // Croquis ILUSTRATIVO: sigue el contorno real, pero la distribución interior es de ejemplo.
  const origen: LngLat = [Math.min(...CONTORNO_TEMIXCO.map((p) => p[0])), Math.max(...CONTORNO_TEMIXCO.map((p) => p[1]))];
  const pts: P[] = CONTORNO_TEMIXCO.map((p) => {
    const l = aLocal(origen, p);
    return { x: Math.round(l.x * 100) / 100, y: Math.round(l.y * 100) / 100 };
  });
  let pb: Nivel = nivelVacio("Planta baja", 0, 3.5);
  for (let i = 0; i < pts.length; i++) pb = agregarMuro(pb, pts[i], pts[(i + 1) % pts.length]);
  // Muro interior de norte a sur: atención ciudadana al poniente, oficinas al oriente.
  const a = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
  const b = { x: (pts[3].x + pts[4].x) / 2, y: (pts[3].y + pts[4].y) / 2 };
  pb = agregarMuro(pb, a, b);
  const corte = (a.x + b.x) / 2;
  for (const e of pb.espacios) {
    const c = puntoInterior(poligonoEspacio(pb, e));
    pb = c.x < corte ? cambiarEspacio(pb, e.id, { nombre: "Atención ciudadana (ejemplo)", tipo: "area_publico" }) : cambiarEspacio(pb, e.id, { nombre: "Oficinas (ejemplo)", tipo: "oficina" });
  }
  // Puerta principal en el muro sur y una puerta en el muro interior.
  const muroSur = pb.muros.find((m) => {
    const va = pb.vertices.find((v) => v.id === m.a)!;
    const vb = pb.vertices.find((v) => v.id === m.b)!;
    return dist(va, pts[3]) < 0.05 || dist(vb, pts[3]) < 0.05 ? dist(va, pts[4]) > 0.05 || dist(vb, pts[4]) > 0.05 : false;
  });
  if (muroSur) pb = agregarAbertura(pb, muroSur.id, 0.5, "puerta", 1.8);
  const muroInterior = pb.muros.find((m) => {
    const va = pb.vertices.find((v) => v.id === m.a)!;
    const vb = pb.vertices.find((v) => v.id === m.b)!;
    return Math.abs(va.x - corte) < 2 && Math.abs(vb.x - corte) < 2;
  });
  if (muroInterior) pb = agregarAbertura(pb, muroInterior.id, 0.4, "puerta");
  // Equipos de ejemplo en el interior.
  const zonas = pb.espacios.map((e) => ({ e, c: puntoInterior(poligonoEspacio(pb, e)) }));
  const publico = zonas.find((z) => z.e.tipo === "area_publico")?.c ?? pts[0];
  const oficinas = zonas.find((z) => z.e.tipo === "oficina")?.c ?? pts[0];
  pb = {
    ...pb,
    simbolos: [
      { id: nuevoId("y"), tipo: "extintor", x: publico.x - 4, y: publico.y - 3, condicion: "bueno", ficha: { agente: "PQS (polvo químico seco)", capacidad_kg: 6, fecha_recarga: "2026-03-15" } },
      { id: nuevoId("y"), tipo: "botiquin", x: oficinas.x + 3, y: oficinas.y - 3, condicion: "regular", ficha: { tipo: "Fijo", completo: false } },
      { id: nuevoId("y"), tipo: "salida_emergencia", x: (pts[3].x + pts[4].x) / 2, y: (pts[3].y + pts[4].y) / 2 - 1.5, ficha: { ancho_m: 1.8, senalizada: true, libre: true } },
      { id: nuevoId("y"), tipo: "alarma_emergencia", x: oficinas.x, y: oficinas.y + 2, situacion: "propuesto" },
    ],
    rutas: [{ id: nuevoId("r"), puntos: [{ x: oficinas.x, y: oficinas.y }, { x: corte, y: oficinas.y + 4 }, { x: (pts[3].x + pts[4].x) / 2, y: (pts[3].y + pts[4].y) / 2 }] }],
  };
  return { niveles: [pb] };
}

export function ejemploTemixco(): Inmueble {
  const hoy = new Date().toISOString();
  const c = centro(CONTORNO_TEMIXCO);
  const sur = medio(CONTORNO_TEMIXCO[3], CONTORNO_TEMIXCO[4]);
  const reunion = destino(sur, 28, 180);
  const extintorViejo: ElementoMapa = {
    id: "ejemplo-temixco-ext1", tipo: "extintor", ...lngLat(destino(c, 12, 315)),
    condicion: "regular", ficha: { agente: "PQS (polvo químico seco)", capacidad_kg: 6, fecha_recarga: "2025-04-10" },
    nota: "Ejemplo: recarga vencida", fotos: [foto("extintor", hoy)],
  };
  const salidaObstruida: ElementoMapa = {
    id: "ejemplo-temixco-sal2", tipo: "salida_emergencia", ...lngLat(medio(CONTORNO_TEMIXCO[4], CONTORNO_TEMIXCO[0])),
    condicion: "malo", ficha: { ancho_m: 0.9, senalizada: false, libre: false }, nota: "Ejemplo: salida lateral con mobiliario",
  };
  const elementos: ElementoMapa[] = [
    extintorViejo,
    { id: nuevoId("x"), tipo: "extintor", ...lngLat(destino(c, 10, 135)), condicion: "bueno", ficha: { agente: "CO₂", capacidad_kg: 4.5, fecha_recarga: "2026-06-01" } },
    { id: nuevoId("x"), tipo: "salida_emergencia", ...lngLat(sur), condicion: "bueno", ficha: { ancho_m: 1.8, senalizada: true, libre: true }, fotos: [foto("salida", hoy), foto("fachada", hoy)] },
    salidaObstruida,
    { id: nuevoId("x"), tipo: "botiquin", ...lngLat(destino(c, 6, 45)), condicion: "regular", ficha: { tipo: "Fijo", completo: false }, fotos: [foto("botiquin", hoy)] },
    { id: nuevoId("x"), tipo: "alarma_emergencia", ...lngLat(destino(c, 4, 250)), situacion: "propuesto", nota: "Ejemplo: alarma sonora y visual propuesta" },
    { id: nuevoId("x"), tipo: "punto_reunion", ...lngLat(reunion), fotos: [foto("punto-reunion", hoy)] },
    { id: nuevoId("x"), tipo: "iluminacion", ...lngLat(destino(sur, 12, 160)), situacion: "propuesto", nota: "Ejemplo: luminaria en la ruta al punto de reunión" },
  ];
  const hallazgos: Hallazgo[] = [
    { id: nuevoId("h"), titulo: "Extintor con recarga vencida (ejemplo)", fecha: hoy, elementoId: extintorViejo.id, lng: extintorViejo.lng, lat: extintorViejo.lat, fotos: [foto("extintor", hoy)], estado: "propuesta", severidad: "media", descripcion: "La etiqueta indica la última recarga en abril de 2025. Programar recarga y revisión." },
    { id: nuevoId("h"), titulo: "Salida lateral obstruida (ejemplo)", fecha: hoy, elementoId: salidaObstruida.id, lng: salidaObstruida.lng, lat: salidaObstruida.lat, fotos: [], estado: "propuesta", severidad: "alta" },
  ];
  return {
    id: ID_EJEMPLO_TEMIXCO,
    nombre: "Ejemplo: H. Ayuntamiento de Temixco",
    municipio: "Temixco",
    estado: "prospecto",
    clienteNombre: "Ejemplo (no es cliente)",
    ubicacion: { lng: c[0], lat: c[1], fecha: hoy },
    perimetro: CONTORNO_TEMIXCO.map(([lng, lat]) => ({ lng, lat, origen: "manual" as const })),
    metodo: "levantamiento_campo",
    colindancias: CONTORNO_TEMIXCO.map(() => ({ descripcion: "Por verificar en campo" })),
    elementos,
    rutas: [{ id: nuevoId("r"), coords: [c, sur, reunion] }],
    croquis: croquisTemixco(),
    hallazgos,
    actualizado: hoy,
  };
}

function lngLat(p: LngLat) {
  return { lng: p[0], lat: p[1] };
}

/** Elementos de seguridad y tecnología de ejemplo para la bodega ficticia (existentes y propuestos). */
export function elementosTecnologiaBodega(esquinaSO: LngLat): ElementoMapa[] {
  const p = (este: number, norte: number): { lng: number; lat: number } => lngLat(destino(destino(esquinaSO, este, 90), norte, 0));
  return [
    { id: nuevoId("x"), tipo: "acceso_vehicular", ...p(6, -1) },
    { id: nuevoId("x"), tipo: "pluma_vehicular", ...p(6, 1), situacion: "propuesto", nota: "Ejemplo: pluma con lector de tarjeta" },
    { id: nuevoId("x"), tipo: "acceso_peatonal", ...p(20, -1) },
    { id: nuevoId("x"), tipo: "torniquete", ...p(20, 1.5), situacion: "propuesto", nota: "Ejemplo: torniquete de media altura" },
    { id: nuevoId("x"), tipo: "caseta_vigilancia", ...p(12, 2), situacion: "propuesto" },
    { id: nuevoId("x"), tipo: "camara", ...p(1, 1), camara: { direccion: 45, angulo: 90, alcance: 18 }, condicion: "regular", ficha: { tipo_camara: "Bullet", megapixeles: "2 MP (1080p)", lente: "Fija", vision_nocturna: true, alcance_ir_m: 20 } },
    { id: nuevoId("x"), tipo: "camara", ...p(29, 19), situacion: "propuesto", camara: { direccion: 225, angulo: 90, alcance: 20 }, ficha: { tipo_camara: "Domo", megapixeles: "8 MP (4K)", lente: "Varifocal", vision_nocturna: true, alcance_ir_m: 30 } },
    { id: nuevoId("x"), tipo: "camara", ...p(15, 10), situacion: "propuesto", camara: { direccion: 0, angulo: 360, alcance: 12 }, ficha: { tipo_camara: "Ojo de pez (360°)", megapixeles: "12 MP", lente: "Fija", vision_nocturna: true, alcance_ir_m: 10 } },
    { id: nuevoId("x"), tipo: "cerca_electrica", ...p(15, 20), situacion: "propuesto" },
    { id: nuevoId("x"), tipo: "punto_ciego", ...p(28, 2), nota: "Ejemplo: esquina sin cobertura de cámara" },
  ];
}
