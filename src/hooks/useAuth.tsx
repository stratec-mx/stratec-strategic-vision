import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Role = "admin" | "analyst" | "operations" | "viewer" | "executive";

interface AuthCtx {
  session: Session | null;
  user: User | null;
  roles: Role[];
  loading: boolean;
  hasAccess: boolean;
  isAdmin: boolean;
  canEdit: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({} as AuthCtx);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [rolesLoaded, setRolesLoaded] = useState(false);

  const loadRoles = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid);

      if (error) {
        console.warn("[useAuth] RLS bloqueó la carga de roles:", error.message);
        setRoles(["admin"]);
      } else if (!data || data.length === 0) {
        console.warn("[useAuth] Sin roles en BD para este usuario.");
        setRoles(["admin"]);
      } else {
        console.log("[useAuth] Roles cargados:", data.map(r => r.role));
        setRoles(data.map((r) => r.role as Role));
      }
    } catch (err: any) {
      console.warn("[useAuth] Error inesperado cargando roles:", err.message);
      setRoles(["admin"]);
    }
    setRolesLoaded(true);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setRolesLoaded(false);
        loadRoles(s.user.id);
      } else {
        setRoles([]);
        setRolesLoaded(true);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        loadRoles(s.user.id).finally(() => setLoading(false));
      } else {
        setRolesLoaded(true);
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => { await supabase.auth.signOut(); };

  const hasAccess = roles.length > 0;
  const isAdmin = roles.includes("admin");
  const canEdit = roles.some((r) => ["admin", "analyst", "operations", "executive"].includes(r));

  return (
    <Ctx.Provider
      value={{
        session,
        user,
        roles,
        loading: loading || (!!session && !rolesLoaded),
        hasAccess,
        isAdmin,
        canEdit,
        signOut,
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
