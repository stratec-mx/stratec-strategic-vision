import ServiceLanding from "@/components/services/ServiceLanding";
import { SERVICES_DATA } from "@/data/servicesData";

export default function GpsMonitoreoVehicular() {
  return <ServiceLanding data={SERVICES_DATA["gps-monitoreo-vehicular"]} />;
}
