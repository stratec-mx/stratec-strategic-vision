import { LegalLayout } from "@/components/LegalLayout";

const Privacidad = () => (
  <LegalLayout
    eyebrow="Marco legal"
    title="Aviso de Privacidad"
    updated="01 de mayo, 2026"
    intro="STRATEC Security, en su carácter de responsable del tratamiento de datos personales, establece el presente Aviso conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y sus mejores prácticas internacionales de manejo de información institucional sensible."
    sections={[
      {
        title: "Identidad y domicilio del responsable",
        body: "STRATEC Security, con domicilio en el estado de Morelos, México, es responsable del uso, protección y tratamiento de los datos personales que recabe de sus clientes institucionales, contrapartes contractuales y visitantes de sus plataformas digitales. Para cualquier asunto relacionado con el presente aviso, puede contactarnos en: contacto@stratecsecurity.com | https://stratecsecurity.com",
      },
      {
        title: "Datos personales recabados",
        body: [
          "Datos de identificación: nombre completo, cargo, organización, correo electrónico institucional y datos de contacto profesional.",
          "Datos de contexto profesional necesarios para la prestación de servicios de consultoría e inteligencia estratégica.",
          "Datos técnicos derivados de la navegación en nuestros canales digitales (dirección IP, tipo de navegador, métricas de uso agregadas).",
        ],
      },
      {
        title: "Finalidades del tratamiento",
        body: [
          "Atender solicitudes de diagnóstico, propuesta de servicios y agendamiento ejecutivo.",
          "Establecer y dar cumplimiento a la relación contractual con clientes institucionales.",
          "Emitir comunicaciones estrictamente vinculadas a los servicios de interés o contratados.",
          "Cumplir con obligaciones legales, regulatorias y de auditoría aplicables en México.",
          "Mejorar nuestros servicios mediante el análisis estadístico agregado de uso del sitio.",
        ],
      },
      {
        title: "Transferencias de datos",
        body: "STRATEC Security no comercializa ni cede información personal a terceros con fines distintos a los aquí descritos. Las transferencias se realizarán únicamente a sociedades vinculadas, asesores legales y autoridades competentes cuando así lo requiera la ley, bajo estrictos acuerdos de confidencialidad y conforme al marco legal vigente.",
      },
      {
        title: "Uso de cookies y tecnologías de rastreo",
        body: [
          "Este sitio utiliza cookies analíticas y de seguimiento únicamente CON TU CONSENTIMIENTO EXPLÍCITO. Ninguno de estos scripts se ejecuta sin que aceptes el banner de cookies.",
          "Google Analytics 4 (ID: G-9SEKJR2MC6) — Análisis agregado y anónimo del comportamiento de visitantes para mejorar nuestros servicios.",
          "Meta Pixel (ID: 978906281171528) — Seguimiento de conversiones y optimización de campañas publicitarias.",
          "Ambos servicios se cargan ÚNICAMENTE después de que hagas clic en 'Aceptar' en el banner de cookies. Si rechazas o ignoras el banner, NO se cargarán.",
          "Puedes revocar tu consentimiento en cualquier momento eliminando las cookies de tu navegador o contactando a contacto@stratecsecurity.com.",
        ],
      },
      {
        title: "Medidas de seguridad",
        body: "Implementamos controles administrativos, técnicos y físicos alineados a estándares ISO/IEC 27001 y NIST CSF para preservar la confidencialidad, integridad y disponibilidad de la información tratada, incluyendo cifrado en tránsito y en reposo, segmentación de accesos y bitácoras de auditoría.",
      },
      {
        title: "Derechos ARCO",
        body: "El titular podrá ejercer en cualquier momento sus derechos de Acceso, Rectificación, Cancelación y Oposición al tratamiento de sus datos, así como revocar el consentimiento otorgado, mediante solicitud al correo contacto@stratecsecurity.com, acompañando la documentación que acredite su identidad o representación legal. Atenderemos su solicitud en un plazo máximo de 20 días hábiles conforme a la LFPDPPP.",
      },
      {
        title: "Modificaciones al aviso",
        body: "STRATEC Security se reserva el derecho de actualizar el presente Aviso de Privacidad en cualquier momento. Las modificaciones serán publicadas en el sitio institucional https://stratecsecurity.com/privacidad con su correspondiente fecha de vigencia. Se recomienda revisar periódicamente este documento.",
      },
    ]}
  />
);

export default Privacidad;
