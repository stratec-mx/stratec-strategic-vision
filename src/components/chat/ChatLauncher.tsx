// Botón del agente en línea (arriba del de WhatsApp). La ventana del chat se
// carga solo cuando el visitante la abre. No aparece en el panel interno.
import { lazy, Suspense, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { MessageCircle, X } from "lucide-react";
import { track } from "@/lib/analytics";

const ChatPanel = lazy(() => import("./ChatPanel"));

const OCULTO_EN = [/^\/app(\/|$)/, /^\/auth(\/|$)/];
// En el diagnóstico no se muestra el aviso: no debe distraer del cuestionario
const SIN_AVISO_EN = [/^\/diagnostico(\/|$)/];
const AVISO_VISTO = "stratec_chat_aviso";
const URL_CHAT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-agent`;

// El botón aparece solo si la función del chat ya existe en Supabase
// (antes de crearla, el visitante vería un error al escribir).
// Se usa GET (petición simple, sin preflight): la función responde 405 con CORS
// si existe y Supabase responde 404 si no. Con OPTIONS el navegador bloqueaba
// la consulta y el botón nunca aparecía.
let disponibleCache: Promise<boolean> | null = null;
const chatDisponible = () =>
  (disponibleCache ??= fetch(URL_CHAT, { method: "GET" }).then((r) => r.status !== 404).catch(() => false));

export const ChatLauncher = () => {
  const { pathname } = useLocation();
  const [abierto, setAbierto] = useState(false);
  const [aviso, setAviso] = useState(false);
  const [disponible, setDisponible] = useState(false);

  useEffect(() => {
    let vivo = true;
    chatDisponible().then((ok) => vivo && setDisponible(ok));
    return () => { vivo = false; };
  }, []);

  // Mensaje "Resuelve tus dudas ahora mismo" una vez por sesión, a los 8 s
  useEffect(() => {
    let visto = false;
    try { visto = sessionStorage.getItem(AVISO_VISTO) === "1"; } catch { /* sin almacenamiento */ }
    if (visto) return;
    const t = window.setTimeout(() => setAviso(true), 8000);
    return () => window.clearTimeout(t);
  }, []);

  const cerrarAviso = () => {
    setAviso(false);
    try { sessionStorage.setItem(AVISO_VISTO, "1"); } catch { /* sin almacenamiento */ }
  };
  const abrir = (origen: string) => {
    cerrarAviso();
    setAbierto(true);
    track.chatOpen(origen);
  };

  if (!disponible || OCULTO_EN.some((r) => r.test(pathname))) return null;

  return (
    <>
      {abierto && (
        <Suspense fallback={null}>
          <ChatPanel onClose={() => setAbierto(false)} pathname={pathname} />
        </Suspense>
      )}

      {!abierto && (
        <div className="fixed right-4 sm:right-7 bottom-[96px] z-[810] flex flex-col items-end gap-2">
          {aviso && !SIN_AVISO_EN.some((r) => r.test(pathname)) && (
            <div className="relative max-w-[240px] bg-white border border-navy/15 shadow-lg px-4 py-3 pr-8 text-sm text-navy animate-in fade-in slide-in-from-bottom-2">
              <button type="button" onClick={cerrarAviso} aria-label="Cerrar aviso" className="absolute top-1.5 right-1.5 p-1 text-steel hover:text-navy">
                <X className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => abrir("aviso")} className="text-left">
                <span className="font-semibold block">Resuelve tus dudas ahora mismo</span>
                <span className="text-xs text-steel">Pregúntale a nuestro asistente virtual.</span>
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => abrir("boton")}
            aria-label="Habla con nuestro asistente en línea, disponible las 24 horas"
            className="group flex items-center gap-3 bg-navy-deep hover:bg-navy text-smoke shadow-[0_4px_20px_rgba(11,31,58,0.35)] border border-[#C4A04A]/60 rounded-full pl-3 pr-3 sm:pr-5 h-14 transition-colors"
          >
            <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#C4A04A] text-navy">
              <MessageCircle className="h-5 w-5" />
              <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-navy-deep" aria-hidden />
            </span>
            <span className="hidden sm:flex flex-col items-start leading-tight">
              <span className="text-sm font-semibold">Habla con nuestro asistente en línea</span>
              <span className="text-[11px] text-[#C4A04A]">Disponible las 24 h</span>
            </span>
          </button>
        </div>
      )}
    </>
  );
};
