import ServiceLanding from "@/components/services/ServiceLanding";
import { SERVICES_DATA } from "@/data/servicesData";

export default function ProgramaInternoProteccionCivil() {
  return <ServiceLanding data={SERVICES_DATA["programa-interno-proteccion-civil"]} />;
}
