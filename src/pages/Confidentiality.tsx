import { LegalLayout } from "@/components/LegalLayout";

const Confidentiality = () => (
  <LegalLayout
    eyebrow="Compromiso institucional"
    title="Confidencialidad Institucional"
    updated="13 de noviembre, 2026"
    intro="La confidencialidad constituye un principio rector y un activo estratégico de STRATEC. Toda interacción con clientes, contrapartes, prospectos y autoridades se gestiona con discreción profesional y cuidado en el manejo de la documentación."
    sections={[
      {
        title: "Principio rector",
        body: "STRATEC opera bajo el principio de mínima divulgación: la información obtenida en el marco de una relación profesional únicamente es conocida por el personal estrictamente necesario para la ejecución del servicio, sujeto a obligaciones de reserva indefinidas en el tiempo.",
      },
      {
        title: "Acuerdo de confidencialidad",
        body: "Cuando el cliente lo solicita, se firma un acuerdo de confidencialidad antes de iniciar el trabajo.",
      },
      {
        title: "Controles operativos",
        body: [
          "La información de cada proyecto se comparte únicamente con el personal asignado a ese proyecto.",
        ],
      },
      {
        title: "Cumplimiento normativo",
        body: "Atendemos la normativa mexicana de protección de datos personales y aplicamos medidas administrativas, técnicas y físicas proporcionales a la información que manejamos.",
      },
      {
        title: "Conducta profesional",
        body: "El personal de STRATEC se rige por un Código de Conducta que establece estándares estrictos de integridad, independencia profesional, manejo de conflictos de interés y prohibición absoluta de divulgación de información de clientes, vigente incluso tras la terminación de la relación laboral o contractual.",
      },
      {
        title: "Canal institucional",
        body: "Cualquier inquietud relacionada con el manejo confidencial de información puede enviarse al correo contacto@stratecsecurity.com con el asunto «Confidencialidad». Las comunicaciones recibidas son tratadas bajo absoluta reserva.",
      },
    ]}
  />
);

export default Confidentiality;
