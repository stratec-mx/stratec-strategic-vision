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
  type Capability,
} from "@/lib/capabilities";

/**
 * Facultades M-DESR de una persona (solo admin, en Usuarios).
 * Las que trae su rol aparecen marcadas y no se pueden quitar; las demás se
 * dan o quitan al instante en public.user_capabilities. La base guarda quién
 * hizo el cambio y cuándo (user_capabilities_log).
 */
export const UserCapabilities = ({ userId, email, role }: { userId: string; email: string; role: string }) => {
  const { toast } = useToast();
  const { user, refreshAccess } = useAuth();
  const [granted, setGranted] = useState<Set<Capability>>(new Set());
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [saving, setSaving] = useState<Capability | null>(null);

  const fromRole = capabilitiesFromRoles(role === "none" ? [] : [role]);
  const isAdminRow = role === "admin";

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from("user_capabilities").select("capability").eq("user_id", userId);
      if (!alive) return;
      if (error) {
        setMissing(isMissingTable(error));
        if (!isMissingTable(error))
          toast({ title: "No se pudieron cargar las facultades", description: error.message, variant: "destructive" });
      } else {
        setMissing(false);
        setGranted(new Set((data ?? []).map((x) => x.capability as Capability)));
      }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = async (cap: Capability) => {
    const had = granted.has(cap);
    setSaving(cap);
    const { error } = had
      ? await supabase.from("user_capabilities").delete().eq("user_id", userId).eq("capability", cap)
      : await supabase.from("user_capabilities").insert({ user_id: userId, capability: cap });
    setSaving(null);
    if (error) {
      toast({
        title: "No se guardó el cambio",
        description: isMissingTable(error) ? MISSING_09 : error.message,
        variant: "destructive",
      });
      return;
    }
    setGranted((g) => {
      const n = new Set(g);
      if (had) n.delete(cap);
      else n.add(cap);
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
      {isAdminRow && (
        <p className="text-[11px] text-steel">El administrador tiene todas las facultades.</p>
      )}
      {loading ? (
        <div className="text-xs text-steel">Cargando facultades…</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {CAPABILITY_GROUPS.map((g) => (
            <fieldset key={g.id} className="border border-border bg-background p-3">
              <legend className="px-1 text-[11px] font-medium uppercase tracking-wider text-navy">{g.label}</legend>
              <ul className="space-y-1.5">
                {g.items.map((it) => {
                  const byRole = fromRole.has(it.id);
                  const checked = byRole || granted.has(it.id);
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
                          disabled={byRole || saving !== null}
                          onChange={() => toggle(it.id)}
                        />
                      )}
                      <label htmlFor={`${userId}-${it.id}`} className={byRole ? "text-steel" : "text-navy cursor-pointer"}>
                        {it.label}
                      </label>
                      {byRole && <span className="text-[10px] text-olive">(viene con el rol)</span>}
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
