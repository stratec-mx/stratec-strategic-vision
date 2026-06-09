import ServiceLanding from "@/components/services/ServiceLanding";
import { SERVICES_DATA } from "@/data/servicesData";

export default function DictamenSeguridad() {
  return <ServiceLanding data={SERVICES_DATA["dictamen-seguridad"]} />;
}
