import ServiceLanding from "@/components/services/ServiceLanding";
import { SERVICES_DATA } from "@/data/servicesData";

export default function IntegracionTecnologica() {
  return <ServiceLanding data={SERVICES_DATA["integracion-tecnologica"]} />;
}
