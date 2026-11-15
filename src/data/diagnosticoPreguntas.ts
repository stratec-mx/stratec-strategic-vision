// Preguntas y textos del diagnóstico básico (/diagnostico) por tipo:
// negocio o institución, casa (seguridad residencial) y evento masivo.
// Redactadas para que cualquier persona las entienda, sin términos técnicos.
// En todas, "Sí" es la respuesta que indica que el punto está cubierto.
import { GIROS } from "@/lib/pricing";

export type TipoDiagnostico = "negocio" | "casa" | "evento";
export const TIPOS: TipoDiagnostico[] = ["negocio", "casa", "evento"];

/** Lee ?tipo= de la dirección; acepta variantes comunes y basura al final ("casa)"). */
export function tipoDesdeParam(valor: string | null | undefined): TipoDiagnostico {
  const v = String(valor ?? "").toLowerCase().normalize("NFD").replace(/[^a-z]/g, "");
  if (["casa", "casas", "hogar", "residencial", "residencia", "vivienda"].includes(v)) return "casa";
  if (["evento", "eventos", "eventomasivo", "eventosmasivos", "masivo"].includes(v)) return "evento";
  return "negocio";
}

export interface ServicioSugerido {
  short: string;
  url: string;
  /** Código del cotizador */
  code: string;
  color: string;
  bg: string;
}

const NAVY = { color: "#0B1F3A", bg: "rgba(11,31,58,0.08)" };
const CAFE = { color: "#7B4A1E", bg: "rgba(123,74,30,0.08)" };
const GRIS = { color: "#5E646E", bg: "rgba(94,100,110,0.1)" };
const ORO = { color: "#9a7d2f", bg: "rgba(196,160,74,0.12)" };

// Solo servicios que ya existen en el sitio (SERVICES_DATA).
export const SERVICIOS: Record<string, ServicioSugerido> = {
  consultoria:  { short: "Consultoría en Seguridad", url: "/servicios/consultoria-seguridad", code: "STR-01", ...NAVY },
  analisis:     { short: "Estudio y Análisis de Riesgo", url: "/servicios/estudio-analisis-riesgo", code: "STR-01.1", ...NAVY },
  protocolos:   { short: "Protocolos de Seguridad", url: "/servicios/protocolos-seguridad", code: "STR-01.4", ...NAVY },
  gestion:      { short: "Protección Civil y Gestión de Riesgos", url: "/servicios/proteccion-civil", code: "STR-02", ...CAFE },
  proteccion:   { short: "Programa Interno de Protección Civil", url: "/servicios/programa-interno-proteccion-civil", code: "STR-02.1", ...CAFE },
  revision:     { short: "Revisión de Programa Interno", url: "/servicios/revision-programa-interno", code: "STR-02.3", ...CAFE },
  capacitacion: { short: "Capacitación", url: "/servicios/capacitacion", code: "STR-03", ...GRIS },
  tecnologia:   { short: "Tecnología de Seguridad", url: "/servicios/integracion-tecnologica", code: "STR-04", ...ORO },
};

export interface Pregunta {
  id: number;
  text: string;
  /** Aparece en el resultado, el PDF y la nota del lead */
  short: string;
  /** Claves de SERVICIOS; la primera es la que se muestra junto al punto */
  services: string[];
  riesgo: string;
}

export interface OpcionPerfil {
  id: string;
  label: string;
}

export interface CampoPerfil {
  id: string;
  /** Etiqueta del formulario */
  label: string;
  /** Etiqueta corta para el aviso interno y el mensaje de WhatsApp */
  corto: string;
  required: boolean;
  options: OpcionPerfil[];
  /** Valor inicial de un campo opcional; con este valor el dato se omite */
  inicial?: string;
}

export interface ConfigDiagnostico {
  id: TipoDiagnostico;
  /** Botón del selector */
  etiqueta: string;
  detalle: string;
  /** Nombre interno (aviso de Telegram, nota del lead) */
  nombre: string;
  /** "tu negocio", "tu casa", "tu evento" */
  sujeto: string;
  preguntas: Pregunta[];
  niveles: { bajo: string; medio: string; alto: string };
  perfil: { titulo: string; ayuda: string; campos: CampoPerfil[] };
  mapa: { titulo: string; ayuda: string };
  /** Campo opcional del formulario de contacto (empresa, colonia, nombre del evento) */
  contacto: { campo: string; etiquetaNota: string };
  pdf: { titulo: string; paraQuien: string; revisar: string; mantener: string };
  /** Frase del mensaje de WhatsApp: "hice el diagnóstico básico …" */
  whatsapp: string;
}

