// Selector "Responsable" y lista de usuarios con rol. Solo para el Administrador.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usuariosConRol, type Usuario } from "@/lib/responsables";

/** Usuarios con rol (profiles + user_roles). Solo carga si `activo` (el admin). */
export function useUsuariosConRol(activo: boolean) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  useEffect(() => {
    if (!activo) return;
    let vigente = true;
    (async () => {
      const [p, r] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (!vigente) return;
      if (p.error || r.error) { console.warn("[Responsable] No se pudo leer la lista de usuarios."); return; }
      setUsuarios(usuariosConRol(p.data ?? [], (r.data ?? []) as { user_id: string; role: string }[]));
    })();
    return () => { vigente = false; };
  }, [activo]);
  return usuarios;
}

const NADIE = "__nadie__";

export const SelectorResponsable = ({
  valor, usuarios, onCambio, disabled, etiqueta,
}: {
  valor: string | null | undefined;
  usuarios: Usuario[];
  onCambio: (id: string | null) => void;
  disabled?: boolean;
  etiqueta: string;
}) => {
  const conocido = !valor || usuarios.some((u) => u.id === valor);
  return (
    <Select value={valor ?? NADIE} onValueChange={(v) => onCambio(v === NADIE ? null : v)} disabled={disabled}>
      <SelectTrigger className="h-8 w-44 rounded-none border-border text-xs" aria-label={etiqueta}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NADIE}>Sin asignar</SelectItem>
        {!conocido && <SelectItem value={valor!}>Usuario sin rol</SelectItem>}
        {usuarios.map((u) => <SelectItem key={u.id} value={u.id}>{u.nombre}</SelectItem>)}
      </SelectContent>
    </Select>
  );
};
