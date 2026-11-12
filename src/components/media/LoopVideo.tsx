// Video decorativo en bucle para el fondo de un encabezado (hero).
//
// Qué hace:
//   - Pinta el póster de inmediato dentro de una caja que ya reserva su
//     proporción, así la página no salta cuando llega el video.
//   - Pide el video solo cuando la página terminó de cargar y la caja está cerca
//     de la pantalla. Lo pausa al salir de pantalla y lo reanuda al volver.
//   - No pide el video si el visitante prefiere menos movimiento o tiene activado
//     el ahorro de datos. En esos casos, o si el video falla, se queda el póster.
//   - Es decorativo: sin sonido, sin controles, fuera del orden del teclado y
//     oculto para lectores de pantalla. El contenido real va en `children`.
//
// Guía de uso, pesos máximos y comandos para preparar los clips:
// docs/videos-en-bucle.md
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface LoopVideoProps {
  /** Imagen fija que se ve desde el primer momento. Lo ideal: el primer cuadro del video (hasta 150 KB). */
  poster: string;
  /** Video en formato WebM. Es el que se intenta primero. */
  webm?: string;
  /** Video en formato MP4. Respaldo para navegadores que no reproducen WebM. */
  mp4?: string;
  /** Versión ligera en WebM para pantallas angostas (celulares). Opcional. */
  mobileWebm?: string;
  /** Versión ligera en MP4 para pantallas angostas (celulares). Opcional. */
  mobileMp4?: string;
  /** Ancho máximo de pantalla, en pixeles, que usa la versión ligera. Por omisión 767. */
  mobileMaxWidth?: number;
  /**
   * Proporción que reserva la caja, en formato CSS. Por omisión "16 / 9".
   * Con `null` no se reserva proporción: en ese caso el alto se fija con
   * `className` (por ejemplo "min-h-[70vh]") para que la página no salte.
   */
  aspectRatio?: string | null;
  /**
   * Capa oscura sobre el video para que el texto se lea bien.
   * `true` usa 0.55; también acepta un número entre 0 (sin capa) y 1 (negro total).
   */
  overlay?: boolean | number;
  /** Distancia a la pantalla desde la que se empieza a pedir el video. Por omisión "200px". */
  rootMargin?: string;
  /** Clases extra para la caja (alto, márgenes, etc.). */
  className?: string;
  /** Clases extra para el póster y el video (por ejemplo "object-top" para encuadrar). */
  mediaClassName?: string;
  /** Clases extra para la capa de contenido (por ejemplo "flex items-center" para centrar en vertical). */
  contentClassName?: string;
  /** Contenido que va encima del video: títulos, textos y botones. */
  children?: ReactNode;
}

const DEFAULT_OVERLAY = 0.55;
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

type ConnectionInfo = { saveData?: boolean };

/** Verdadero si el visitante pidió menos movimiento o tiene activado el ahorro de datos. */
function prefersNoVideo() {
  const reducedMotion = typeof window.matchMedia === "function" && window.matchMedia(REDUCED_MOTION).matches;
  const saveData = (navigator as Navigator & { connection?: ConnectionInfo }).connection?.saveData === true;
  return reducedMotion || saveData;
}

type Source = { src: string; type: string };