const ESTADOS: OpcionPerfil[] = ["Morelos", "Ciudad de México", "Estado de México", "Puebla", "Guerrero", "Otro estado"].map((e) => ({ id: e, label: e }));
const CAMPO_ESTADO: CampoPerfil = { id: "estado", label: "Estado", corto: "Estado", required: true, options: ESTADOS };

// Rangos que ve el visitante → valor representativo para la clasificación interna (solo negocio)
export const PERSONAS = [
  { id: "1-15", label: "1 a 15 personas", value: 10 },
  { id: "16-50", label: "16 a 50 personas", value: 40 },
  { id: "51-250", label: "51 a 250 personas", value: 150 },
  { id: "251-1000", label: "251 a 1,000 personas", value: 600 },
  { id: "1000+", label: "Más de 1,000 personas", value: 1500 },
];
export const SUPERFICIE = [
  { id: "ns", label: "No lo sé", value: 0 },
  { id: "500", label: "De 10 a 500 m²", value: 300 },
  { id: "1500", label: "De 500 a 1,500 m²", value: 1000 },
  { id: "5000", label: "De 1,500 a 5,000 m²", value: 3000 },
  { id: "5000+", label: "Más de 5,000 m²", value: 8000 },
];

const NEGOCIO: ConfigDiagnostico = {
  id: "negocio",
  etiqueta: "Mi negocio o institución",
  detalle: "Empresas, comercios, escuelas, oficinas",
  nombre: "Negocio",
  sujeto: "tu negocio",
  preguntas: [
    { id: 1, text: "¿Hay una persona encargada de organizar a todos si pasa una emergencia, como un sismo, un incendio o un robo?", short: "Una persona a cargo en emergencias", services: ["consultoria"], riesgo: "Si nadie está a cargo, cada quien hace lo que cree y el problema crece. Además, la responsabilidad recae en el dueño o en la dirección." },
    { id: 2, text: "¿Tu personal sabe a quién avisar si ve algo raro, recibe una amenaza o hay un accidente?", short: "Saber a quién avisar", services: ["protocolos", "consultoria"], riesgo: "Si nadie sabe a quién avisar, se pierde tiempo y se toman decisiones encontradas. Los primeros minutos son los que más cuentan." },
    { id: 3, text: "¿Tienes a la vista los teléfonos de emergencia (bomberos, Cruz Roja, policía) y están actualizados?", short: "Teléfonos de emergencia a la vista", services: ["revision", "proteccion"], riesgo: "En una emergencia nadie tiene tiempo de buscar números. Tenerlos a la mano ahorra minutos que pueden salvar vidas." },
    { id: 4, text: "¿Las salidas de emergencia tienen señales y están libres, sin cajas ni muebles que estorben?", short: "Salidas señalizadas y libres", services: ["revision", "proteccion"], riesgo: "Una salida tapada o sin señal puede atrapar a las personas en un incendio o un sismo. Es de lo primero que revisa Protección Civil en una inspección." },
    { id: 5, text: "¿Tienes extintores fáciles de ver y de alcanzar, con su recarga al día?", short: "Extintores listos para usarse", services: ["revision", "proteccion"], riesgo: "Un extintor vencido o tapado no sirve cuando hay fuego. Además puede costarte una multa o una suspensión." },
    { id: 6, text: "¿Sabes qué hacer si alguien llama para extorsionarte, intenta estafarte o te amenaza?", short: "Saber qué hacer ante extorsión o amenazas", services: ["protocolos", "consultoria"], riesgo: "Sin un plan, quien extorsiona toma el control desde la primera llamada y el daño económico crece." },
    { id: 7, text: "¿Tu personal ha tomado algún curso de primeros auxilios, evacuación o seguridad en el último año?", short: "Personal con curso reciente", services: ["capacitacion"], riesgo: "Sin práctica, las personas se paralizan o se equivocan en una emergencia. Un plan solo funciona si la gente sabe aplicarlo." },
    { id: 8, text: "¿Tus cámaras de seguridad están grabando bien en este momento? (Si no tienes cámaras, responde No.)", short: "Cámaras grabando bien", services: ["tecnologia"], riesgo: "Muchas cámaras dejan de grabar sin que nadie lo note. Si no graban, no ayudan a evitar un robo ni sirven como prueba." },
    { id: 9, text: "¿Guardas copias de tu información importante (clientes, facturas, contabilidad) y has comprobado que sí se pueden recuperar?", short: "Copias de tu información importante", services: ["tecnologia"], riesgo: "Sin copias, un virus, el robo de una computadora o una falla pueden borrar tu información para siempre." },
    { id: 10, text: "¿Tienes un plan para seguir trabajando si tu negocio tuviera que cerrar unos días por una emergencia?", short: "Plan para seguir trabajando", services: ["tecnologia", "consultoria"], riesgo: "Sin un plan, un problema de dos días puede detener tu negocio por semanas y costarte clientes." },
  ],
  niveles: {
    bajo: "Tienes lo básico en orden. Mantén al día tus equipos, tus planes y los cursos de tu personal, y revisa todo al menos una vez al año.",
    medio: "Tienes una base, pero los puntos señalados pueden hacer que un problema sea mucho más grave. El plan te dice qué atender primero.",
    alto: "Hay varios puntos sin atender en emergencias, seguridad, capacitación y manejo de información. Conviene revisarlo con un especialista.",
  },
  perfil: {
    titulo: "Sobre tu negocio",
    ayuda: "Para adaptar las recomendaciones a tu tipo de inmueble.",
    campos: [
      { id: "giro", label: "Giro", corto: "Giro", required: true, options: GIROS.map((g) => ({ id: g.id, label: g.label })) },
      { id: "personas", label: "Personas en el inmueble (trabajadores y visitantes)", corto: "Personas", required: true, options: PERSONAS.map(({ id, label }) => ({ id, label })) },
      { id: "superficie", label: "Superficie construida aproximada", corto: "Superficie", required: false, inicial: "ns", options: SUPERFICIE.map(({ id, label }) => ({ id, label })) },
      CAMPO_ESTADO,
    ],
  },
  mapa: { titulo: "Marca tu predio", ayuda: "señala accesos, puntos ciegos y zonas que te preocupan" },
  contacto: { campo: "Empresa o institución (opcional)", etiquetaNota: "Empresa" },
  pdf: {
    titulo: "DIAGNÓSTICO BÁSICO DE SEGURIDAD",
    paraQuien: "Organización participante",
    revisar: "Documenta lo realizado y revísalo al menos una vez al año o cuando cambie el inmueble o el personal.",
    mantener: "Mantén al día procedimientos, equipos y capacitación, y revisa tus condiciones de seguridad al menos una vez al año.",
  },
  whatsapp: "hice el diagnóstico básico",
};

