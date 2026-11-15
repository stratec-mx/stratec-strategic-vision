import { useEffect } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { rutaLimpia } from "@/lib/rutaLimpia";
import { track } from "@/lib/analytics";

const WHATSAPP = `https://wa.me/522206488688?text=${encodeURIComponent("Hola STRATEC, no encontré una página del sitio y quiero información.")}`;

const NotFound = () => {
  const { pathname, search, hash } = useLocation();

  // Enlaces que llegan con un signo pegado al final ("/diagnostico)", "/diagnostico.")
  // se corrigen solos: es lo que pasa cuando un chat pega la puntuación al enlace.
  const limpia = rutaLimpia(pathname);
  const noExiste = limpia === pathname;

  // Una dirección que no existe no debe aparecer en Google. Se cambia la etiqueta
  // robots del documento mientras esta página está a la vista y se restaura al salir.
  useEffect(() => {
    if (!noExiste) return;
    const meta = document.querySelector('meta[name="robots"]');
    const previo = meta?.getAttribute("content") ?? null;
    meta?.setAttribute("content", "noindex, follow");
    return () => { if (meta && previo != null) meta.setAttribute("content", previo); };
  }, [noExiste]);

  if (!noExiste) return <Navigate to={`${limpia}${search}${hash}`} replace />;

  return (
    <div className="min-h-screen bg-smoke flex flex-col">
      <Navbar />
      <main className="flex-1 pt-36 pb-24">
        <div className="container-wide max-w-2xl mx-auto px-4 text-center">
          <div className="eyebrow mb-3">— Página no encontrada</div>
          <div className="font-display text-7xl md:text-8xl font-light text-[#C4A04A] leading-none mb-4" aria-hidden>404</div>
          <h1 className="font-display text-3xl md:text-4xl text-navy font-light leading-tight mb-4">No encontramos esta página</h1>
          <p className="text-steel text-sm md:text-base leading-relaxed mb-10">
            Puede que el enlace esté incompleto o que la página haya cambiado de lugar. Desde aquí puedes llegar a lo más buscado.
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            <Link to="/diagnostico" className="inline-flex items-center justify-center gap-2 bg-[#C4A04A] hover:bg-[#b3923f] text-navy font-semibold px-6 h-12 uppercase tracking-wider text-xs transition-colors">
              Diagnóstico gratuito <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/" className="inline-flex items-center justify-center bg-navy hover:bg-navy-deep text-smoke px-6 h-12 uppercase tracking-wider text-xs transition-colors">
              Ir al inicio
            </Link>
            <a
              href={WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track.whatsappClick("pagina_404")}
              className="inline-flex items-center justify-center border border-navy/30 text-navy hover:border-navy px-6 h-12 uppercase tracking-wider text-xs transition-colors"
            >
              Escribir por WhatsApp
            </a>
          </div>
          <p className="mt-8 text-xs text-steel">
            También puedes ver todos los <Link to="/servicios" className="underline hover:text-navy">servicios</Link>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
