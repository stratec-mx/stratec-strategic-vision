import { useEffect, useState } from "react";
import { Lock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { RESOURCES, CONFIGURABLE_ROLES, type Resource } from "@/lib/access";

type Rule = { can_read: boolean; can_write: boolean };
type RoleId = (typeof CONFIGURABLE_ROLES)[number]["id"];
type Matrix = Record<string, Rule>; // clave: `${role}:${resource}`

const key = (role: string, resource: string) => `${role}:${resource}`;

/**
 * Matriz de niveles de acceso: qué puede ver y editar cada rol en cada módulo.
 * Los cambios se guardan al instante en public.access_rules y la base de datos
 * los aplica en cada consulta (RLS). El admin siempre tiene acceso total.
 */
export const AccessMatrix = () => {
  const { toast } = useToast();
  const { refreshAccess } = useAuth();
  const [matrix, setMatrix] = useState<Matrix>({});
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("access_rules").select("role, resource, can_read, can_write");
    if (error) {
      setMissing(error.code === "42P01" || error.code === "PGRST205");
      if (!(error.code === "42P01" || error.code === "PGRST205"))
        toast({ title: "No se pudieron cargar los niveles de acceso", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    const m: Matrix = {};
    for (const r of data ?? []) m[key(r.role, r.resource)] = { can_read: r.can_read, can_write: r.can_write };
    setMatrix(m);
    setMissing(false);
    setLoading(false);
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = async (role: RoleId, resource: Resource, field: "can_read" | "can_write") => {
    const cur = matrix[key(role, resource)] ?? { can_read: false, can_write: false };
    let next: Rule;
    if (field === "can_write") {
      // Editar implica ver
      next = cur.can_write ? { ...cur, can_write: false } : { can_read: true, can_write: true };
    } else {
      // Quitar "ver" también quita "editar"
      next = cur.can_read ? { can_read: false, can_write: false } : { ...cur, can_read: true };
    }
    const k = key(role, resource);
    setSaving(k);
    setMatrix((m) => ({ ...m, [k]: next }));
    const { error } = await supabase
      .from("access_rules")
      .upsert({ role, resource, ...next, updated_at: new Date().toISOString() }, { onConflict: "role,resource" });
    setSaving(null);
    if (error) {
      setMatrix((m) => ({ ...m, [k]: cur }));
      toast({ title: "No se guardó el cambio", description: error.message, variant: "destructive" });
      return;
    }
    refreshAccess();
  };

  if (missing) {
    return (
      <div className="border border-amber-300 bg-amber-50 p-4 text-sm text-navy">
        Falta crear la tabla de niveles de acceso. En Supabase → SQL Editor vuelve a ejecutar
        <code className="mx-1 px-1 bg-white border border-border">supabase/setup/02-tablas-y-permisos.sql</code> y recarga.
      </div>
    );
  }

  return (
    <div className="border border-border bg-card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-steel">
          <tr>
            <th className="text-left px-5 py-3 font-medium">Módulo</th>
            <th className="px-3 py-3 font-medium text-center">Administrador</th>
            {CONFIGURABLE_ROLES.map((r) => (
              <th key={r.id} className="px-3 py-3 font-medium text-center">{r.label}</th>
            ))}
          </tr>
          <tr className="text-[10px] normal-case tracking-normal">
            <th />
            <th className="pb-2 text-steel/70 font-normal">siempre total</th>
            {CONFIGURABLE_ROLES.map((r) => (
              <th key={r.id} className="pb-2 text-steel/70 font-normal">
                <span className="inline-block w-12">Ver</span>
                <span className="inline-block w-12">Editar</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={2 + CONFIGURABLE_ROLES.length} className="px-5 py-8 text-center text-steel">Cargando…</td></tr>
          ) : (
            RESOURCES.map((res) => (
              <tr key={res.id} className="border-t border-border">
                <td className="px-5 py-3">
                  <div className="text-navy">{res.label}</div>
                  <div className="text-[11px] text-steel">{res.description}</div>
                </td>
                <td className="px-3 py-3 text-center">
                  <Lock className="h-3.5 w-3.5 text-olive inline" aria-label="Acceso total" />
                </td>
                {CONFIGURABLE_ROLES.map((role) => {
                  const k = key(role.id, res.id);
                  const rule = matrix[k] ?? { can_read: false, can_write: false };
                  return (
                    <td key={role.id} className="px-3 py-3 text-center whitespace-nowrap">
                      {saving === k ? (
                        <Loader2 className="h-4 w-4 animate-spin text-steel inline" />
                      ) : (
                        <>
                          <label className="inline-flex w-12 justify-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-[#0B1E3C] cursor-pointer"
                              checked={rule.can_read}
                              onChange={() => toggle(role.id, res.id, "can_read")}
                              aria-label={`${role.label}: ver ${res.label}`}
                            />
                          </label>
                          <label className="inline-flex w-12 justify-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-[#0B1E3C] cursor-pointer"
                              checked={rule.can_write}
                              onChange={() => toggle(role.id, res.id, "can_write")}
                              aria-label={`${role.label}: editar ${res.label}`}
                            />
                          </label>
                        </>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
      <p className="px-5 py-3 text-[11px] text-steel border-t border-border">
        Los cambios se guardan al instante y la base de datos los aplica en cada consulta. "Datos de contacto" controla
        si se ven el correo y el teléfono de leads y clientes; "Editar" en ese módulo no aplica (se editan desde Leads y Clientes).
        Eliminar registros siempre es exclusivo del administrador.
      </p>
    </div>
  );
};
