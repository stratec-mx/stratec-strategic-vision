import { LegalLayout } from "@/components/LegalLayout";

const Privacy = () => (
  <LegalLayout
    eyebrow="Marco legal"
    title="Aviso de Privacidad"
    updated="01 de mayo, 2026"
    intro="STRATEC Consultoría en Seguridad, en su carácter de responsable del tratamiento de datos personales, establece el presente Aviso conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares y mejores prácticas internacionales de manejo de información institucional sensible."
    sections={[
      {
        title: "Identidad del responsable",
        body: "STRATEC Consultoría en Seguridad S.A. de C.V., con domicilio en Ciudad de México, es responsable del uso, protección y tratamiento de los datos personales que recabe de sus clientes institucionales, contrapartes contractuales y visitantes de sus plataformas digitales.",
      },
      {
        title: "Datos personales recabados",
        body: [
          "Datos de identificación: nombre, cargo, organización, correo institucional y datos de contacto profesional.",
          "Datos de contexto profesional necesarios para la prestación de servicios de consultoría e inteligencia estratégica.",
          "Datos técnicos derivados de la navegación en nuestros canales digitales (dirección IP, navegador, métricas agregadas).",
        ],
      },
      {
        title: "Finalidades del tratamiento",
        body: [
          "Atender solicitudes de diagnóstico, propuesta de servicios y agendamiento ejecutivo.",
          "Establecer y dar cumplimiento a la relación contractual con clientes institucionales.",
          "Emitir comunicaciones estrictamente vinculadas a los servicios contratados.",
          "Cumplir con obligaciones legales, regulatorias y de auditoría aplicables.",
        ],
      },
      {
        title: "Transferencias de datos",
        body: "STRATEC no comercializa ni cede información personal a terceros con fines distintos a los aquí descritos. Las transferencias se realizarán únicamente a sociedades vinculadas, asesores legales y autoridades competentes, bajo estrictos acuerdos de confidencialidad y conforme al marco legal vigente.",
      },
      {
        title: "Medidas de seguridad",
        body: "Implementamos controles administrativos, técnicos y físicos alineados a estándares ISO/IEC 27001 y NIST CSF para preservar la confidencialidad, integridad y disponibilidad de la información tratada, incluyendo cifrado en tránsito y en reposo, segmentación de accesos y bitácoras de auditoría.",
      },
      {
        title: "Derechos ARCO",
        body: "El titular podrá ejercer en cualquier momento sus derechos de Acceso, Rectificación, Cancelación y Oposición, así como revocar el consentimiento otorgado, mediante solicitud al correo privacidad@stratec.mx, acompañando la documentación que acredite su identidad o representación legal.",
      },
      {
        title: "Modificaciones al aviso",
        body: "STRATEC se reserva el derecho de actualizar el presente Aviso. Las modificaciones serán publicadas en el sitio institucional con su correspondiente fecha de vigencia.",
      },
    ]}
  />
);

export default Privacy;
