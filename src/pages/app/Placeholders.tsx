import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { Construction, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, Role } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export const ComingSoon = ({ title, eyebrow, description }: { title: string; eyebrow: string; description: string }) => (
  <div>
    <PageHeader eyebrow={eyebrow} title={title} description={description} />
    <div className="border border-dashed border-border bg-card p-16 flex flex-col items-center text-center">
      <Construction className="h-8 w-8 text-olive mb-4" />
      <div className="font-display text-xl text-navy">Módulo en preparación</div>
      <p className="mt-2 text-sm text-steel max-w-md">
        Este módulo será habilitado en la siguiente etapa del despliegue Fase 2.
      </p>
    </div>
  </div>
);

export const Messaging = () => (
  <ComingSoon
    eyebrow="Comunicaciones"
    title="Mensajería · WhatsApp & Correo"
    description="Bandeja unificada de canales institucionales."
  />
);

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "admin", label: "Administrador" },
  { value: "analyst", label: "Analista" },
  { value: "operations", label: "Operaciones" },
  { value: "viewer", label: "Solo lectura" },
];

type UserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: Role | null;
};

export const Settings = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id,email,full_name")
      .order("created_at", { ascending: false });
    const { data: roles } = await supabase.from("user_roles").select("user_id,role");
    const roleMap = new Map<string, Role>();
    (roles ?? []).forEach((r) => roleMap.set(r.user_id as string, r.role as Role));
    setRows(
      (profiles ?? []).map((p) => ({
        id: p.id as string,
        email: p.email as string | null,
        full_name: p.full_name as string | null,
        role: roleMap.get(p.id as string) ?? null,
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  const updateRole = async (userId: string, role: Role) => {
    // Remove existing roles, then insert the new one (single-role model)
    const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
    if (delErr) {
      toast({ title: "Error", description: "No se pudo actualizar el rol.", variant: "destructive" });
      return;
    }
    const { error: insErr } = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (insErr) {
      toast({ title: "Error", description: "No se pudo asignar el rol.", variant: "destructive" });
      return;
    }
    toast({ title: "Rol actualizado", description: "Los permisos se aplicarán en la próxima sesión del usuario." });
    load();
  };

  if (!isAdmin) {
    return (
      <div>
        <PageHeader
          eyebrow="Configuración"
          title="Ajustes"
          description="Roles, permisos y preferencias de la firma."
        />
        <div className="border border-border bg-card p-10 text-center">
          <ShieldCheck className="h-8 w-8 text-olive mx-auto mb-3" />
          <div className="font-display text-lg text-navy">Acceso restringido</div>
          <p className="mt-2 text-sm text-steel max-w-md mx-auto">
            La gestión de usuarios y permisos está reservada a administradores.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Configuración · Acceso institucional"
        title="Usuarios y permisos"
        description="Asigne roles a los usuarios autorizados. Los usuarios se crean manualmente desde la consola Lovable Cloud."
      />
      <div className="border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-steel">
            <tr>
              <th className="text-left px-6 py-3 font-medium">Nombre</th>
              <th className="text-left px-6 py-3 font-medium">Correo</th>
              <th className="text-left px-6 py-3 font-medium w-56">Rol</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="px-6 py-8 text-center text-steel">Cargando…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={3} className="px-6 py-8 text-center text-steel">Sin usuarios registrados.</td></tr>
            ) : (
              rows.map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="px-6 py-3 text-navy">{u.full_name ?? "—"}</td>
                  <td className="px-6 py-3 text-steel">{u.email ?? "—"}</td>
                  <td className="px-6 py-3">
                    <Select value={u.role ?? undefined} onValueChange={(v) => updateRole(u.id, v as Role)}>
                      <SelectTrigger className="rounded-none h-9 text-xs">
                        <SelectValue placeholder="Sin rol — sin acceso" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((r) => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-steel/80">
        Para crear un usuario nuevo, agréguelo desde la consola de Lovable Cloud (Cloud → Users) y luego asígnele un rol aquí.
      </p>
    </div>
  );
};
