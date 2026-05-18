import { LegalLayout } from "@/components/LegalLayout";

const Confidentiality = () => (
  <LegalLayout
    eyebrow="Compromiso institucional"
    title="Confidencialidad Institucional"
    updated="01 de mayo, 2026"
    intro="La confidencialidad constituye un principio rector y un activo estratégico de STRATEC. Toda interacción con clientes, contrapartes, prospectos y autoridades se gestiona bajo estándares reforzados de discreción profesional, custodia documental y trazabilidad."
    sections={[
      {
        title: "Principio rector",
        body: "STRATEC opera bajo el principio de mínima divulgación: la información obtenida en el marco de una relación profesional únicamente es conocida por el personal estrictamente necesario para la ejecución del servicio, sujeto a obligaciones de reserva indefinidas en el tiempo.",
      },
      {
        title: "Acuerdo de confidencialidad",
        body: "Previo a cualquier diagnóstico, evaluación o intercambio sustantivo de información, STRATEC suscribe Acuerdos de Confidencialidad bilaterales (NDA) que delimitan el universo de información protegida, los usos permitidos, los plazos de reserva y las consecuencias contractuales del incumplimiento.",
      },
      {
        title: "Controles operativos",
        body: [
          "Segmentación de equipos por proyecto bajo modelo need-to-know.",
          "Repositorios cifrados con doble factor de autenticación y bitácora de accesos.",
          "Canales seguros para intercambio de información sensible (S/MIME, repositorios privados).",
          "Sanitización y destrucción certificada de documentación al cierre de proyectos.",
        ],
      },
      {
        title: "Cumplimiento normativo",
        body: "Nuestros protocolos se alinean a marcos internacionales ISO/IEC 27001, NIST SP 800-53, así como a normativa local de protección de datos. Realizamos auditorías internas periódicas y mantenemos un programa de mejora continua sobre nuestros controles de seguridad de la información.",
      },
      {
        title: "Conducta profesional",
        body: "El personal de STRATEC se rige por un Código de Conducta que establece estándares estrictos de integridad, independencia profesional, manejo de conflictos de interés y prohibición absoluta de divulgación de información de clientes, vigente incluso tras la terminación de la relación laboral o contractual.",
      },
      {
        title: "Canal institucional",
        body: "Cualquier inquietud relacionada con el manejo confidencial de información puede dirigirse al Comité de Ética y Cumplimiento al correo cumplimiento@stratec.mx. Las comunicaciones recibidas son tratadas bajo absoluta reserva.",
      },
    ]}
  />
);

export default Confidentiality;
