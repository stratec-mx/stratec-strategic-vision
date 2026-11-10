import ServiceLanding from "@/components/services/ServiceLanding";
import { SERVICES_DATA } from "@/data/servicesData";

export default function AcompanamientoMensual() {
  return <ServiceLanding data={SERVICES_DATA["acompanamiento-mensual"]} />;
}
