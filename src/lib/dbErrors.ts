// Traduce los errores de Supabase/Postgres más comunes a mensajes accionables.
export function describeDbError(error: { code?: string; message?: string } | null | undefined, fallback: string): string {
  if (!error) return fallback;
  const code = error.code ?? "";
  const msg = String(error.message ?? "");
  if (code === "42501" || /row-level security|permission denied/i.test(msg))
    return "Sin permiso: tu usuario no tiene un rol con permiso de escritura (admin, analyst u operations). Revisa el aviso en la parte superior del panel.";
  if (code === "23505") return "Ya existe un registro con ese folio o nombre. Usa uno diferente.";
  if (code === "23502") return "Falta un dato obligatorio.";
  if (code === "42P01" || code === "PGRST205") return "Falta crear la tabla en la base de datos (migración pendiente).";
  if (/fetch|network/i.test(msg)) return "Sin conexión con el servidor. Revisa tu internet e intenta de nuevo.";
  return `${fallback} (${code || "error"})`;
}
