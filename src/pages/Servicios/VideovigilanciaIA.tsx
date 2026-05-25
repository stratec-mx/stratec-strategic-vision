import { ServiceLanding } from "@/components/templates/ServiceLanding";

export default function VideovigilanciaIAPage() {
  return (
    <ServiceLanding
      slug="videovigilancia-ia"
      title="Videovigilancia con Inteligencia Artificial"
      metaTitle="Videovigilancia con IA | Monitoreo Inteligente | STRATEC"
      metaDescription="Sistemas CCTV con analítica de video por inteligencia artificial: detección de intrusión, conteo de personas, reconocimiento y alertas automáticas."
      keywords={["videovigilancia IA", "CCTV inteligente", "analítica de video", "monitoreo inteligente"]}
      heroSubtitle="Plataformas de videovigilancia con IA para detección preventiva, analítica avanzada y respuesta operativa inmediata."
      benefits={[
        "Detección de intrusión y comportamiento anómalo",
        "Reconocimiento de placas y rostros (LPR / FR)",
        "Conteo de personas y mapas de calor",
        "Integración con centros de monitoreo 24/7",
        "Almacenamiento seguro y cumplimiento normativo",
        "Reportes operativos automatizados",
      ]}
      process={[
        { title: "Site survey", desc: "Análisis de cobertura y puntos ciegos" },
        { title: "Ingeniería", desc: "Diseño de red, cámaras y analíticas" },
        { title: "Implementación", desc: "Instalación, calibración y pruebas" },
        { title: "Monitoreo", desc: "Operación 24/7 y mejora continua" },
      ]}
      whatsappMessage="Quiero información sobre videovigilancia con IA"
    />
  );
}
