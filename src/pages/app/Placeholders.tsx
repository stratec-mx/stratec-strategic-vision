import { PageHeader } from "@/components/app/PageHeader";
import { Construction } from "lucide-react";

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

export const Messaging = () => <ComingSoon eyebrow="Comunicaciones" title="Mensajería · WhatsApp & Correo" description="Bandeja unificada de canales institucionales." />;
export const Settings = () => <ComingSoon eyebrow="Configuración" title="Ajustes" description="Roles, permisos y preferencias de la firma." />;
