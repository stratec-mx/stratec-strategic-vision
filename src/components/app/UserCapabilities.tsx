import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  CAPABILITY_GROUPS,
  MISSING_09,
  capabilitiesFromRoles,
  isMissingTable,
  restrictionFor,
  type Capability,
} from "@/lib/capabilities";

type Effect = "grant" | "deny";

/**
 * Facultades M-DESR de una persona (solo admin, en Usuarios; también las suyas).
 * - Las que trae su rol aparecen marcadas; quitarlas guarda un "deny" (se le
 *   retiran aunque las traiga el rol) y volver a marcarlas lo borra.
 * - Las demás se dan (grant) o se quitan al instante.
 * - Validar, aprobar y cerrar solo se pueden dar a un Consultor o Administrador;
 *   rechazar, solo al Administrador.
 * La base guarda quién hizo cada cambio y cuándo (user_capabilities_log).
 */
export const UserCapabilities = ({ userId, email, role }: { userId: string; email: string; role: string }) => {
  const { toast } = useToast();
  const { user, refreshAccess } = useAuth();
  const [rows, setRows] = useState<Map<Capability, Effect>>(new Map());
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [saving, setSaving] = useState<Capability | null>(null);

  const fromRole = capabilitiesFromRoles(role === "none" ? [] : [role]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from("user_capabilities").select("capability, effect").eq("user_id", userId);
      if (!alive) return;
      if (error) {
        setMissing(isMissingTable(error));
        if (!isMissingTable(error))
          toast({ title: "No se pudieron cargar las facultades", description: error.message, variant: "destructive" });
      } else {
        setMissing(false);
        setRows(new Map((data ?? []).map((x) => [x.capability as Capability, (x.effect === "deny" ? "deny" : "grant") as Effect])));
      }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = async (cap: Capability) => {
    const row = rows.get(cap);
    // Qué fila debe quedar: undefined = ninguna
    const next: Effect | undefined = fromRole.has(cap)
      ? (row === "deny" ? undefined : "deny")
      : (row ? undefined : "grant");
    setSaving(cap);
    const { error } = next
      ? await supabase.from("user_capabilities").upsert({ user_id: userId, capability: cap, effect: next }, { onConflict: "user_id,capability" })
      : await supabase.from("user_capabilities").delete().eq("user_id", userId).eq("capability", cap);
    setSaving(null);
    if (error) {
      toast({
        title: "No se guardó el cambio",
        description: isMissingTable(error) ? MISSING_09 : error.message,
        variant: "destructive",
      });
      return;
    }
    setRows((m) => {
      const n = new Map(m);
      if (next) n.set(cap, next);
      else n.delete(cap);
      return n;
    });
    if (userId === user?.id) refreshAccess();
  };

  if (missing) {
    return (
      <div className="border border-amber-300 bg-amber-50 p-3 text-xs text-navy" role="status">
        Las facultades M-DESR todavía no están activas: falta ejecutar
        <code className="mx-1 px-1 bg-white border border-border">supabase/setup/propuestas/09-consultor-y-facultades.sql</code>
        en Supabase.
      </div>
    );
  }

  return (
    <div className="space-y-3" aria-label={`Facultades M-DESR de ${email}`}>
      <p className="text-[11px] text-steel">
        Las que trae el rol se pueden retirar a esta persona. Validar, aprobar y cerrar diagnósticos son solo para Consultores y Administradores; rechazar, solo para el Administrador.
      </p>
      {loading ? (
        <div className="text-xs text-steel">Cargando facultades…</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {CAPABILITY_GROUPS.map((g) => (
            <fieldset key={g.id} className="border border-border bg-background p-3">
              <legend className="px-1 text-[11px] font-medium uppercase tracking-wider text-navy">{g.label}</legend>
              <ul className="space-y-1.5">
                {g.items.map((it) => {
                  const row = rows.get(it.id);
                  const byRole = fromRole.has(it.id);
                  const denied = row === "deny";
                  const restriction = restrictionFor(it.id, role);
                  // Si su rol no permite darla, queda bloqueada; si tuviera una vieja, se puede quitar.
                  const locked = !!restriction && !row;
                  const checked = !restriction ? (byRole ? !denied : row === "grant") : row === "grant";
                  return (
                    <li key={it.id} className="flex items-center gap-2 text-xs">
                      {saving === it.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-steel" />
                      ) : (
                        <input
                          type="checkbox"
                          id={`${userId}-${it.id}`}
                          className="h-4 w-4 accent-[#0B1E3C] cursor-pointer disabled:cursor-not-allowed"
                          checked={checked}
                          disabled={locked || saving !== null}
                          onChange={() => toggle(it.id)}
                        />
                      )}
                      <label htmlFor={`${userId}-${it.id}`} className={locked ? "text-steel" : "text-navy cursor-pointer"}>
                        {it.label}
                      </label>
                      {byRole && !denied && <span className="text-[10px] text-olive">(viene con el rol)</span>}
                      {byRole && denied && <span className="text-[10px] text-amber-700">(retirada a esta persona)</span>}
                      {restriction && <span className="text-[10px] text-steel">({restriction})</span>}
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          ))}
        </div>
      )}
    </div>
  );
};
