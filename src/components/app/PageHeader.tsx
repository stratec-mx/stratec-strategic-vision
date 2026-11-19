import { ReactNode } from "react";

/**
 * Encabezado de sección dentro de una página del panel. El nombre del módulo ya va
 * en la barra superior; aquí va el subtítulo, una línea de contexto y las acciones.
 */
export const PageHeader = ({
  eyebrow, title, description, actions,
}: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) => (
  <div className="mb-[18px] flex flex-wrap items-end justify-between gap-3">
    <div className="flex min-w-0 flex-col gap-1">
      {eyebrow && <span className="text-[13px] text-pn-sub">{eyebrow}</span>}
      <h2 className="text-[15px] font-semibold text-pn-texto">{title}</h2>
      {description && <p className="max-w-2xl text-[13px] text-pn-sub">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);
