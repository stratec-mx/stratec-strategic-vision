import { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { RESOURCES, type Resource } from "@/lib/access";

/** Muestra el módulo solo si el usuario tiene permiso de verlo (access_rules). */
export const RequireAccess = ({ resource, children }: { resource: Resource; children: ReactNode }) => {
  const { can } = useAuth();
  if (can(resource)) return <>{children}</>;
  const label = RESOURCES.find((r) => r.id === resource)?.label ?? resource;
  return (
    <div className="border border-border bg-card p-12 text-center">
      <ShieldCheck className="h-8 w-8 text-olive mx-auto mb-3" />
      <div className="font-display text-lg text-navy">Acceso restringido</div>
      <p className="mt-2 text-sm text-steel max-w-md mx-auto">
        Tu rol no tiene permiso para ver <b>{label}</b>. Si lo necesitas, pide a un administrador que lo habilite en
        Ajustes → Niveles de acceso.
      </p>
    </div>
  );
};
