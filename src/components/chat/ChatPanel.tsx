// Ventana del chat con el agente en línea (Supabase → chat-agent → Claude).
// La conversación vive en el navegador (sessionStorage) y se manda completa en
// cada mensaje; el servidor no guarda nada salvo que el visitante deje sus datos.
import { Fragment, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Send, X, ShieldCheck } from "lucide-react";
import { track } from "@/lib/analytics";
import { sugerenciasPara } from "./sugerencias";

type Msg = { role: "user" | "assistant"; content: string };

const URL_CHAT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-agent`;
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const ALMACEN = "stratec_chat";
const MAX_CHARS = 1000;

const BIENVENIDA: Msg = {
  role: "assistant",
  content:
    "Hola, soy el asistente virtual de STRATEC. Resuelve tus dudas ahora mismo sobre protección civil, análisis de riesgos, capacitación o seguridad. ¿En qué le puedo ayudar?",
};

function cargar(): Msg[] {
  try {
    const raw = sessionStorage.getItem(ALMACEN);
    const v = raw ? (JSON.parse(raw) as Msg[]) : null;
    return Array.isArray(v) && v.length ? v : [BIENVENIDA];
  } catch {
    return [BIENVENIDA];
  }
}

/** Texto con saltos de línea y enlaces; las direcciones del sitio abren sin recargar. */
function Texto({ texto }: { texto: string }) {
  const partes = texto.split(/(https?:\/\/[^\s)]+)/g);
  return (
    <>
      {partes.map((p, i) => {
        if (!/^https?:\/\//.test(p)) return <Fragment key={i}>{p}</Fragment>;
        const limpio = p.replace(/[.,;:]+$/, "");
        const resto = p.slice(limpio.length);
        const interno = limpio.match(/^https?:\/\/(www\.)?stratecsecurity\.com(\/[^\s]*)?$/);
        return (
          <Fragment key={i}>
            {interno ? (
              <Link to={interno[2] || "/"} className="underline underline-offset-2 text-[#9a7d2f] break-words">{limpio}</Link>
            ) : (
              <a href={limpio} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 text-[#9a7d2f] break-words">{limpio}</a>
            )}
            {resto}
          </Fragment>
        );
      })}
    </>
  );
}

export default function ChatPanel({ onClose, pathname }: { onClose: () => void; pathname: string }) {
  const sugerencias = sugerenciasPara(pathname);
  const [msgs, setMsgs] = useState<Msg[]>(cargar);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const fin = useRef<HTMLDivElement>(null);
  const entrada = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try { sessionStorage.setItem(ALMACEN, JSON.stringify(msgs.slice(-40))); } catch { /* sin almacenamiento */ }
    fin.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, enviando]);

  useEffect(() => {
    entrada.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  const enviar = async (contenido: string) => {
    const limpio = contenido.trim().slice(0, MAX_CHARS);
    if (!limpio || enviando) return;
    const nuevos: Msg[] = [...msgs, { role: "user", content: limpio }];
    setMsgs(nuevos);
    setTexto("");
    setEnviando(true);
    track.chatMessage();
    try {
      const res = await fetch(URL_CHAT, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: KEY, Authorization: `Bearer ${KEY}` },
        // La bienvenida es local: no se manda al servidor
        body: JSON.stringify({ messages: nuevos.filter((m) => m !== BIENVENIDA && m.content !== BIENVENIDA.content) }),
      });
      const data = await res.json().catch(() => null);
      const respuesta: string =
        data?.reply ||
        "Tengo un problema técnico en este momento. Por favor escríbanos por WhatsApp al +52 220 648 8688 o a contacto@stratecsecurity.com.";
      if (data?.registrado) track.chatLead();
      setMsgs((m) => [...m, { role: "assistant", content: respuesta }]);
    } catch {
      setMsgs((m) => [
        ...m,
        { role: "assistant", content: "No pude conectarme. Revise su conexión o escríbanos por WhatsApp al +52 220 648 8688." },
      ]);
    } finally {
      setEnviando(false);
      entrada.current?.focus();
    }
  };

  const reiniciar = () => {
    setMsgs([BIENVENIDA]);
    try { sessionStorage.removeItem(ALMACEN); } catch { /* sin almacenamiento */ }
  };

  const soloBienvenida = msgs.length === 1;

  return (
    <div
      role="dialog"
      aria-label="Chat con el asistente virtual de STRATEC"
      className="fixed z-[950] inset-x-0 bottom-0 sm:inset-x-auto sm:right-7 sm:bottom-7 w-full sm:w-[380px] h-[85vh] sm:h-[560px] max-h-[calc(100vh-2rem)] bg-smoke border border-navy/15 shadow-2xl flex flex-col animate-in fade-in slide-in-from-bottom-4"
    >
      {/* Encabezado */}
      <div className="bg-navy-deep text-smoke px-4 py-3 flex items-center gap-3 border-b-2 border-[#C4A04A]">
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#C4A04A] text-navy">
          <ShieldCheck className="h-5 w-5" />
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-navy-deep" aria-hidden />
        </span>
        <div className="flex-1 min-w-0 leading-tight">
          <div className="text-sm font-semibold">Asistente virtual STRATEC</div>
          <div className="text-[11px] text-[#C4A04A]">En línea · Disponible las 24 h</div>
        </div>
        {!soloBienvenida && (
          <button type="button" onClick={reiniciar} className="text-[11px] text-smoke/60 hover:text-smoke underline underline-offset-2">
            Nueva conversación
          </button>
        )}
        <button type="button" onClick={onClose} aria-label="Cerrar chat" className="p-1 text-smoke/70 hover:text-smoke">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" aria-live="polite">
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                "max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap " +
                (m.role === "user" ? "bg-navy text-smoke" : "bg-white border border-navy/10 text-navy")
              }
            >
              <Texto texto={m.content} />
            </div>
          </div>
        ))}

        {soloBienvenida && (
          <div className="flex flex-wrap gap-2 pt-1">
            {sugerencias.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => enviar(s)}
                className="text-xs text-navy border border-[#C4A04A]/60 bg-white hover:bg-[#C4A04A]/10 px-3 py-1.5 text-left"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {enviando && (
          <div className="flex justify-start" aria-label="El asistente está escribiendo">
            <div className="bg-white border border-navy/10 px-4 py-3 flex gap-1">
              {[0, 1, 2].map((d) => (
                <span key={d} className="h-1.5 w-1.5 rounded-full bg-steel/60 animate-bounce" style={{ animationDelay: `${d * 150}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={fin} />
      </div>

      {/* Entrada */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar(texto);
        }}
        className="border-t border-navy/10 bg-white px-3 pt-3 pb-2"
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={entrada}
            rows={1}
            value={texto}
            maxLength={MAX_CHARS}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                enviar(texto);
              }
            }}
            placeholder="Escribe tu pregunta…"
            aria-label="Escribe tu mensaje"
            className="flex-1 resize-none max-h-28 min-h-[44px] px-3 py-2.5 text-sm border border-steel/25 focus:border-[#C4A04A] focus:outline-none bg-smoke/40"
          />
          <button
            type="submit"
            disabled={enviando || !texto.trim()}
            aria-label="Enviar mensaje"
            className="h-11 w-11 shrink-0 flex items-center justify-center bg-[#C4A04A] hover:bg-[#b3923f] text-navy disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-[10px] text-steel/80 leading-snug">
          Asistente con inteligencia artificial; un consultor revisa los casos. No compartas datos bancarios ni contraseñas.{" "}
          <Link to="/privacidad" className="underline">Aviso de privacidad</Link>
        </p>
      </form>
    </div>
  );
}
