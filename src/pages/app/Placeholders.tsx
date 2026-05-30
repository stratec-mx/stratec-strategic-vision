import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { Construction, ShieldCheck, UserPlus, Trash2, RefreshCw, Shield, Eye, Edit, Settings2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, Role } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

const ROLE_OPTIONS: { value: Role; label: string; description: string; icon: typeof Shield }[] = [
  { value: "admin",      label: "Administrador", description: "Acceso total al sistema",         icon: Shield },
  { value: "analyst",    label: "Analista",       description: "Lectura y análisis de datos",     icon: Eye },
  { value: "operations", label: "Operaciones",    description: "Gestión de leads y clientes",     icon: Settings2 },
  { value: "executive",  label: "Ejecutivo",      description: "Vista ejecutiva y reportes",      icon: Eye },
  { value: "viewer",     label: "Solo lectura",   description: "Consulta sin modificaciones",     icon: Eye },
];

type UserRow = {
  id: string;
  email: string;
  role: Role;
  created_at: string;
};

export const Settings = () => {
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("viewer");
  const [inviting, setInviting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: roles, error } = await supabase
      .from("user_roles")
      .select("user_id, role, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error al cargar usuarios", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Build rows from user_roles only (no dependency on profiles table)
    const mapped: UserRow[] = (roles ?? []).map((r) => ({
      id: r.user_id as string,
      email: r.user_id === user?.id ? (user?.email ?? r.user_id) : r.user_id,
      role: r.role as Role,
      created_at: r.created_at as string,
    }));
    setRows(mapped);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateRole = async (userId: string, role: Role) => {
    const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
    if (delErr) {
      toast({ title: "Error", description: "No se pudo actualizar el rol: " + delErr.message, variant: "destructive" });
      return;
    }
    const { error: insErr } = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (insErr) {
      toast({ title: "Error", description: "No se pudo asignar el rol: " + insErr.message, variant: "destructive" });
      return;
    }
    toast({ title: "✅ Rol actualizado", description: `Permisos de ${role} aplicados correctamente.` });
    load();
  };

  const removeUser = async (userId: string) => {
    if (userId === user?.id) {
      toast({ title: "Acción no permitida", description: "No puedes eliminar tu propio acceso.", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "✅ Acceso revocado", description: "El usuario ya no tiene acceso al panel." });
    load();
  };

  const inviteUser = async () => {
    if (!inviteEmail || !invitePassword) {
      toast({ title: "Datos incompletos", description: "Ingresa correo y contraseña temporal.", variant: "destructive" });
      return;
    }
    setInviting(true);
    try {
      // Create the user account
      const { data, error } = await supabase.auth.signUp({
        email: inviteEmail.trim().toLowerCase(),
        password: invitePassword,
        options: { emailRedirectTo: `${window.location.origin}/app` },
      });

      if (error) throw error;
      if (!data.user) throw new Error("No se creó el usuario.");

      // Assign role immediately
      const { error: roleErr } = await supabase.from("user_roles").insert({
        user_id: data.user.id,
        role: inviteRole,
      });

      if (roleErr) throw roleErr;

      toast({
        title: "✅ Colaborador creado",
        description: `${inviteEmail} registrado con rol ${inviteRole}. Se envió confirmación por correo.`,
      });
      setInviteEmail("");
      setInvitePassword("");
      setInviteRole("viewer");
      setShowInvite(false);
      load();
    } catch (err: any) {
      toast({ title: "Error al crear usuario", description: err.message, variant: "destructive" });
    } finally {
      setInviting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div>
        <PageHeader eyebrow="Configuración" title="Ajustes" description="Roles, permisos y preferencias de la firma." />
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
    <div className="space-y-8">
      <PageHeader
        eyebrow="Configuración · Acceso institucional"
        title="Usuarios y permisos"
        description="Gestione colaboradores, asigne roles y controle el acceso al panel operativo."
      />

      {/* Security summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {ROLE_OPTIONS.map((r) => (
          <div key={r.value} className="border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <r.icon className="h-3.5 w-3.5 text-olive" />
              <span className="text-xs font-medium text-navy uppercase tracking-wider">{r.label}</span>
            </div>
            <p className="text-[11px] text-steel">{r.description}</p>
          </div>
        ))}
      </div>

      {/* Actions bar */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-steel">{rows.length} usuario(s) con acceso</div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} className="rounded-none text-xs gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Actualizar
          </Button>
          <Button size="sm" onClick={() => setShowInvite(!showInvite)} className="rounded-none bg-navy text-smoke text-xs gap-1.5">
            <UserPlus className="h-3.5 w-3.5" /> Agregar colaborador
          </Button>
        </div>
      </div>

      {/* Invite form */}
      {showInvite && (
        <div className="border border-border bg-card p-6 space-y-4">
          <div className="font-display text-base text-navy mb-2">Nuevo colaborador</div>
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-steel">Correo institucional</Label>
              <Input
                type="email"
                placeholder="usuario@empresa.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="rounded-none h-10 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-steel">Contraseña temporal</Label>
              <Input
                type="text"
                placeholder="Mínimo 6 caracteres"
                value={invitePassword}
                onChange={(e) => setInvitePassword(e.target.value)}
                className="rounded-none h-10 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-steel">Rol asignado</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as Role)}>
                <SelectTrigger className="rounded-none h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button onClick={inviteUser} disabled={inviting} className="rounded-none bg-navy text-smoke text-xs h-9">
              {inviting ? "Creando…" : "Crear y asignar acceso"}
            </Button>
            <Button variant="outline" onClick={() => setShowInvite(false)} className="rounded-none text-xs h-9">
              Cancelar
            </Button>
          </div>
          <p className="text-[11px] text-steel/70">
            Se creará la cuenta y se enviará un correo de confirmación. Comparte la contraseña temporal de forma segura.
          </p>
        </div>
      )}

      {/* Users table */}
      <div className="border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-steel">
            <tr>
              <th className="text-left px-6 py-3 font-medium">ID / Usuario</th>
              <th className="text-left px-6 py-3 font-medium">Registrado</th>
              <th className="text-left px-6 py-3 font-medium w-52">Rol</th>
              <th className="text-left px-6 py-3 font-medium w-20">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-steel">Cargando usuarios…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-steel">Sin usuarios registrados aún.</td></tr>
            ) : (
              rows.map((u) => (
                <tr key={u.id} className={`border-t border-border ${u.id === user?.id ? "bg-secondary/20" : ""}`}>
                  <td className="px-6 py-3">
                    <div className="font-mono text-xs text-navy">{u.id === user?.id ? `${user.email} (tú)` : u.id.slice(0, 18) + "…"}</div>
                  </td>
                  <td className="px-6 py-3 text-steel text-xs">
                    {new Date(u.created_at).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-6 py-3">
                    <Select value={u.role} onValueChange={(v) => updateRole(u.id, v as Role)}>
                      <SelectTrigger className="rounded-none h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((r) => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-6 py-3">
                    {u.id !== user?.id && (
                      <button
                        onClick={() => removeUser(u.id)}
                        className="text-steel hover:text-red-500 transition-colors"
                        title="Revocar acceso"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Security note */}
      <div className="border border-border bg-secondary/30 p-4 flex gap-3">
        <ShieldCheck className="h-4 w-4 text-olive mt-0.5 shrink-0" />
        <div className="text-xs text-steel leading-relaxed">
          <span className="font-medium text-navy">Seguridad:</span> El acceso está protegido por Supabase Auth con cifrado extremo a extremo.
          Los roles se validan en cada sesión. Un usuario sin rol no puede acceder al panel aunque tenga credenciales válidas.
          Para mayor seguridad, active la autenticación de dos factores desde la consola de Supabase.
        </div>
      </div>
    </div>
  );
};
