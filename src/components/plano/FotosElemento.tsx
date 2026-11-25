// Fotos de un elemento, colindancia o hallazgo: tomar con la cámara o subir de la galería (D-P9).

import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, Trash2, X } from "lucide-react";
import { nuevoId } from "@/lib/plano/croquis";
import { borrarFoto, guardarFoto, leerFoto, reducir, ubicacionRapida, type FotoRef } from "@/lib/plano/fotos";

function Miniatura({ foto, abrir }: { foto: FotoRef; abrir: (url: string) => void }) {
  const [url, setUrl] = useState<string | null>(foto.url ?? null);
  useEffect(() => {
    if (foto.url) return;
    let creada: string | null = null;
    let vivo = true;
    leerFoto(foto.id)
      .then((b) => {
        if (b && vivo) {
          creada = URL.createObjectURL(b);
          setUrl(creada);
        }
      })
      .catch(() => undefined);
    return () => {
      vivo = false;
      if (creada) URL.revokeObjectURL(creada);
    };
  }, [foto.id, foto.url]);
  return (
    <button type="button" onClick={() => url && abrir(url)} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-pn-borde bg-pn-calido" aria-label="Ver foto">
      {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : <span className="text-[10px] text-pn-sub">sin archivo</span>}
      {foto.personas && <span className="absolute bottom-0 left-0 right-0 bg-pn-alerta/90 text-[9px] leading-4 text-white">no sale en PDF</span>}
      {foto.origen === "galeria" && !foto.url && <span className="absolute right-0 top-0 rounded-bl bg-pn-navy/85 px-1 text-[9px] leading-4 text-white">galería</span>}
    </button>
  );
}

export function FotosElemento({ fotos, cambiar }: { fotos: FotoRef[]; cambiar: (f: FotoRef[]) => void }) {
  const camara = useRef<HTMLInputElement>(null);
  const galeria = useRef<HTMLInputElement>(null);
  const [personas, setPersonas] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [grande, setGrande] = useState<string | null>(null);

  const agregar = async (archivos: FileList | null, origen: FotoRef["origen"]) => {
    if (!archivos?.length) return;
    setSubiendo(true);
    setError(null);
    try {
      const donde = await ubicacionRapida();
      const nuevas: FotoRef[] = [];
      for (const a of Array.from(archivos)) {
        const id = nuevoId("f");
        await guardarFoto(id, await reducir(a));
        nuevas.push({ id, fecha: new Date(a.lastModified || Date.now()).toISOString(), origen, personas, ...(donde ?? {}) });
      }
      cambiar([...fotos, ...nuevas]);
    } catch {
      setError("No se pudo guardar la foto en este equipo.");
    } finally {
      setSubiendo(false);
    }
  };

  const quitar = (f: FotoRef) => {
    if (!window.confirm("¿Borrar esta foto?")) return;
    if (!f.url) void borrarFoto(f.id).catch(() => undefined);
    cambiar(fotos.filter((x) => x.id !== f.id));
  };

  return (
    <div>
      <span className="mb-1 block text-[12px] font-medium text-pn-sub">Fotos ({fotos.length})</span>
      {fotos.length > 0 && (
        <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
          {fotos.map((f) => (
            <div key={f.id} className="relative">
              <Miniatura foto={f} abrir={setGrande} />
              <button type="button" onClick={() => quitar(f)} aria-label="Borrar foto" className="absolute -right-1 -top-1 rounded-full bg-white p-0.5 text-pn-alerta shadow">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-1.5">
        <button type="button" onClick={() => camara.current?.click()} disabled={subiendo} className="flex items-center justify-center gap-1.5 rounded-md border border-pn-borde bg-white px-2 py-2 text-[12.5px] font-medium">
          {subiendo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />} Tomar foto
        </button>
        <button type="button" onClick={() => galeria.current?.click()} disabled={subiendo} className="flex items-center justify-center gap-1.5 rounded-md border border-pn-borde bg-white px-2 py-2 text-[12.5px] font-medium">
          <ImagePlus className="h-4 w-4" /> De la galería
        </button>
      </div>
      <label className="mt-1.5 flex items-center gap-2 text-[12px] text-pn-texto">
        <input type="checkbox" checked={personas} onChange={(e) => setPersonas(e.target.checked)} className="h-4 w-4" />
        Aparecen personas o placas (no sale en documentos)
      </label>
      {error && <p className="mt-1 text-[12px] text-pn-alerta">{error}</p>}
      <input ref={camara} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { void agregar(e.target.files, "camara"); e.target.value = ""; }} />
      <input ref={galeria} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { void agregar(e.target.files, "galeria"); e.target.value = ""; }} />
      {grande && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" role="dialog" aria-label="Foto" onClick={() => setGrande(null)}>
          <img src={grande} alt="" className="max-h-full max-w-full rounded" />
          <button type="button" aria-label="Cerrar" className="absolute right-4 top-4 rounded-full bg-white p-2"><X className="h-5 w-5" /></button>
        </div>
      )}
    </div>
  );
}
