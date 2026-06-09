import ServiceLanding from "@/components/services/ServiceLanding";
import { SERVICES_DATA } from "@/data/servicesData";

export default function Capacitacion() {
  return <ServiceLanding data={SERVICES_DATA["capacitacion"]} />;
}
