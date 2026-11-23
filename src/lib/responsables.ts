// Responsables de prospectos y clientes (D-26, script 10).
// Asesor, Operaciones, Ejecutivo y Solo lectura ven en el CRM solo lo asignado:
//   prospectos → leads.owner_id
//   clientes   → clients.owner_id o una fila activa en client_assignments
// Solo el Administrador asigna.
import { CONFIGURABLE_ROLES } from "@/lib/access";

export type Usuario = { id: string; nombre: string; roles: string[] };

const ETIQUETA_ROL: Record<string, string> = {
  admin: "Administrador",
  ...Object.fromEntries(CONFIGURABLE_ROLES.map((r) => [r.id, r.label])),
};
export const etiquetaRol = (r: string) => ETIQUETA_ROL[r] ?? r;

/** Usuarios que tienen al menos un rol, ordenados por nombre. Sin rol no pueden entrar al panel. */
export function usuariosConRol(
  perfiles: { id: string; full_name?: string | null; email?: string | null }[],
  roles: { user_id: string; role: string }[],
): Usuario[] {
  const porUsuario = new Map<string, string[]>();
  for (const r of roles) porUsuario.set(r.user_id, [...(porUsuario.get(r.user_id) ?? []), r.role]);
  return perfiles
    .filter((p) => porUsuario.has(p.id))
    .map((p) => ({ id: p.id, nombre: p.full_name?.trim() || p.email || "Usuario sin nombre", roles: porUsuario.get(p.id)! }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

/** Papel de la asignación en client_assignments según el rol de la persona. */
const PAPEL_POR_ROL: Record<string, string> = {
  advisor: "asesor", executive: "ejecutivo", consultant: "consultor", operations: "operaciones", viewer: "lectura",
};
export const PAPELES = [
  { id: "asesor", label: "Asesor" },
  { id: "ejecutivo", label: "Ejecutivo" },
  { id: "consultor", label: "Consultor" },
  { id: "operaciones", label: "Operaciones" },
  { id: "lectura", label: "Solo lectura" },
] as const;
export const papelSugerido = (u?: Usuario) => u?.roles.map((r) => PAPEL_POR_ROL[r]).find(Boolean) ?? "asesor";
export const etiquetaPapel = (p: string) => PAPELES.find((x) => x.id === p)?.label ?? p;

/** Filtro "Sin asignar": filas sin responsable. */
export const sinAsignar = <T extends { owner_id?: string | null }>(filas: T[]) => filas.filter((f) => !f.owner_id);

/** Nombre del responsable para mostrar; si ya no tiene rol, lo dice. */
export const nombreResponsable = (id: string | null | undefined, usuarios: Usuario[]) =>
  !id ? "Sin asignar" : usuarios.find((u) => u.id === id)?.nombre ?? "Usuario sin rol";

/** El script 10 pide un motivo de al menos 5 letras para asignar o retirar. */
export const motivoValido = (m: string) => m.trim().length >= 5;

/** La tabla client_assignments no existe todavía (script 10 sin aplicar). */
export const faltaTabla = (e: { code?: string } | null | undefined) => e?.code === "42P01" || e?.code === "PGRST205";
