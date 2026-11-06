# WhatsApp Business — Agente de IA para STRATEC

Número: **+52 220 648 8688** · Sitio: https://www.stratecsecurity.com
Objetivo: un agente de IA atiende y califica a los prospectos. Tú supervisas y entras solo cuando hace falta.

> Los datos entre `[corchetes]` debes confirmarlos (horario, correo, etc.) antes de publicarlos.

---

## 1. Qué ruta elegir

| Ruta | Costo | IA real | Supervisión | Cuándo usarla |
|---|---|---|---|---|
| **A. App WhatsApp Business** (solo respuestas automáticas) | Gratis | No | Tú desde el celular | Hoy mismo, como base |
| **B. "IA de la empresa" de Meta** dentro de la app | Gratis o bajo costo | Sí, básica | Tú desde el celular | Solo si te aparece la opción en tu cuenta (Meta la está liberando por país) |
| **C. Plataforma con coexistencia** (Respond.io, Kommo, Wati, Leadsales, etc.) | Suscripción mensual + mensajes de Meta | Sí, con tu prompt | Bandeja compartida en web + celular | **Recomendada.** Sigues usando la app en tu celular y el agente responde en paralelo |
| **D. Bot propio** (API de WhatsApp Cloud → Supabase → Claude) | Solo uso de API | Sí, total control | Panel propio + Telegram | Más adelante; puedo construirlo sobre la infraestructura que ya tienes |

**Recomendación:** haz la **A hoy** (15 min) y, si quieres IA esta semana, la **C**. Revisa la **B** primero porque podría salirte gratis.

Notas importantes:
- **Coexistencia**: permite conectar tu número a la API **sin perder la app** en tu celular. Antes de pagar, confirma que el proveedor la soporta.
- Meta permite asistentes de IA **enfocados en tu negocio** (atención, ventas, citas). Los chatbots de "uso general" no están permitidos. El prompt de abajo ya está limitado a STRATEC.
- Responder a un cliente que te escribió primero (ventana de 24 h) no tiene costo de Meta. Iniciar tú la conversación requiere plantillas aprobadas, que sí tienen costo.

---

## 2. Configuración en la app WhatsApp Business (Ruta A)

Ruta en la app: **Configuración → Herramientas para la empresa**.

### 2.1 Perfil de empresa
- **Nombre**: STRATEC — Consultoría Estratégica de Seguridad
- **Categoría**: Servicios profesionales / Consultoría
- **Descripción**:
  > Consultoría en seguridad, protección civil, gestión de riesgos, capacitación e integración tecnológica para empresas, instituciones y gobierno. Diagnóstico de vulnerabilidad gratuito en nuestro sitio.
- **Dirección**: [Cuernavaca, Morelos — confirmar si se publica dirección]
- **Horario**: [Lunes a viernes 9:00–18:00]
- **Correo**: [contacto@stratecsecurity.com — confirmar]
- **Sitio web**: https://www.stratecsecurity.com y https://www.stratecsecurity.com/diagnostico

### 2.2 Mensaje de bienvenida
*Herramientas → Mensaje de bienvenida → Activar → Enviar a: Todos*

> Hola, gracias por escribir a **STRATEC** 🛡️
> Somos consultores en seguridad, protección civil y gestión de riesgos.
>
> Para atenderte mejor, cuéntanos:
> 1️⃣ Tu nombre y empresa/institución
> 2️⃣ Qué necesitas (diagnóstico, protección civil, capacitación, videovigilancia u otro)
> 3️⃣ Ciudad o municipio
>
> ¿Quieres saber qué tan vulnerable es tu inmueble? Haz el diagnóstico gratis en 3 minutos:
> https://www.stratecsecurity.com/diagnostico

### 2.3 Mensaje de ausencia
*Herramientas → Mensaje de ausencia → Fuera del horario comercial*

> Gracias por escribir a **STRATEC**. En este momento estamos fuera de horario [L–V 9:00–18:00], pero tu mensaje ya quedó registrado y te respondemos en cuanto iniciemos actividades.
>
> Mientras tanto, puedes hacer tu diagnóstico de vulnerabilidad gratis: https://www.stratecsecurity.com/diagnostico
>
> ⚠️ Si se trata de una emergencia, llama al **911**.

### 2.4 Etiquetas (para supervisar)
Crea estas etiquetas: `Nuevo` · `Calificado` · `Cotización` · `Cita agendada` · `Requiere humano` · `Cliente` · `Descartado`.

### 2.5 Respuestas rápidas
*Herramientas → Respuestas rápidas*. Escribe `/` en el chat para usarlas.

**/servicios**
> Estas son nuestras áreas de especialización:
> • **Consultoría en Seguridad**: diagnósticos, auditorías y estrategias de protección.
> • **Protección Civil y Gestión de Riesgos**: Programa Interno, brigadas, simulacros y continuidad.
> • **Capacitación Especializada**: formación operativa en seguridad y protección civil.
> • **Integración Tecnológica**: videovigilancia, monitoreo vehicular y control de accesos.
> • **Consultoría para Gobierno e Instituciones**: diagnóstico institucional y seguridad urbana.
>
> ¿Cuál se acerca más a lo que necesitas?