export function LoopVideo({
  poster,
  webm,
  mp4,
  mobileWebm,
  mobileMp4,
  mobileMaxWidth = 767,
  aspectRatio = "16 / 9",
  overlay = false,
  rootMargin = "200px",
  className,
  mediaClassName,
  contentClassName,
  children,
}: LoopVideoProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Empieza en falso: en el primer render solo existe el póster
  const [allowed, setAllowed] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);
  const [sources, setSources] = useState<Source[] | null>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  const hasVideo = Boolean(webm || mp4 || mobileWebm || mobileMp4);

  // Preferencias del visitante. Si cambia a "menos movimiento" con el video ya puesto, se quita.
  useEffect(() => {
    const update = () => setAllowed(!prefersNoVideo());
    update();
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia(REDUCED_MOTION);
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);

  // El video nunca compite con la carga de la página
  useEffect(() => {
    if (document.readyState === "complete") {
      setPageLoaded(true);
      return;
    }
    const onLoad = () => setPageLoaded(true);
    window.addEventListener("load", onLoad, { once: true });
    return () => window.removeEventListener("load", onLoad);
  }, []);

  // Cerca de la pantalla (para pedir el video) y dentro de la pantalla (para reproducir o pausar)
  useEffect(() => {
    const box = boxRef.current;
    if (!box || !allowed || !hasVideo || typeof IntersectionObserver === "undefined") return;
    const nearObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          nearObserver.disconnect();
        }
      },
      { rootMargin },
    );
    const visibleObserver = new IntersectionObserver((entries) => {
      setVisible(entries[entries.length - 1].isIntersecting);
    });
    nearObserver.observe(box);
    visibleObserver.observe(box);
    return () => {
      nearObserver.disconnect();
      visibleObserver.disconnect();
    };
  }, [allowed, hasVideo, rootMargin]);

  // Se eligen los archivos una sola vez, al momento de pedirlos: girar el
  // celular no vuelve a descargar otro video.
  useEffect(() => {
    if (sources || !allowed || !pageLoaded || !near || !hasVideo) return;
    const narrow = typeof window.matchMedia === "function" && window.matchMedia(`(max-width: ${mobileMaxWidth}px)`).matches;
    const useMobile = narrow && Boolean(mobileWebm || mobileMp4);
    const chosen: Source[] = [];
    const chosenWebm = useMobile ? mobileWebm : webm;
    const chosenMp4 = useMobile ? mobileMp4 : mp4;
    if (chosenWebm) chosen.push({ src: chosenWebm, type: "video/webm" });
    if (chosenMp4) chosen.push({ src: chosenMp4, type: "video/mp4" });
    if (chosen.length) setSources(chosen);
  }, [sources, allowed, pageLoaded, near, hasVideo, mobileMaxWidth, mobileWebm, mobileMp4, webm, mp4]);

  const showVideo = allowed && !failed && sources !== null;

  // Reproduce al entrar en pantalla y pausa al salir
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !showVideo) return;
    if (!visible) {
      video.pause();
      return;
    }
    // Sin sonido de forma explícita: es lo que permite la reproducción automática
    video.muted = true;
    video.defaultMuted = true;
    // Si el navegador la bloquea (por ejemplo, modo de bajo consumo) se queda el póster
    video.play()?.catch(() => undefined);
  }, [visible, showVideo]);

  // Al quitar el video (por preferencia o por error) vuelve a mandar el póster
  useEffect(() => {
    if (!showVideo) setPlaying(false);
  }, [showVideo]);

  const overlayOpacity = overlay === true ? DEFAULT_OVERLAY : overlay === false ? 0 : Math.min(1, Math.max(0, overlay));
  const mediaClasses = cn("absolute inset-0 h-full w-full object-cover", mediaClassName);

  return (
    <div
      ref={boxRef}
      className={cn("relative isolate grid w-full", className)}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* Capa decorativa: póster, video y oscurecido */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-navy-deep" aria-hidden="true">
        <img src={poster} alt="" decoding="async" draggable={false} className={mediaClasses} />
        {showVideo && (
          <video
            ref={videoRef}
            className={cn(mediaClasses, "transition-opacity duration-700", playing ? "opacity-100" : "opacity-0")}
            muted
            loop
            playsInline
            autoPlay
            preload="none"
            tabIndex={-1}
            aria-hidden="true"
            disablePictureInPicture
            disableRemotePlayback
            controlsList="nodownload nofullscreen noremoteplayback"
            onPlaying={() => setPlaying(true)}
            onError={() => setFailed(true)}
          >
            {sources.map((source, index) => (
              <source
                key={source.src}
                src={source.src}
                type={source.type}
                // El navegador prueba los archivos en orden; si falla el último, no hay video
                onError={index === sources.length - 1 ? () => setFailed(true) : undefined}
              />
            ))}
          </video>
        )}
        {overlayOpacity > 0 && <div className="absolute inset-0 bg-navy-deep" style={{ opacity: overlayOpacity }} />}
      </div>
      {/* Contenido real: ocupa toda la caja y, si es más alto que ella, la caja crece */}
      {children != null && <div className={cn("relative min-w-0", contentClassName)}>{children}</div>}
    </div>
  );
}
