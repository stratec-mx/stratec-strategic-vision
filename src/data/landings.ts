// Textos de las landings de captación (una por problema). La página es la misma
// plantilla (src/components/landing/LandingPage.tsx); para crear otra
// (/camaras, /proteccion-civil, /escuelas) se agrega aquí un objeto nuevo, su
// ruta en src/routes/routes.tsx y su entrada en SEO (src/config/seo.ts).
//
// Reglas de los textos (acordadas con el titular):
//   · Solo datos confirmados: más de 300 personas capacitadas, constancia DC-3 al
//     concluir una capacitación y experiencia con instituciones de seguridad pública.
//   · Nunca "certifica" ni "registrada ante la STPS"; no citar leyes de extorsión.
//   · Sin cifras ni testimonios inventados y sin condiciones internas.

export const WHATSAPP_NUMBER = "522206488688";

export const waLink = (text: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

export type LandingIcon = "phone" | "users" | "shield" | "alert" | "file" | "message";

export interface LandingData {
  slug: string;
  ruta: string;
  /** Origen que se ve en el panel, en Telegram y en el correo interno. */
  origen: string;
  /** Servicio de interés con el que se registra el lead. */
  servicio: string;
  seo: { title: string; description: string; keywords: string[] };
  hero: {
    eyebrow: string;
    titulo: string;
    problema: string;
    solucion: string;
    cta: string;
    confianza: string[];
  };
  beneficios: { titulo: string; items: { icon: LandingIcon; titulo: string; texto: string }[] };
  pasos: { titulo: string; items: { titulo: string; texto: string }[] };
  formulario: {
    titulo: string;
    texto: string;
    boton: string;
    gracias: { titulo: string; texto: string };
  };
  whatsapp: {
    boton: string;
    mensaje: string;
    /** Mensaje después de dejar sus datos; {nombre} y {empresa} se reemplazan. */
    mensajeGracias: string;
  };
  faq: { titulo: string; items: { q: string; a: string }[] };
  cierre: { titulo: string; texto: string };
}

export const LANDINGS = {
  extorsion: {
    slug: "extorsion",
    ruta: "/extorsion",
    origen: "Landing extorsión",
    servicio: "Protocolos y capacitación contra extorsión",
    seo: {
      title: "Protege a tu empresa de la extorsión telefónica | STRATEC Security",
      description:
        "Protocolos y capacitación práctica para que tu equipo sepa qué hacer en el primer minuto de una llamada de extorsión. Para comercios, oficinas, restaurantes y empresas de Morelos.",
      keywords: ["extorsión telefónica empresas", "protocolo de extorsión", "capacitación extorsión personal", "extorsión Morelos", "CIVAC seguridad"],
    },
    hero: {
      eyebrow: "Para dueños y gerentes de empresas en Morelos",
      titulo: "Si mañana llaman para extorsionar a tu empresa, ¿tu equipo sabe qué hacer en el primer minuto?",
      problema:
        "La llamada puede entrar por recepción, por caja o al celular de un gerente. Si quien contesta tiene que improvisar, el miedo decide por él.",
      solucion:
        "Preparamos a tu personal con protocolos claros y una capacitación práctica, para que nadie caiga en el engaño y todos sepan a quién avisar.",
      cta: "Quiero proteger a mi equipo",
      confianza: [
        "Más de 300 personas capacitadas",
        "Constancia DC-3 al concluir",
        "Experiencia con instituciones de seguridad pública",
      ],
    },
    beneficios: {
      titulo: "Lo que gana tu empresa",
      items: [
        {
          icon: "phone",
          titulo: "Nadie improvisa",
          texto: "Cada persona sabe reconocer una llamada de extorsión, qué responder y qué nunca decir.",
        },
        {
          icon: "users",
          titulo: "Todos saben a quién avisar",
          texto: "Quién decide, a quién se informa y cómo se verifica la situación queda definido antes de que pase.",
        },
        {
          icon: "shield",
          titulo: "Personal entrenado, no solo informado",
          texto: "Capacitación práctica con casos y ejercicios, para que el protocolo se aplique bajo presión. Al concluir, se entrega la constancia DC-3.",
        },
        {
          icon: "alert",
          titulo: "También contra fraudes",
          texto: "Tu equipo aprende a detectar solicitudes falsas de pago y a quien se hace pasar por un proveedor o un directivo.",
        },
      ],
    },
    pasos: {
      titulo: "Cómo funciona",
      items: [
        {
          titulo: "Platicamos de tu empresa",
          texto: "Una llamada breve para entender cómo opera tu negocio, quién contesta el teléfono y a qué riesgos está expuesto tu personal.",
        },
        {
          titulo: "Diseñamos tu protocolo",
          texto: "Un documento a la medida: qué hacer en cada situación, quiénes son los responsables y cómo se comunican.",
        },
        {
          titulo: "Capacitamos a tu equipo",
          texto: "Una sesión práctica para que todos conozcan el protocolo y sepan aplicarlo. Al concluir, se entrega la constancia DC-3.",
        },
      ],
    },
    formulario: {
      titulo: "Te llamamos para revisar tu caso",
      texto: "Déjanos tres datos. Un consultor de STRATEC te contacta para entender tu negocio y proponerte una solución, sin compromiso.",
      boton: "Quiero que me llamen",
      gracias: {
        titulo: "¡Gracias! Recibimos tus datos.",
        texto: "Un consultor de STRATEC te contactará pronto. Si prefieres adelantar la conversación, escríbenos por WhatsApp.",
      },
    },
    whatsapp: {
      boton: "Escribir por WhatsApp",
      mensaje: "Hola, vi su página sobre extorsión y quiero proteger a mi empresa. ¿Me pueden dar información?",
      mensajeGracias: "Hola, soy {nombre} de {empresa}. Acabo de dejar mis datos en su página sobre extorsión y quiero adelantar la conversación.",
    },
    faq: {
      titulo: "Preguntas frecuentes",
      items: [
        {
          q: "¿Para qué tipo de empresa es?",
          a: "Para comercios establecidos, oficinas, restaurantes con personal y empresas medianas. El protocolo se adapta al tamaño de tu equipo y a quién contesta el teléfono en tu negocio.",
        },
        {
          q: "¿Sirve si ya recibimos una llamada de extorsión?",
          a: "Sí. Es el mejor momento para que no se repita: revisamos qué pasó y preparamos al equipo. Si estás recibiendo una amenaza en este momento, llama al 911.",
        },
        {
          q: "¿Cuánto cuesta?",
          a: "Depende de cuántas personas tiene tu equipo y de cuántas se capacitan. Después de la primera llamada te enviamos una cotización clara, sin compromiso.",
        },
      ],
    },
    cierre: {
      titulo: "La mejor respuesta a una extorsión se prepara antes de que suene el teléfono.",
      texto: "Prepara hoy a tu equipo para que nadie caiga.",
    },
  },
} satisfies Record<string, LandingData>;

export type LandingSlug = keyof typeof LANDINGS;

/** Rutas de las landings: en ellas se ocultan el botón flotante de WhatsApp y el chat. */
export const LANDING_RUTAS: string[] = Object.values(LANDINGS).map((l) => l.ruta);

export const esLanding = (pathname: string) => LANDING_RUTAS.includes(pathname.replace(/\/+$/, "") || "/");
