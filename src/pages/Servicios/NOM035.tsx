import { ServiceLanding } from "@/components/templates/ServiceLanding";

export default function NOM035Page() {
  return (
    <ServiceLanding
      slug="nom-035"
      title="Evaluación NOM-035 STPS"
      metaTitle="Evaluación NOM-035 | Riesgos Psicosociales | STRATEC"
      metaDescription="Cumple la NOM-035 STPS con diagnósticos de factores de riesgo psicosocial, intervención y seguimiento certificado para tu organización."
      keywords={["NOM-035", "STPS", "riesgos psicosociales", "evaluación NOM-035"]}
      heroSubtitle="Diagnóstico, intervención y seguimiento de factores de riesgo psicosocial conforme a la Norma Oficial Mexicana NOM-035-STPS-2018."
      benefits={[
        "Aplicación de cuestionarios oficiales (Guía II y III)",
        "Diagnóstico organizacional confidencial",
        "Plan de acción e intervención",
        "Política de prevención de riesgos psicosociales",
        "Capacitación a líderes y personal",
        "Documentación lista para auditoría STPS",
      ]}
      process={[
        { title: "Levantamiento", desc: "Mapeo de centros de trabajo y plantilla" },
        { title: "Aplicación", desc: "Cuestionarios digitales o presenciales" },
        { title: "Diagnóstico", desc: "Análisis estadístico y reporte ejecutivo" },
        { title: "Intervención", desc: "Plan de acción y seguimiento" },
      ]}
      faqs={[
        { question: "¿La NOM-035 aplica a mi empresa?", answer: "Aplica a todos los centros de trabajo en México. Los requerimientos varían según el número de trabajadores." },
        { question: "¿Cuánto tarda la implementación?", answer: "Entre 4 y 8 semanas dependiendo del tamaño de la organización." },
      ]}
      whatsappMessage="Quiero información sobre evaluación NOM-035"
    />
  );
}
