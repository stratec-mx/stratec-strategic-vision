import ServiceLanding from "@/components/services/ServiceLanding";
import { SERVICES_DATA } from "@/data/servicesData";

export default function ConsultoriaGobierno() {
  return <ServiceLanding data={SERVICES_DATA["consultoria-gobierno"]} />;
}