const CASA: ConfigDiagnostico = {
  id: "casa",
  etiqueta: "Mi casa",
  detalle: "Casa, departamento o fraccionamiento",
  nombre: "Casa",
  sujeto: "tu casa",
  preguntas: [
    { id: 1, text: "¿Las puertas y ventanas que dan a la calle cierran bien y tienen cerraduras en buen estado?", short: "Puertas y ventanas seguras", services: ["consultoria"], riesgo: "La mayoría de los robos a casa entran por una puerta o ventana mal cerrada o fácil de forzar. Es lo primero que busca quien quiere entrar." },
    { id: 2, text: "¿La entrada, la cochera y el patio quedan bien iluminados de noche?", short: "Exterior iluminado de noche", services: ["consultoria"], riesgo: "Las zonas oscuras permiten acercarse a la casa sin ser visto. Una buena luz es de las medidas más sencillas y efectivas." },
    { id: 3, text: "¿Tienes cámaras o alarma y comprobaste este mes que funcionan? (Si no tienes, responde No.)", short: "Cámaras o alarma funcionando", services: ["tecnologia"], riesgo: "Muchas cámaras y alarmas dejan de funcionar sin que nadie lo note. Si no sirven, no avisan a tiempo ni dejan prueba de lo que pasó." },
    { id: 4, text: "¿Sabes con certeza quién tiene copia de las llaves o las claves de acceso de tu casa?", short: "Control de llaves y claves", services: ["consultoria"], riesgo: "Una copia olvidada con alguien que ya no debería tenerla es una entrada abierta. Cuando no hay certeza, conviene cambiar cerraduras y claves." },
    { id: 5, text: "¿Todos en casa saben qué hacer si llaman para extorsionar, amenazar o decir que un familiar está en peligro?", short: "Saber qué hacer ante extorsión o engaños", services: ["protocolos"], riesgo: "Estas llamadas buscan asustar para que alguien pague o dé información en minutos. Una familia que ya sabe qué hacer cuelga, verifica y no cae." },
    { id: 6, text: "¿En tu familia evitan publicar en redes sociales cuando salen de viaje, su ubicación o fotos que muestren lo que hay en casa?", short: "Cuidado con lo que se publica en redes", services: ["protocolos"], riesgo: "Avisar en redes que la casa está sola, o mostrar rutinas y objetos de valor, le da a un extraño la información que necesita." },
    { id: 7, text: "¿Verificas quiénes son las personas que entran a trabajar a tu casa, como personal doméstico, técnicos o repartidores?", short: "Verificar a quien entra a trabajar", services: ["protocolos"], riesgo: "Muchos robos y engaños empiezan con alguien que entró como técnico, repartidor o empleado sin que nadie comprobara quién era." },
    { id: 8, text: "¿Tu familia tiene acordado qué hacer y dónde reunirse si hay un sismo o un incendio?", short: "Plan familiar ante sismo o incendio", services: ["capacitacion"], riesgo: "Sin un plan, cada quien reacciona distinto y se pierde tiempo buscando a los demás. Acordarlo antes evita lesiones y angustia." },
    { id: 9, text: "¿Tienes en casa un extintor vigente y al menos un detector de humo que funcione?", short: "Extintor y detector de humo", services: ["capacitacion"], riesgo: "Casi todos los incendios en casa empiezan pequeños. Un extintor a la mano y un detector que avise a tiempo hacen la diferencia." },
    { id: 10, text: "¿Revisaron tu instalación de gas (tanque, mangueras y conexiones) en el último año y todos saben cerrar la llave de paso?", short: "Instalación de gas revisada", services: ["consultoria"], riesgo: "Una fuga de gas puede causar una explosión o una intoxicación. Las mangueras y los reguladores se desgastan aunque no se note." },
  ],
  niveles: {
    bajo: "Tu casa tiene lo básico en orden. Mantén al día cerraduras, cámaras, extintor y gas, y repasa el plan con tu familia al menos una vez al año.",
    medio: "Tienes una base, pero los puntos señalados le facilitan el trabajo a un ladrón o pueden agravar una emergencia. El plan te dice qué atender primero.",
    alto: "Hay varios puntos sin atender en accesos, hábitos de la familia y preparación ante emergencias. Conviene revisarlo con un especialista.",
  },
  perfil: {
    titulo: "Sobre tu casa",
    ayuda: "Para adaptar las recomendaciones a tu tipo de vivienda.",
    campos: [
      {
        id: "vivienda", label: "Tipo de vivienda", corto: "Vivienda", required: true,
        options: [
          { id: "sola", label: "Casa sola" },
          { id: "privada", label: "Casa en fraccionamiento o privada" },
          { id: "departamento", label: "Departamento" },
        ],
      },
      {
        id: "habitantes", label: "Personas que viven ahí", corto: "Habitantes", required: true,
        options: [
          { id: "1-2", label: "1 o 2 personas" },
          { id: "3-5", label: "3 a 5 personas" },
          { id: "6+", label: "6 o más personas" },
        ],
      },
      CAMPO_ESTADO,
    ],
  },
  mapa: { titulo: "Marca tu casa", ayuda: "señala accesos, zonas oscuras y puntos que te preocupan" },
  contacto: { campo: "Colonia o fraccionamiento (opcional)", etiquetaNota: "Colonia o fraccionamiento" },
  pdf: {
    titulo: "DIAGNÓSTICO BÁSICO DE SEGURIDAD EN CASA",
    paraQuien: "Hogar participante",
    revisar: "Anota lo que ya resolviste y revísalo al menos una vez al año o cuando cambien las personas que viven o trabajan en casa.",
    mantener: "Mantén al día cerraduras, cámaras, extintor y gas, y repasa el plan con tu familia al menos una vez al año.",
  },
  whatsapp: "hice el diagnóstico básico de mi casa",
};

