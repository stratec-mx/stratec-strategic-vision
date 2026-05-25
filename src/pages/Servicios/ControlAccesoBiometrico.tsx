import { ServiceLanding } from "@/components/templates/ServiceLanding";

export default function ControlAccesoBiometricoPage() {
  return (
    <ServiceLanding
      slug="control-acceso-biometrico"
      title="Control de Acceso Biométrico"
      metaTitle="Control de Acceso Biométrico Inteligente | STRATEC"
      metaDescription="Sistemas de control de acceso biométrico facial, dactilar y por reconocimiento para instalaciones industriales, corporativas y gubernamentales."
      keywords={["control de acceso", "biometría", "biométrico facial", "seguridad física"]}
      heroSubtitle="Integración de control de acceso biométrico con monitoreo centralizado, trazabilidad y cumplimiento normativo."
      benefits={[
        "Reconocimiento facial y dactilar",
        "Integración con sistemas de RR.HH. y nómina",
        "Bitácora digital auditable",
        "Control por zonas y niveles de privilegio",
        "Alertas en tiempo real",
        "Cumplimiento de protección de datos personales",
      ]}
      process={[
        { title: "Diagnóstico", desc: "Análisis de puntos críticos de acceso" },
        { title: "Diseño", desc: "Arquitectura técnica e integración" },
        { title: "Despliegue", desc: "Instalación y configuración" },
        { title: "Operación", desc: "Monitoreo, soporte y mejora continua" },
      ]}
      whatsappMessage="Quiero información sobre control de acceso biométrico"
    />
  );
}
