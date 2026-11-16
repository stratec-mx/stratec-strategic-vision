// Textos de las landings de diagnóstico. Los usan las páginas y el prerender.
// Los textos propios de casa y eventos (título, áreas, alcance) viven en
// src/data/diagnosticoPreguntas.ts; aquí van los de empresas y las FAQ de cada uno.

export const AREAS_TEXT = [
  { title: "Quién se encarga", text: "Si hay alguien a cargo en una emergencia y si tu personal sabe a quién avisar." },
  { title: "Protección civil", text: "Salidas de emergencia libres y señalizadas, extintores al día y teléfonos de emergencia a la vista." },
  { title: "Extorsión y amenazas", text: "Si sabes qué hacer ante una llamada de extorsión, un intento de estafa o una amenaza." },
  { title: "Capacitación", text: "Si tu personal tomó algún curso de primeros auxilios, evacuación o seguridad en el último año." },
  { title: "Cámaras", text: "Si tus cámaras de seguridad están grabando bien." },
  { title: "Tu información y tu operación", text: "Si guardas copias de tu información y tienes un plan para seguir trabajando tras una emergencia." },
];

export const INCLUDES = [
  "Puntaje de preparación de 0 a 10 y nivel de vulnerabilidad",
  "Áreas a atender, con el riesgo de cada una explicado",
  "Áreas que ya tienes en orden",
  "Plan de acción en orden de prioridad",
  "Servicios que pueden ayudarte, si los necesitas",
];

export const FAQ = [
  { q: "¿Cuánto cuesta?", a: "Nada. El diagnóstico básico y su PDF son gratuitos." },
  { q: "¿Qué tan completo es?", a: "Es un diagnóstico básico a partir de tus respuestas. Sirve como punto de partida: no sustituye una evaluación en sitio ni la revisión de la autoridad competente." },
  { q: "¿Por qué piden correo y teléfono?", a: "Para entregarte tu diagnóstico y poder darle seguimiento si lo solicitas. Tus datos se tratan conforme a nuestro aviso de privacidad." },
  { q: "¿Me va a contactar un asesor?", a: "Solo si marcas la casilla \"Deseo que un asesor de STRATEC me contacte por teléfono o WhatsApp\". Si no la marcas, solo recibes tu diagnóstico." },
  { q: "¿Puedo hacerlo desde cualquier estado?", a: "Sí. El diagnóstico funciona para empresas e instituciones de toda la República." },
  { q: "¿Tienen diagnóstico para casas o para eventos?", a: "Sí. Hay un diagnóstico inicial de seguridad residencial, para tu casa y tu familia, y otro para eventos masivos. Los enlaces están junto al cuestionario." },
  { q: "¿En qué se basa?", a: "En la metodología ISO 31000 de gestión de riesgos y en buenas prácticas de protección civil y seguridad corporativa." },
];

const PRIVACIDAD = { q: "¿Por qué piden correo y teléfono?", a: "Para entregarte tu diagnóstico y poder darle seguimiento si lo solicitas. Tus datos se tratan conforme a nuestro aviso de privacidad." };
const ASESOR = { q: "¿Me va a contactar un asesor?", a: "Solo si marcas la casilla \"Deseo que un asesor de STRATEC me contacte por teléfono o WhatsApp\". Si no la marcas, solo recibes tu diagnóstico." };

export const FAQ_CASA = [
  { q: "¿Cuánto cuesta?", a: "Nada. El diagnóstico inicial y su PDF son gratuitos." },
  { q: "¿El resultado dice si mi casa es segura?", a: "No. Es un diagnóstico inicial a partir de tus respuestas: identifica posibles áreas de oportunidad para fortalecer la seguridad de tu hogar, pero no sustituye una inspección física de la vivienda." },
  { q: "¿Sirve para departamentos o casas en fraccionamiento?", a: "Sí. Al final indicas el tipo de vivienda y el resultado se adapta a tu caso." },
  PRIVACIDAD,
  ASESOR,
  { q: "¿Tienen diagnóstico para empresas o para eventos?", a: "Sí. Hay un diagnóstico para empresas e instituciones y otro para eventos masivos. Los enlaces están junto al cuestionario." },
];

export const FAQ_EVENTO = [
  { q: "¿Cuánto cuesta?", a: "Nada. El diagnóstico inicial y su PDF son gratuitos." },
  { q: "¿El resultado significa que mi evento es seguro o que cumple la normativa?", a: "No. Es una autoevaluación preliminar: no garantiza que el evento sea seguro, que cumpla la normativa ni que cuente con las autorizaciones necesarias. Sirve para identificar qué conviene atender antes de la fecha." },
  { q: "¿Con cuánto tiempo conviene hacerlo?", a: "Lo antes posible, de preferencia antes de tramitar permisos y contratar proveedores: así hay tiempo de atender lo que salga." },
  { q: "¿Para qué tamaño de evento sirve?", a: "Para cualquier evento con público, desde menos de 500 personas hasta más de 10,000. Al inicio indicas el tipo de evento y la asistencia esperada." },
  PRIVACIDAD,
  ASESOR,
];
