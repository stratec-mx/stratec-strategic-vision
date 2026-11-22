// Facultades M-DESR por persona. Deben coincidir con el CHECK de
// public.user_capabilities.capability y con public.role_capabilities()
// (supabase/setup/propuestas/09-consultor-y-facultades.sql).

export const CAPABILITY_GROUPS = [
  {
    id: "elaboracion",
    label: "Elaboración",
    items: [
      { id: "mdesr.prepare", label: "Elaborar diagnósticos" },
      { id: "mdesr.review", label: "Revisar el trabajo de otro analista" },
      { id: "mdesr.comment", label: "Comentar" },
      { id: "mdesr.submit", label: "Enviar a validación" },
    ],
  },
  {
    id: "validacion",
    label: "Validación",
    items: [
      { id: "mdesr.validate", label: "Validar" },
      { id: "mdesr.approve", label: "Aprobar" },
      { id: "mdesr.reject", label: "Rechazar" },
      { id: "mdesr.return_for_correction", label: "Devolver para corrección" },
      { id: "mdesr.close", label: "Cerrar el diagnóstico" },
      { id: "mdesr.manage_instruments", label: "Administrar instrumentos" },
      { id: "mdesr.assign_reviewer", label: "Asignar revisor" },
      { id: "mdesr.reassign", label: "Reasignar clientes o proyectos" },
    ],
  },
] as const;

export type Capability = (typeof CAPABILITY_GROUPS)[number]["items"][number]["id"];

export const CAPABILITIES: Capability[] = CAPABILITY_GROUPS.flatMap((g) => g.items.map((i) => i.id));

/** Facultades que trae cada rol por defecto (igual que public.role_capabilities). */
export const ROLE_CAPABILITIES: Partial<Record<string, readonly Capability[]>> = {
  admin: [
    "mdesr.prepare", "mdesr.review", "mdesr.comment", "mdesr.submit",
    "mdesr.validate", "mdesr.approve", "mdesr.reject", "mdesr.return_for_correction",
    "mdesr.close", "mdesr.manage_instruments", "mdesr.assign_reviewer", "mdesr.reassign",
  ],
  consultant: [
    "mdesr.review", "mdesr.validate", "mdesr.approve", "mdesr.reject",
    "mdesr.return_for_correction", "mdesr.close", "mdesr.manage_instruments", "mdesr.assign_reviewer",
  ],
  analyst: ["mdesr.prepare", "mdesr.review", "mdesr.comment", "mdesr.submit"],
};

/** Solo un Consultor o un admin puede tenerlas, aunque se le asignen (igual que has_capability). */
export const CONSULTANT_ONLY: readonly Capability[] = ["mdesr.validate", "mdesr.approve", "mdesr.close"];
export const CAN_VALIDATE_ROLES: readonly string[] = ["consultant", "admin"];

export type CapabilityRow = { capability: string; effect?: string | null };

/** Facultades que vienen con los roles dados (el admin trae todas). */
export const capabilitiesFromRoles = (roles: readonly string[]): Set<Capability> => {
  const out = new Set<Capability>();
  for (const r of roles) for (const c of ROLE_CAPABILITIES[r] ?? []) out.add(c);
  return out;
};

/**
 * Facultades efectivas (igual que has_capability): las del rol más las dadas
 * (grant), menos las retiradas (deny, que gana). Validar, aprobar y cerrar
 * solo si es Consultor o admin.
 */
export const effectiveCapabilities = (roles: readonly string[], rows: Iterable<CapabilityRow>): Set<Capability> => {
  const out = capabilitiesFromRoles(roles);
  const known = CAPABILITIES as string[];
  const list = [...rows].filter((r) => known.includes(r.capability));
  for (const r of list) if ((r.effect ?? "grant") === "grant") out.add(r.capability as Capability);
  for (const r of list) if (r.effect === "deny") out.delete(r.capability as Capability);
  if (!roles.some((r) => CAN_VALIDATE_ROLES.includes(r))) for (const c of CONSULTANT_ONLY) out.delete(c);
  return out;
};

/** Errores de "la tabla todavía no existe" (falta correr el script 09). */
export const isMissingTable = (err: { code?: string; message?: string } | null | undefined) =>
  !!err && (err.code === "42P01" || err.code === "PGRST205");

export const MISSING_09 =
  "Falta ejecutar supabase/setup/propuestas/09-consultor-y-facultades.sql: las facultades M-DESR todavía no existen en la base de datos.";
