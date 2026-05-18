import { LegalLayout } from "@/components/LegalLayout";

const Terms = () => (
  <LegalLayout
    eyebrow="Marco legal"
    title="Términos y Condiciones"
    updated="01 de mayo, 2026"
    intro="El presente documento regula el acceso y uso de los sitios, plataformas y servicios profesionales prestados por STRATEC Consultoría en Seguridad. La utilización de nuestros canales implica la aceptación expresa de las condiciones aquí establecidas."
    sections={[
      {
        title: "Objeto",
        body: "Regular las condiciones bajo las cuales STRATEC pone a disposición de personas físicas y morales información institucional, recursos digitales y la posibilidad de iniciar conversaciones para la contratación de servicios de consultoría, inteligencia preventiva, gestión de riesgos e integración tecnológica.",
      },
      {
        title: "Servicios profesionales",
        body: "Los servicios de consultoría se prestan al amparo de un contrato específico que define alcance, entregables, contraprestación, niveles de servicio, cláusulas de confidencialidad y régimen de propiedad intelectual. La información publicada en este sitio tiene fines exclusivamente informativos y no constituye oferta vinculante.",
      },
      {
        title: "Uso autorizado",
        body: [
          "Queda prohibida la reproducción total o parcial del contenido sin autorización por escrito de STRATEC.",
          "El usuario se compromete a no utilizar nuestros canales para fines ilícitos o que vulneren derechos de terceros.",
          "STRATEC podrá restringir o suspender el acceso ante usos contrarios a estas condiciones.",
        ],
      },
      {
        title: "Propiedad intelectual",
        body: "Todos los signos distintivos, marcas, metodologías, modelos analíticos, documentación y materiales publicados en este sitio son propiedad de STRATEC o se utilizan bajo licencia. Su reproducción, distribución o transformación requiere consentimiento previo y por escrito.",
      },
      {
        title: "Limitación de responsabilidad",
        body: "STRATEC no será responsable de decisiones tomadas por terceros con base en información publicada en este sitio sin mediar una relación contractual formal. Los compromisos de resultado se establecen exclusivamente en los contratos suscritos con cada cliente institucional.",
      },
      {
        title: "Legislación aplicable",
        body: "Los presentes Términos se rigen por las leyes de los Estados Unidos Mexicanos. Cualquier controversia será sometida a la jurisdicción de los tribunales competentes en la Ciudad de México, con renuncia expresa a cualquier otro fuero.",
      },
    ]}
  />
);

export default Terms;
