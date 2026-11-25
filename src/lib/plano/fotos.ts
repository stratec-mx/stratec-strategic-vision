// Fotos del prototipo (Documento 04 F-08 y §13 D-P9).
// Mientras no exista la base de datos, las fotos se guardan en el propio equipo (IndexedDB), reducidas
// a 1600 px. En la versión conectada se suben al almacenamiento privado del expediente (mdesr-evidencias).

export interface FotoRef {
  id: string;
  fecha: string;
  /** Cómo se obtuvo (evidence.capture_mode): con la cámara en el momento o desde la galería ("subida después"). */
  origen: "camara" | "galeria";
  /** "Aparecen personas o placas" (evidence.contains_personal_data): nunca sale en documentos. */
  personas: boolean;
  lng?: number;
  lat?: number;
  /** Fotos de ejemplo incluidas en el prototipo (archivo público, no del usuario). */
  url?: string;
}

const BASE = "stratec-plano-fotos";
const ALMACEN = "fotos";

function abrir(): Promise<IDBDatabase> {
  return new Promise((ok, mal) => {
    const r = indexedDB.open(BASE, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(ALMACEN);
    r.onsuccess = () => ok(r.result);
    r.onerror = () => mal(r.error ?? new Error("No se pudo abrir el almacén de fotos."));
  });
}

async function operar<T>(modo: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await abrir();
  return new Promise((ok, mal) => {
    const tx = db.transaction(ALMACEN, modo);
    const r = f(tx.objectStore(ALMACEN));
    tx.oncomplete = () => {
      db.close();
      ok(r.result);
    };
    tx.onerror = () => {
      db.close();
      mal(tx.error ?? new Error("Error del almacén de fotos."));
    };
  });
}

/** Reduce la foto a un máximo de `lado` px por lado, en JPEG. */
export async function reducir(archivo: Blob, lado = 1600, calidad = 0.82): Promise<Blob> {
  const img = await createImageBitmap(archivo);
  const k = Math.min(1, lado / Math.max(img.width, img.height));
  const w = Math.round(img.width * k);
  const h = Math.round(img.height * k);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  c.getContext("2d")!.drawImage(img, 0, 0, w, h);
  img.close();
  return new Promise((ok, mal) => c.toBlob((b) => (b ? ok(b) : mal(new Error("No se pudo procesar la foto."))), "image/jpeg", calidad));
}

export const guardarFoto = (id: string, blob: Blob) => operar("readwrite", (s) => s.put(blob, id));
export const leerFoto = (id: string) => operar<Blob | undefined>("readonly", (s) => s.get(id) as IDBRequest<Blob | undefined>);
export const borrarFoto = (id: string) => operar("readwrite", (s) => s.delete(id));

/** Ubicación aproximada del momento, si el equipo la da rápido (no bloquea la captura). */
export function ubicacionRapida(): Promise<{ lng: number; lat: number } | null> {
  return new Promise((ok) => {
    if (!("geolocation" in navigator)) return ok(null);
    navigator.geolocation.getCurrentPosition(
      (p) => ok({ lng: p.coords.longitude, lat: p.coords.latitude }),
      () => ok(null),
      { enableHighAccuracy: false, maximumAge: 120000, timeout: 4000 },
    );
  });
}
