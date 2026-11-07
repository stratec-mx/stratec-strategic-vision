import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { RESOURCES, type Action, type Permissions, type Resource } from "@/lib/access";

export type Role = "admin" | "analyst" | "operations" | "viewer" | "executive";

interface AuthCtx {
  session: Session | null;
  user: User | null;
  roles: Role[];
  loading: boolean;
  hasAccess: boolean;
  isAdmin: boolean;
  /** Permisos efectivos por módulo (unión de los roles del usuario; admin = todo). */
  permissions: Permissions;
  can: (resource: Resource, action?: Action) => boolean;
  /** Vuelve a leer roles y permisos (p. ej. después de cambiar la matriz de accesos). */
  refreshAccess: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({} as AuthCtx);

const ALL: Permissions = Object.fromEntries(RESOURCES.map((r) => [r.id, { read: true, write: true }])) as Permissions;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permissions>({});
  const [loading, setLoading] = useState(true);
  const [rolesLoaded, setRolesLoaded] = useState(false);

  const loadAccess = useCallback(async (uid: string) => {
    try {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", uid);
      // Sin rol o con error: sin acceso. La BD decide los permisos; nunca se asume admin.
      const r = error ? [] : (data ?? []).map((x) => x.role as Role);
      if (error) console.warn("[useAuth] No se pudieron cargar los roles:", error.message);
      setRoles(r);

      if (r.includes("admin")) {
        setPermissions(ALL);
      } else if (r.length) {
        const { data: rules, error: rulesErr } = await supabase
          .from("access_rules")
          .select("resource, can_read, can_write")
          .in("role", r);
        if (rulesErr) console.warn("[useAuth] No se pudieron cargar los permisos:", rulesErr.message);
        const perms: Permissions = {};
        for (const rule of rules ?? []) {
          const key = rule.resource as Resource;
          const cur = perms[key] ?? { read: false, write: false };
          perms[key] = { read: cur.read || rule.can_read || rule.can_write, write: cur.write || rule.can_write };
        }
        setPermissions(perms);
      } else {
        setPermissions({});
      }
    } catch (err: any) {
      console.warn("[useAuth] Error inesperado cargando accesos:", err.message);
      setRoles([]);
      setPermissions({});
    }
    setRolesLoaded(true);
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setRolesLoaded(false);
        loadAccess(s.user.id);
      } else {
        setRoles([]);
        setPermissions({});
        setRolesLoaded(true);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        loadAccess(s.user.id).finally(() => setLoading(false));
      } else {
        setRolesLoaded(true);
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [loadAccess]);

  const signOut = async () => { await supabase.auth.signOut(); };
  const refreshAccess = useCallback(async () => { if (user) await loadAccess(user.id); }, [user, loadAccess]);
  const can = useCallback((resource: Resource, action: Action = "read") => !!permissions[resource]?.[action], [permissions]);

  return (
    <Ctx.Provider
      value={{
        session,
        user,
        roles,
        loading: loading || (!!session && !rolesLoaded),
        hasAccess: roles.length > 0,
        isAdmin: roles.includes("admin"),
        permissions,
        can,
        refreshAccess,
        signOut,
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