const EVENTO: ConfigDiagnostico = {
  id: "evento",
  etiqueta: "Un evento masivo",
  detalle: "Conciertos, ferias, eventos deportivos o privados",
  nombre: "Evento masivo",
  sujeto: "tu evento",
  preguntas: [
    { id: 1, text: "¿Hay una persona responsable de la seguridad del evento, con autoridad para tomar decisiones e incluso detenerlo?", short: "Responsable de seguridad con autoridad", services: ["consultoria"], riesgo: "Si nadie tiene la última palabra, las decisiones urgentes se retrasan. En una multitud, unos minutos de duda bastan para que un incidente crezca." },
    { id: 2, text: "¿Calculaste cuántas personas caben de forma segura en el lugar y tienes cómo evitar que entren más?", short: "Aforo calculado y controlado", services: ["analisis"], riesgo: "El sobrecupo es de las causas más comunes de tragedias en eventos: impide salir, respirar y atender a quien lo necesita." },
    { id: 3, text: "¿Las salidas de emergencia alcanzan para el número de asistentes, tienen señales y van a estar libres todo el evento?", short: "Salidas de emergencia suficientes y libres", services: ["gestion"], riesgo: "Una salida con candado, tapada por un puesto o sin señal puede atrapar a cientos de personas en segundos." },
    { id: 4, text: "¿Habrá control en las entradas, con revisión de boletos y de objetos prohibidos, y personal suficiente para hacerlo?", short: "Control de accesos y revisión", services: ["protocolos"], riesgo: "Sin filtros entran objetos peligrosos y personas sin boleto, y las filas se vuelven aglomeraciones difíciles de controlar." },
    { id: 5, text: "¿Tienes por escrito qué hacer si hay un incendio, un sismo, una estampida, una riña o mal clima?", short: "Plan por escrito ante emergencias", services: ["gestion"], riesgo: "Improvisar frente a una multitud asustada casi nunca funciona. Un plan define quién decide, por dónde se sale y qué se le dice al público." },
    { id: 6, text: "¿Habrá servicio médico o ambulancia en el lugar durante todo el evento?", short: "Servicio médico en el lugar", services: ["gestion"], riesgo: "En una concentración grande siempre hay desmayos, caídas o emergencias médicas. Sin atención en el lugar, la ayuda tarda demasiado en llegar entre la gente." },
    { id: 7, text: "¿Ya avisaste a Protección Civil y a las autoridades locales, y tienes los permisos que te pidieron?", short: "Aviso y permisos con las autoridades", services: ["consultoria"], riesgo: "Sin permisos, la autoridad puede suspender el evento el mismo día. Además, bomberos, policía y tránsito responden mejor cuando ya conocen el evento." },
    { id: 8, text: "¿El personal del evento (seguridad, acomodadores, voluntarios) sabe qué le toca hacer en una emergencia y recibió una explicación previa?", short: "Personal con funciones claras", services: ["capacitacion"], riesgo: "El público sigue lo que hace el personal. Si el personal no sabe qué hacer, una evacuación se vuelve desorden." },
    { id: 9, text: "¿Puedes comunicarte con todo tu equipo por radio y dar indicaciones al público por sonido, aunque falle el celular?", short: "Comunicación con el equipo y el público", services: ["protocolos"], riesgo: "En eventos grandes la red celular se satura. Sin radios ni sonido no hay manera de coordinar al equipo ni de guiar a la gente." },
    { id: 10, text: "¿Revisaste que escenarios, gradas, carpas y conexiones eléctricas temporales estén bien montados y que haya extintores a la mano?", short: "Instalaciones temporales y extintores revisados", services: ["gestion"], riesgo: "Las estructuras temporales y las conexiones eléctricas improvisadas son causa frecuente de colapsos e incendios en eventos." },
  ],
  niveles: {
    bajo: "Tu evento tiene lo básico previsto. Repasa el plan con tu equipo antes de abrir puertas y verifica salidas, accesos y comunicación el mismo día.",
    medio: "Tienes una base, pero los puntos señalados pueden convertir un incidente menor en una emergencia con mucha gente. El plan te dice qué atender primero.",
    alto: "Hay varios puntos sin resolver en aforo, salidas, plan de emergencias y coordinación. Conviene revisarlo con un especialista antes de la fecha.",
  },
  perfil: {
    titulo: "Sobre tu evento",
    ayuda: "Para adaptar las recomendaciones al tipo y tamaño del evento.",
    campos: [
      {
        id: "evento", label: "Tipo de evento", corto: "Evento", required: true,
        options: [
          { id: "concierto", label: "Concierto o festival" },
          { id: "deportivo", label: "Evento deportivo" },
          { id: "feria", label: "Feria o exposición" },
          { id: "civico", label: "Religioso o cívico" },
          { id: "privado", label: "Corporativo o privado" },
        ],
      },
      {
        id: "asistentes", label: "Asistentes esperados", corto: "Asistentes", required: true,
        options: [
          { id: "250", label: "Hasta 250 personas" },
          { id: "1000", label: "251 a 1,000 personas" },
          { id: "5000", label: "1,001 a 5,000 personas" },
          { id: "20000", label: "5,001 a 20,000 personas" },
          { id: "20000+", label: "Más de 20,000 personas" },
        ],
      },
      {
        id: "lugar", label: "Lugar", corto: "Lugar", required: true,
        options: [
          { id: "abierto", label: "Al aire libre" },
          { id: "cerrado", label: "Lugar cerrado (salón, auditorio, arena)" },
          { id: "mixto", label: "Mixto (áreas abiertas y cerradas)" },
        ],
      },
      CAMPO_ESTADO,
      {
        id: "cuando", label: "¿Cuándo es?", corto: "Fecha", required: false, inicial: "ns",
        options: [
          { id: "ns", label: "Aún sin fecha" },
          { id: "1m", label: "En menos de 1 mes" },
          { id: "3m", label: "En 1 a 3 meses" },
          { id: "3m+", label: "En más de 3 meses" },
        ],
      },
    ],
  },
  mapa: { titulo: "Marca el lugar del evento", ayuda: "señala entradas, salidas y zonas que te preocupan" },
  contacto: { campo: "Nombre del evento u organizador (opcional)", etiquetaNota: "Evento u organizador" },
  pdf: {
    titulo: "DIAGNÓSTICO BÁSICO DE SEGURIDAD PARA EVENTOS",
    paraQuien: "Evento participante",
    revisar: "Repasa todo con tu equipo antes del evento y vuelve a verificarlo el mismo día, antes de abrir puertas.",
    mantener: "Repasa el plan con tu equipo antes de abrir puertas y verifica salidas, accesos y comunicación el mismo día.",
  },
  whatsapp: "hice el diagnóstico básico de mi evento",
};

