// Estado como etiqueta de contorno, con los colores del diseño del panel.
const COLOR: Record<string, string> = {
  new: "#0B1F3A",
  contacted: "#5E646E",
  qualified: "#287A59",
  unqualified: "#667085",
  converted: "#287A59",
  active: "#287A59",
  inactive: "#667085",
  prospect: "#5E646E",
  draft: "#667085",
  sent: "#5E646E",
  accepted: "#287A59",
  rejected: "#B42318",
  expired: "#B7791F",
};

export const STATUS_LABEL: Record<string, string> = {
  new: "Nuevo", contacted: "Contactado", qualified: "Calificado", unqualified: "Descartado", converted: "Convertido",
  active: "Activo", inactive: "Inactivo", prospect: "Prospecto",
  draft: "Borrador", sent: "Enviada", accepted: "Aceptada", rejected: "Rechazada", expired: "Expirada",
};

export const StatusBadge = ({ status }: { status: string }) => {
  const color = COLOR[status] ?? "#667085";
  return (
    <span
      className="inline-flex items-center whitespace-nowrap rounded-full border px-[9px] py-0.5 text-xs font-medium"
      style={{ color, borderColor: color }}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
};
