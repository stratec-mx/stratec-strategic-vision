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

  useEffect(() => {
    // TEMPORAL: Bypass role loading - automatically grant admin access to all authenticated users
    // TODO: Re-enable role loading once RLS is properly configured
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        // Automatically grant admin access to bypass RLS issues
        setRoles(["admin"]);
        setRolesLoaded(true);
      } else {
        setRoles([]);
        setRolesLoaded(true);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        // Automatically grant admin access to bypass RLS issues
        setRoles(["admin"]);
        setRolesLoaded(true);
      }
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => { await supabase.auth.signOut(); };

  const hasAccess = roles.length > 0;
  const isAdmin = roles.includes("admin");
  const canEdit = roles.some((r) => r === "admin" || r === "analyst" || r === "operations" || r === "executive");

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
