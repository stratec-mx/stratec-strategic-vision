// Módulos de la metodología M-DESR cuyas tablas aún están en diseño.
// Se ven en el menú y explican qué harán; no muestran datos de ejemplo.
import { Link, useLocation } from "react-router-dom";
import { MODULOS } from "@/components/app/panelNav";

const EnPreparacion = () => {
  const { pathname } = useLocation();
  const modulo = MODULOS.find((m) => m.to === pathname.replace(/\/+$/, ""));
  return (
    <section className="rounded-lg border border-pn-borde bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-pn-borde px-4 py-3.5">
        <h2 className="text-[15px] font-semibold text-pn-texto">{modulo?.label ?? "Módulo"}</h2>
        <span className="rounded border border-dashed border-pn-acero px-2 py-1 text-[11px] font-semibold text-pn-acero">En preparación</span>
      </div>
      <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        {modulo && (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7B7F42" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={modulo.d} /></svg>
        )}
        <p className="max-w-lg text-sm text-pn-texto">{modulo?.enPreparacion ?? "Este módulo se habilitará en la siguiente etapa."}</p>
        <p className="max-w-lg text-[13px] text-pn-sub">
          Forma parte de la metodología M-DESR y se habilitará cuando su estructura de datos quede aprobada.
        </p>
        <Link to="/app" className="mt-2 text-xs font-semibold text-pn-navy hover:underline">Volver al Panel general</Link>
      </div>
    </section>
  );
};

export default EnPreparacion;
