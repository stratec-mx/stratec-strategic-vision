# Plantillas de WhatsApp para aprobación de Meta · STRATEC Security

Preparado el 10 de noviembre de 2026. Las plantillas son los únicos mensajes con los que **STRATEC puede escribir primero** a un cliente por la API de WhatsApp (o volver a escribirle después de 24 horas sin respuesta). Dentro de una conversación que el cliente abrió, se puede responder con texto libre.

## Antes de crearlas
1. **Cuenta de WhatsApp Business en Meta (API).** Se crean en *WhatsApp Manager*, dentro de tu portafolio comercial de Meta (business.facebook.com). Si tu número (220 648 8688) hoy funciona en la app WhatsApp Business, Meta permite conectarlo a la API sin dejar de usar la app ("coexistencia"); confírmalo al conectarlo.
2. **Consentimiento.** Solo envía plantillas a quien te dio su número y aceptó que lo contacten. En el sitio ya quedó así: la casilla del diagnóstico dice "me contacte por teléfono o WhatsApp" y el aviso de privacidad incluye esa finalidad.
3. **Las plantillas se envían por la API, no desde la app.** Una vez aprobadas, falta conectar el envío (por ejemplo, un botón "Enviar WhatsApp" en el aviso de Telegram o en Leads del panel).

## Cómo crear cada una
WhatsApp Manager → **Plantillas de mensajes** → **Crear plantilla**:
- **Categoría:** la que indica cada plantilla (todas son *Utilidad* salvo que se diga otra cosa).
- **Nombre:** tal cual (minúsculas y guiones bajos).
- **Idioma:** Español (MEX).
- **Cuerpo:** copia el texto; las variables se escriben `{{1}}`, `{{2}}`…
- **Muestras:** Meta pide un ejemplo por variable; usa los de la tabla.
- **Pie de página** (opcional): `STRATEC Security · Consultoría en seguridad`
- **Botones:** tipo *Respuesta rápida* con los textos indicados (máx. 25 caracteres).

Reglas que evitan rechazos: no empezar ni terminar el cuerpo con una variable, no poner dos variables juntas, no usar acortadores de enlaces, y no mezclar promociones en una plantilla de *Utilidad* (Meta la reclasifica como *Marketing*, que cuesta más).

---

## 1. `diagnostico_asesor_solicitado` · Utilidad
**Cuándo:** el cliente hizo el diagnóstico y marcó "Deseo que un asesor me contacte".

```
Hola {{1}}, te escribe {{2}} de STRATEC Security. Recibimos tu diagnóstico de seguridad hecho en stratecsecurity.com, con resultado de {{3}} de 10, y pediste que un asesor te contactara.

¿Qué horario te acomoda para revisar juntos los puntos por atender?
```

| Variable | Qué va | Muestra |
|---|---|---|
| `{{1}}` | Nombre del cliente | Laura |
| `{{2}}` | Nombre de quien escribe | Carlos |
| `{{3}}` | Resultado | 5.5 |

Botones: `Hoy por la tarde` · `Mañana` · `Prefiero por correo`

## 2. `contacto_web_recibido` · Utilidad
**Cuándo:** llegó un mensaje por el formulario de contacto con teléfono.

```
Hola {{1}}, recibimos tu mensaje en stratecsecurity.com sobre {{2}}. Te escribimos por aquí para darle seguimiento.

¿Prefieres que te llamemos o que sigamos por este chat?
```

| Variable | Qué va | Muestra |
|---|---|---|
| `{{1}}` | Nombre | Jorge |
| `{{2}}` | Servicio de interés | Programa Interno de Protección Civil |

Botones: `Llámenme` · `Seguir por chat`

## 3. `cita_confirmada` · Utilidad
**Cuándo:** se agenda una reunión.

```
Hola {{1}}, tu cita con STRATEC Security quedó confirmada para el {{2}} a las {{3}} horas.

Modalidad: {{4}}.

Si necesitas cambiarla, usa los botones o responde a este mensaje.
```

| Variable | Qué va | Muestra |
|---|---|---|
| `{{1}}` | Nombre | Laura |
| `{{2}}` | Fecha | martes 18 de noviembre |
| `{{3}}` | Hora | 11:00 |
| `{{4}}` | Modalidad | videollamada (te enviaremos el enlace por correo) |

Botones: `Confirmo asistencia` · `Necesito cambiarla`

## 4. `cita_recordatorio` · Utilidad
**Cuándo:** un día antes de la cita.

```
Hola {{1}}, te recordamos tu cita con STRATEC Security mañana {{2}} a las {{3}} horas. ¿Sigue en pie?
```

| Variable | Qué va | Muestra |
|---|---|---|
| `{{1}}` | Nombre | Laura |
| `{{2}}` | Fecha | martes 18 de noviembre |
| `{{3}}` | Hora | 11:00 |

Botones: `Sí, ahí estaré` · `Necesito cambiarla`

## 5. `cotizacion_enviada` · Utilidad
**Cuándo:** se envió una cotización por correo.

```
Hola {{1}}, te enviamos la cotización {{2}} al correo {{3}}. Está vigente hasta el {{4}}.

Si tienes dudas sobre el alcance o los entregables, responde a este mensaje.
```

| Variable | Qué va | Muestra |
|---|---|---|
| `{{1}}` | Nombre | Laura |
| `{{2}}` | Folio | COT-2026-014 |
| `{{3}}` | Correo | laura@ejemplo.com |
| `{{4}}` | Vigencia | 10 de diciembre de 2026 |

Botones: `Tengo dudas` · `La reviso y les aviso`

---

## No recomendadas por ahora
- **Recordatorio a quien descargó el diagnóstico sin pedir contacto.** Sería *Marketing* y requiere que la persona haya aceptado recibir mensajes de ese tipo; hoy el formulario no lo pide.
- **Promociones o boletines.** Misma razón.

## Costo
Meta cobra por mensaje de plantilla entregado, con tarifa por país y categoría; *Utilidad* cuesta varias veces menos que *Marketing*. Las tarifas para México que publican los proveedores no coinciden entre sí, así que consulta la tabla oficial de Meta antes de presupuestar: https://developers.facebook.com/docs/whatsapp/pricing
