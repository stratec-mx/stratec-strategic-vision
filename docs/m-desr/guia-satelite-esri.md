# Cómo activar el fondo satelital (Esri) en Inmuebles y plano

El botón **Mapa / Satélite** del módulo ya está programado. Se activa cuando el despliegue tiene una llave de Esri. Esta guía es para el titular: **la llave nunca se pega en un chat ni en el repositorio**.

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
