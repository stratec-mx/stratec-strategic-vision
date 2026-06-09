import ServiceLanding from "@/components/services/ServiceLanding";
import { SERVICES_DATA } from "@/data/servicesData";

export default function AuditoriaSeguridadPage() {
  return <ServiceLanding data={SERVICES_DATA["auditoria-seguridad"]} />;
}
