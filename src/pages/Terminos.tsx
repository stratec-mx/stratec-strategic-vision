import { LegalLayout } from "@/components/LegalLayout";

const Terminos = () => (
  <LegalLayout
    eyebrow="Marco legal"
    title="Términos y Condiciones de Servicio"
    updated="01 de mayo, 2026"
    intro="Los presentes Términos y Condiciones regulan el uso del sitio web stratecsecurity.com y la contratación de servicios ofrecidos por STRATEC Security. Al acceder al sitio o solicitar nuestros servicios, el usuario acepta quedar vinculado por los términos aquí descritos."
    sections={[
      {
        title: "Titular del servicio",
        body: "STRATEC Security, con domicilio en el estado de Morelos, México. Correo de contacto: contacto@stratecsecurity.com | Sitio web: https://stratecsecurity.com",
      },
      {
        title: "Uso del sitio web",
        body: [
          "El acceso al sitio es libre y gratuito para consulta de información institucional.",
          "Queda prohibido el uso del sitio para fines ilícitos, fraudulentos o contrarios a la buena fe.",
          "El contenido del sitio (textos, imágenes, metodologías, marcas) es propiedad exclusiva de STRATEC Security y está protegido por las leyes de propiedad intelectual vigentes en México.",
          "STRATEC Security se reserva el derecho de modificar, suspender o discontinuar el sitio en cualquier momento sin previo aviso.",
        ],
      },
      {
        title: "Servicios de consultoría",
        body: [
          "Los servicios de consultoría, auditoría e inteligencia estratégica se formalizan mediante contrato escrito específico para cada proyecto.",
          "Las propuestas, diagnósticos y reportes entregados son documentos confidenciales de uso exclusivo del cliente contratante.",
          "Los honorarios, alcances, plazos y entregables se establecen en el contrato de servicios correspondiente.",
          "STRATEC Security se reserva el derecho de rechazar o discontinuar servicios que contravengan su código ético o la legislación vigente.",
        ],
      },
      {
        title: "Confidencialidad",
        body: "Toda la información compartida por el cliente durante la prestación de servicios será tratada con absoluta confidencialidad. STRATEC Security implementa protocolos institucionales de manejo de información sensible y puede suscribir Acuerdos de No Divulgación (NDA) específicos a solicitud del cliente. Para solicitar un NDA estándar, escriba a: contacto@stratecsecurity.com con el asunto 'Solicitud de NDA estándar'.",
      },
      {
        title: "Limitación de responsabilidad",
        body: [
          "STRATEC Security actúa como consultor estratégico. Las decisiones operativas son responsabilidad exclusiva del cliente.",
          "La información contenida en el sitio web tiene carácter informativo y no constituye asesoría legal ni compromiso contractual.",
          "STRATEC Security no garantiza la disponibilidad continua del sitio web ni la ausencia de errores técnicos.",
        ],
      },
      {
        title: "Propiedad intelectual",
        body: "La marca STRATEC Security, logotipos, metodologías, materiales y contenidos del sitio son propiedad de STRATEC Security. Queda prohibida su reproducción, distribución o uso sin autorización expresa y por escrito.",
      },
      {
        title: "Legislación aplicable y jurisdicción",
        body: "Los presentes Términos se rigen por la legislación de los Estados Unidos Mexicanos. Para cualquier controversia derivada de su interpretación o cumplimiento, las partes se someten a la jurisdicción de los tribunales competentes del estado de Morelos, México, renunciando a cualquier otro fuero que pudiera corresponderles.",
      },
      {
        title: "Modificaciones",
        body: "STRATEC Security puede actualizar estos Términos en cualquier momento. Los cambios serán publicados en https://stratecsecurity.com/terminos con su fecha de vigencia. El uso continuado del sitio tras la publicación de cambios implica la aceptación de los mismos.",
      },
    ]}
  />
);

export default Terminos;