export const DIAGNOSTICOS: Record<TipoDiagnostico, ConfigDiagnostico> = { negocio: NEGOCIO, casa: CASA, evento: EVENTO };

/** Valores iniciales del último paso (campos opcionales con su valor por defecto). */
export function perfilInicial(tipo: TipoDiagnostico): Record<string, string> {
  return Object.fromEntries(DIAGNOSTICOS[tipo].perfil.campos.map((c) => [c.id, c.inicial ?? ""]));
}

/** Datos del último paso ya legibles: [etiqueta corta, valor]. Omite los opcionales sin responder. */
export function datosPerfil(tipo: TipoDiagnostico, valores: Record<string, string>): [string, string][] {
  return DIAGNOSTICOS[tipo].perfil.campos.flatMap((c): [string, string][] => {
    const v = valores[c.id];
    if (!v || v === c.inicial) return [];
    const label = c.options.find((o) => o.id === v)?.label;
    return label ? [[c.corto, label]] : [];
  });
}

/** Cierto cuando todos los campos obligatorios del último paso tienen una opción válida. */
export function perfilCompleto(tipo: TipoDiagnostico, valores: Record<string, string>): boolean {
  return DIAGNOSTICOS[tipo].perfil.campos.every((c) => !c.required || c.options.some((o) => o.id === valores[c.id]));
}
