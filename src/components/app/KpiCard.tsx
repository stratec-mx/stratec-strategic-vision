import { LucideIcon } from "lucide-react";

/** Tarjeta de indicador con el estilo del panel (sin sombra; el ícono es opcional). */
export const KpiCard = ({
  label, value, delta, icon: Icon, hint,
}: { label: string; value: string; delta?: string; icon?: LucideIcon; hint?: string }) => (
  <div className="flex flex-col gap-1.5 rounded-lg border border-pn-borde bg-white px-[18px] py-4">
    <div className="flex items-start justify-between gap-2">
      <span className="text-xs font-medium text-pn-sub">{label}</span>
      {Icon && <Icon className="h-4 w-4 text-pn-oliva" />}
    </div>
    <span className="tnum text-[28px] font-semibold tracking-[-0.02em] text-pn-texto">{value}</span>
    {(delta || hint) && (
      <span className="flex items-center gap-2 text-xs font-medium text-pn-sub">
        {delta && <span className="text-pn-ok">{delta}</span>}
        {hint && <span>{hint}</span>}
      </span>
    )}
  </div>
);