**/diagnostico**
> Puedes conocer tu nivel de vulnerabilidad en 3 minutos con nuestro diagnóstico gratuito (basado en ISO 31000). También puedes marcar en el mapa satelital los puntos débiles de tu predio:
> https://www.stratecsecurity.com/diagnostico
> Al terminar, mándanos tu resultado por aquí y lo revisamos contigo.

**/cotizacion**
> Con gusto. No manejamos precios fijos: cada propuesta se diseña según el tamaño del inmueble, el número de personas y los riesgos identificados. Para prepararla necesito:
> 1. Tipo de inmueble (oficina, industria, comercio, escuela, residencia, institución)
> 2. Ubicación
> 3. Superficie aproximada o número de personas
> 4. Qué te preocupa o qué necesitas cumplir
>
> Con eso agendamos una llamada de 20 minutos sin costo.

**/cita**
> Agendemos una llamada de diagnóstico sin costo (20 min). ¿Qué día y horario te acomoda? Atendemos [L–V de 9:00 a 18:00].

**/proteccioncivil**
> Elaboramos e implementamos el **Programa Interno de Protección Civil** conforme a la normatividad federal y estatal, además de formar brigadas (evacuación, primeros auxilios, combate de incendios) y realizar simulacros. ¿Tu inmueble ya cuenta con un programa vigente o partimos desde cero?

**/capacitacion**
> Impartimos capacitación presencial a brigadas, personal de seguridad y mandos. ¿Cuántas personas participarían y en qué tema te interesa: brigadas, seguridad patrimonial o gestión de riesgos?

**/tecnologia**
> Diseñamos e integramos videovigilancia, control de accesos y monitoreo vehicular. Partimos de un análisis de riesgo, así que no vendemos equipo por vender. ¿Qué te interesa proteger y cuántos accesos tiene el inmueble?

**/gobierno**
> Trabajamos con gobiernos e instituciones en diagnóstico institucional, planeación estratégica y seguridad urbana. Por la naturaleza de estos proyectos, lo ideal es una reunión con el área responsable. ¿Me compartes el nombre de la dependencia y un contacto?

**/seguimiento**
> Hola, te escribo para dar seguimiento a tu solicitud con STRATEC. ¿Pudiste revisar la información? Quedo atento a cualquier duda.

**/emergencia**
> Si estás en una situación de riesgo en este momento, llama al **911**. STRATEC hace consultoría y prevención; no damos respuesta de emergencia en sitio. En cuanto estés a salvo, con gusto te ayudamos a evitar que vuelva a ocurrir.

**/cierre**
> Gracias por tu interés en STRATEC. Te comparto nuestro sitio: https://www.stratecsecurity.com. Quedamos a tus órdenes por este medio.

---

## 3. Prompt del agente de IA (Rutas B, C o D)

Copia esto en el campo "Instrucciones", "Prompt" o "Personalidad" de la plataforma.

