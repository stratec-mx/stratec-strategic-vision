# Cómo activar los fondos de Google y Esri en Inmuebles y plano

Los botones de fondo del módulo ya están programados: **Mapa** (OpenStreetMap) siempre aparece; **Google satélite** y **Google calles** aparecen si el despliegue tiene la llave de Google, y **Satélite Esri** si tiene la de Esri. Esta guía es para el titular: **la llave nunca se pega en un chat ni en el repositorio**.

Recordatorio de la licencia (Documento 04 §11):

- la imagen de Esri es **solo para ver en pantalla**;
- la lámina en PDF para el cliente va con OpenStreetMap;
- la atribución de Esri aparece sola en el mapa y no se debe ocultar.

## 1. Crear la cuenta (gratis)

1. Entra a **location.arcgis.com** y crea una cuenta de **ArcGIS Location Platform**. El nivel gratuito alcanza: 2 millones de teselas al mes.
2. Si te pide tarjeta, revisa que el plan quede en el nivel gratuito.

## 2. Crear la llave

1. En el panel de la cuenta, ve a **Developer credentials** y luego a **API key credentials**, y crea una nueva.
2. Dale **solo** el permiso de mapas base: *Location services → Basemaps* (`premium:user:basemaps`). No le des ningún otro permiso.
3. En **Referrers** (sitios permitidos) agrega `https://www.stratecsecurity.com`. Así la llave no sirve desde otros sitios.
4. Genera la llave y cópiala. Solo se muestra una vez.

## 3. Ponerla en Vercel

1. En Vercel, abre el proyecto **stratec-strategic-vision** y ve a **Settings** y luego a **Environment Variables**.
2. Agrega la variable:
   - **Key:** `VITE_ARCGIS_API_KEY`
   - **Value:** la llave que copiaste
   - **Environments:** Production. Si quieres probarla en las vistas previas, marca también Preview.
3. Guarda.
4. Ve a **Deployments**, abre el último de producción y elige **Redeploy**. La llave entra al sitio al reconstruirse.

## 4. Probar

1. Abre **Inmuebles y sedes** en el panel y pulsa **Satélite**.
2. Debe verse la imagen y, abajo a la derecha, el crédito *Source: Esri, Vantor, Earthstar Geographics, and the GIS User Community*.

Si aparece el aviso "La llave de Esri no es válida o no tiene permiso de mapas base", revisa el paso 2.

## Notas

- Como la llave va dentro de la página, quien use el panel podría verla. Por eso solo debe tener el permiso de mapas base y estar limitada a `www.stratecsecurity.com`. Esri lo recomienda así para las llaves de mapas.
- En la cuenta de Esri conviene activar un aviso de uso, por si algún mes se acerca al límite gratuito.
- Para quitar el satélite, borra la variable en Vercel y vuelve a desplegar.

---

# Google (satélite y calles con negocios)

**Decisión del titular (25-nov-2026):** Google se usa como fondo en pantalla y para delinear el contorno, asumiendo el riesgo de sus condiciones, que prohíben calcar su imagen y pueden llevar a suspender la cuenta. **La lámina en PDF no usa Google:** va con OpenStreetMap.

## 1. Proyecto y API

1. Entra a **console.cloud.google.com** con la cuenta que administrará el gasto.
2. Crea un proyecto, por ejemplo "STRATEC mapas".
3. En **APIs y servicios** y luego **Biblioteca**, busca **Map Tiles API** y actívala.
4. Google pide una **cuenta de facturación** con tarjeta. Tiene un crédito gratuito mensual. Pon un **presupuesto con alerta**, por ejemplo de 10 USD, en *Facturación* y luego *Presupuestos y alertas*.

## 2. La llave

1. En **APIs y servicios**, entra a **Credenciales**, luego **Crear credenciales** y elige **Clave de API**.
2. Edita la llave:
   - **Restricción de aplicaciones:** *Sitios web*, con `https://www.stratecsecurity.com/*`.
   - **Restricción de API:** solo **Map Tiles API**.
3. Copia la llave. Nunca la pegues en un chat.

## 3. Ponerla en Vercel

1. En el proyecto **stratec-strategic-vision**, ve a **Settings** y luego a **Environment Variables**.
2. Agrega la variable:
   - **Key:** `VITE_GOOGLE_MAPS_API_KEY`
   - **Value:** la llave
   - **Environments:** Production
3. Ve a **Deployments** y vuelve a desplegar el último (**Redeploy**).

## 4. Probar

1. En **Inmuebles y sedes** pulsa **Google satélite** o **Google calles**.
2. Abajo a la derecha debe verse **Google Maps** con el aviso de derechos. No se debe tapar.

Si aparece "La llave de Google no es válida o no tiene activada la Map Tiles API", revisa los pasos 1 y 2.
