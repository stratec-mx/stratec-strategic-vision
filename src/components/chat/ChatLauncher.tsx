// Botón del agente en línea (arriba del de WhatsApp). La ventana del chat se
// carga solo cuando el visitante la abre. No aparece en el panel interno.
import { lazy, Suspense, useEffect, useState } from "react";
import { esLanding } from "@/data/landings";
import { useLocation } from "react-router-dom";
import { X } from "lucide-react";
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

  // En las landings no se muestra: el visitante ya tiene el formulario y WhatsApp.
  if (!disponible || OCULTO_EN.some((r) => r.test(pathname)) || esLanding(pathname)) return null;

  return (
    <>
      {abierto && (
        <Suspense fallback={null}>
          <ChatPanel onClose={() => setAbierto(false)} pathname={pathname} />
        </Suspense>
      )}

      {!abierto && (
        <div className="fixed right-[28px] bottom-[96px] z-[810] flex flex-col items-end gap-2">
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
            title="Habla con nuestro asistente en línea · 24 h"
            className="chat-bot relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#DDBB63] to-[#B48D36] text-navy-deep ring-2 ring-white/70 shadow-[0_4px_20px_rgba(180,141,54,0.45)] transition-transform duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy/40"
          >
            <CaraChat />
            <span className="absolute top-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-white" aria-hidden />
          </button>
        </div>
      )}
    </>
  );
};

// Globo de chat con ojos: miran a los lados, parpadean y a ratos "duermen" (Zzz).
// Las animaciones están en index.css (.chat-bot); al pasar el mouse se despierta.
const CaraChat = () => (
  <svg viewBox="0 0 32 32" className="h-9 w-9 overflow-visible" aria-hidden>
    <path d="M10 5h12a6.5 6.5 0 0 1 6.5 6.5v5A6.5 6.5 0 0 1 22 23h-8.5l-5.2 4.3a.7.7 0 0 1-1.15-.55V22.6A6.5 6.5 0 0 1 3.5 16.5v-5A6.5 6.5 0 0 1 10 5Z" fill="currentColor" />
    <g className="chat-bot-ojos">
      <ellipse cx="12" cy="14" rx="3.1" ry="3.5" fill="#fff" />
      <ellipse cx="20" cy="14" rx="3.1" ry="3.5" fill="#fff" />
      <g className="chat-bot-pupilas" fill="currentColor">
        <circle cx="12" cy="14.3" r="1.55" />
        <circle cx="20" cy="14.3" r="1.55" />
      </g>
    </g>
    <text x="25.5" y="5" className="chat-bot-zzz" fill="currentColor" fontSize="6" fontWeight="700" fontFamily="sans-serif">z</text>
  </svg>
);
