import ServiceLanding from "@/components/services/ServiceLanding";
import { SERVICES_DATA } from "@/data/servicesData";

export default function DeterminacionSeguridad() {
  return <ServiceLanding data={SERVICES_DATA["determinacion-seguridad"]} />;
}
