import ServiceLanding from "@/components/services/ServiceLanding";
import { SERVICES_DATA } from "@/data/servicesData";

export default function RevisionProgramaInterno() {
  return <ServiceLanding data={SERVICES_DATA["revision-programa-interno"]} />;
}
