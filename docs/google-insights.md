# Conectar Search Console y Google Analytics al panel

La sección **Tu público en Google** del panel (`/app`, solo administradores) muestra:

- búsquedas con las que te encuentran en Google;
- clics, impresiones, CTR y posición media, comparados con el periodo anterior;
- oportunidades: búsquedas donde apareces seguido pero casi no te dan clic;
- visitantes, de dónde llegan, ciudad, dispositivo, páginas de entrada y acciones (WhatsApp, chat, formularios, diagnóstico).

Los datos los consulta la función `google-insights` de Supabase con una **cuenta de servicio de Google de solo lectura**. La llave vive únicamente en los secrets de Supabase; nunca pasa por el navegador ni por el repositorio.

## 1. Crear la cuenta de servicio (una sola vez)

Hazlo con el Gmail que es dueño de la propiedad de Google Analytics.

1. Entra a <https://console.cloud.google.com> y crea un proyecto (por ejemplo `stratec-panel`).
2. **APIs y servicios → Biblioteca**: habilita **Google Search Console API** y **Google Analytics Data API**.
3. **IAM y administración → Cuentas de servicio → Crear cuenta de servicio**.
   - Nombre: `panel-stratec`. No le asignes roles del proyecto: no los necesita.
   - Copia su correo (termina en `@…iam.gserviceaccount.com`). Lo usarás en los pasos 2 y 3.
4. Dentro de la cuenta de servicio: **Claves → Agregar clave → Crear clave nueva → JSON**. Se descarga un archivo `.json`.
   - Ese archivo es una contraseña: no lo subas al repositorio ni lo mandes por chat o correo.

## 2. Darle acceso a Search Console

1. <https://search.google.com/search-console> → elige la propiedad de stratecsecurity.com.
2. **Configuración → Usuarios y permisos → Agregar usuario**.
3. Pega el correo de la cuenta de servicio con permiso **Restringido** (solo lectura).
4. Anota cómo se llama la propiedad:
   - si es de **dominio**: `sc-domain:stratecsecurity.com`;
   - si es de **prefijo de URL**: la URL exacta, por ejemplo `https://www.stratecsecurity.com/`.

## 3. Darle acceso a Google Analytics

1. <https://analytics.google.com> → **Administrar** (engrane) → propiedad del sitio.
2. **Gestión del acceso a la propiedad → + → Agregar usuarios**.
3. Pega el correo de la cuenta de servicio con rol **Lector**. Puedes desmarcar "Notificar por correo".
4. En **Detalles de la propiedad** copia el **ID de la propiedad**: es un número (por ejemplo `512345678`), **no** el `G-…`.

## 4. Guardar los datos en Supabase

En Supabase → **Edge Functions → Secrets**, agrega:

| Nombre | Valor |
|---|---|
| `GOOGLE_SA_KEY` | El contenido **completo** del archivo `.json` (ábrelo con el Bloc de notas, selecciona todo y pégalo). |
| `GSC_SITE_URL` | La propiedad del paso 2.4. |
| `GA4_PROPERTY_ID` | El número del paso 3.4. |

Después guarda el `.json` en un lugar seguro o bórralo de Descargas.

## 5. Publicar la función

Supabase → **Edge Functions → Deploy a new function → Via Editor**:

- Nombre: `google-insights`.
- Archivos: `supabase/functions/google-insights/index.ts` y `logica.ts`.
- Deja **Verify JWT** activado (exige sesión; la función además verifica que seas admin).

Abre el panel: la sección aparece al final del tablero.

## Si algo falla

- **"La cuenta de servicio no tiene acceso"**: falta el paso 2 o 3, o se agregó otro correo.
- **"No se encontró la propiedad"**: revisa `GSC_SITE_URL` (con `sc-domain:` o la URL con `/` final) o `GA4_PROPERTY_ID` (solo el número).
- **"Falta conectar esta fuente"**: falta alguno de los secrets.
- Search Console tarda unos 3 días en tener datos completos y Analytics, 1 día. Por eso los periodos terminan antes de hoy.
- Los datos se guardan 30 minutos en la función; el botón de actualizar los vuelve a pedir a Google.