```
Eres el asistente virtual de STRATEC, consultoría estratégica de seguridad con base en Cuernavaca, Morelos (México). Atiendes por WhatsApp a prospectos y clientes. Tu trabajo: responder dudas, calificar al prospecto y agendar una llamada con un consultor humano.

IDENTIDAD Y TONO
- Te presentas como "asistente virtual de STRATEC". Si te preguntan, confirmas que eres una IA y que un consultor revisa las conversaciones.
- Español de México, profesional, cordial y directo. Trato de "usted" con instituciones y gobierno; con particulares, "tú" si el cliente lo usa primero.
- Mensajes cortos: máximo 3 párrafos breves o una lista corta. Un solo emoji como máximo y solo en el saludo.

SERVICIOS (lo único que ofreces)
1. Consultoría en Seguridad: diagnósticos, auditorías y estrategias de protección.
2. Protección Civil y Gestión Integral de Riesgos: Programa Interno de Protección Civil, brigadas, simulacros y planes de continuidad.
3. Capacitación Especializada: brigadas, seguridad y protección civil.
4. Integración Tecnológica: videovigilancia, monitoreo vehicular, control de accesos y proyectos integrales.
5. Consultoría para Gobierno e Instituciones: diagnóstico institucional, planeación estratégica y seguridad urbana.
También existe un análisis de riesgo y estudios específicos. Metodología basada en ISO 31000.
Diagnóstico gratuito en línea: https://www.stratecsecurity.com/diagnostico
Sitio: https://www.stratecsecurity.com

OBJETIVO DE CADA CONVERSACIÓN
Obtén, de forma natural y sin interrogar, estos datos:
1. Nombre
2. Empresa o institución (o si es particular)
3. Ciudad o municipio
4. Servicio de interés y necesidad concreta
5. Tamaño aproximado (personas, superficie o número de inmuebles)
6. Urgencia o fecha límite (por ejemplo, una visita de Protección Civil)
Cuando tengas al menos 1, 3 y 4, propón una llamada de diagnóstico sin costo de 20 minutos y pide día y horario. Horario de atención: [lunes a viernes de 9:00 a 18:00].
Si el cliente no está listo, ofrece el diagnóstico gratuito en línea.

REGLAS ESTRICTAS
- NUNCA des precios, tarifas, rangos ni descuentos. Responde: "Cada propuesta se diseña según el inmueble y los riesgos. Con unos datos te preparamos una propuesta sin compromiso."
- NUNCA prometas resultados, fechas de entrega, certificaciones ni aprobaciones de autoridades.
- NUNCA menciones nombres de clientes, proyectos anteriores ni instituciones con las que trabajamos. Todo es confidencial.
- NUNCA des asesoría legal, ni opiniones sobre casos judiciales, denuncias o conflictos entre personas.
- NUNCA des instrucciones tácticas que puedan usarse para vulnerar la seguridad de un inmueble o de una persona.
- No inventes información. Si no sabes algo: "Lo confirmo con un consultor y te respondo por aquí."
- Responde solo temas relacionados con STRATEC y la seguridad de tu cliente. Cualquier otro tema lo rediriges con amabilidad.
- No pidas datos sensibles (INE, datos bancarios, contraseñas, ubicaciones exactas de personas).

ESCALAR A HUMANO (responde y marca la conversación como "Requiere humano")
- Emergencia en curso → indica de inmediato llamar al 911 y escala.
- El cliente pide hablar con una persona.
- Molestia, queja o tono agresivo.
- Gobierno, dependencias o licitaciones.
- Proyectos grandes: más de un inmueble, más de 100 personas o más de una ciudad.
- Temas legales, judiciales, extorsión, amenazas o secuestro (además del 911 si hay riesgo).
- Ya hay propuesta enviada y el cliente negocia.
- Cualquier duda que no puedas responder con esta información.
Mensaje de escalamiento: "Gracias. Le paso tu caso a un consultor de STRATEC, que te escribe por este mismo chat [hoy / el siguiente día hábil]."

AL CERRAR CADA CONVERSACIÓN
Deja una nota interna (no visible al cliente) con este formato:
RESUMEN | Nombre: … | Empresa: … | Ciudad: … | Servicio: … | Tamaño: … | Urgencia: … | Siguiente paso: …
```

---

## 4. Cómo supervisar sin estar encima

**Configuración en la plataforma (Ruta C):**
1. Conecta el número con **coexistencia** para que la app siga en tu celular.
2. Activa el agente de IA con el prompt de la sección 3 y sube como "conocimiento":
   - el texto de la sección 2.5;
   - la URL del sitio.
3. Regla de **traspaso a humano**: cuando el agente marque "Requiere humano", que te asigne la conversación y te mande una notificación al celular.
4. Regla de **pausa**: cuando tú escribas en una conversación, la IA se detiene en ese chat. La mayoría de las plataformas lo hacen por defecto; verifícalo.
5. **Horario**: deja la IA activa las 24 h. Fuera de horario, que solo califique y agende, sin prometer respuesta inmediata.

**Tu rutina (10–15 min al día):**
- Mañana: revisa la etiqueta `Requiere humano` y responde primero esas conversaciones.
- Tarde: lee 3–5 conversaciones al azar. Si la IA respondió mal, agrega la corrección al prompt como regla nueva.
- Semanal: cuenta `Nuevo`, `Calificado` y `Cita agendada` para ver cuántos prospectos se convierten.

**Prueba antes de abrirlo a clientes.** Desde otro número, escribe estos casos y revisa qué responde:
- "¿Cuánto cuesta un programa de protección civil?" → no debe dar precio.
- "¿Con qué empresas han trabajado?" → no debe dar nombres.
- "Me están extorsionando por teléfono" → debe indicar el 911 y escalar.
- "Somos el municipio de X y queremos un diagnóstico" → debe escalar.
- "¿Me ayudas con mi tarea de historia?" → debe redirigir con amabilidad.

---

## 5. Integración con el sitio (ya hecho)

- El botón de WhatsApp del sitio y el diagnóstico apuntan a `wa.me/522206488688`.
- El diagnóstico (`/diagnostico`) envía al cliente a WhatsApp con este texto: *"Hola STRATEC, hice el diagnóstico de vulnerabilidad (nivel: …, score …/10) y quiero agendar mi evaluación."* Agrega al prompt esta regla: "Si el mensaje dice 'hice el diagnóstico de vulnerabilidad', felicita al cliente, menciona su nivel, pide nombre, ciudad y tipo de inmueble, y propón la llamada." Etiqueta esas conversaciones como `Calificado`.
- El botón flotante del sitio envía: *"Hola, me interesa conocer más sobre los servicios de consultoría de STRATEC Security."*
