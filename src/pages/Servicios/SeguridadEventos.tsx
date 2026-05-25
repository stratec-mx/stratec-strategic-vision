import { ServiceLanding } from "@/components/templates/ServiceLanding";

export default function SeguridadEventosPage() {
  return (
    <ServiceLanding
      slug="seguridad-eventos"
      title="Seguridad y Coordinación de Eventos"
      metaTitle="Seguridad de Eventos Corporativos e Institucionales | STRATEC"
      metaDescription="Coordinación integral de seguridad para eventos corporativos, institucionales, masivos y de alto nivel. Staff certificado y protocolos de respuesta."
      keywords={["seguridad eventos", "coordinación operativa", "eventos masivos", "staff seguridad"]}
      heroSubtitle="Operativos de seguridad llave en mano para eventos corporativos, gubernamentales y masivos con personal certificado."
      benefits={[
        "Análisis previo de riesgos del evento",
        "Diseño de protocolos y rutas de evacuación",
        "Coordinación con protección civil y autoridades",
        "Staff operativo uniformado y capacitado",
        "Control de accesos y acreditaciones",
        "Reporte post-evento y lecciones aprendidas",
      ]}
      process={[
        { title: "Briefing", desc: "Levantamiento de necesidades y aforo" },
        { title: "Plan operativo", desc: "Diseño de despliegue y contingencias" },
        { title: "Ejecución", desc: "Coordinación en sitio en tiempo real" },
        { title: "Cierre", desc: "Reporte ejecutivo y mejora continua" },
      ]}
      whatsappMessage="Quiero información sobre seguridad para un evento"
    />
  );
}
