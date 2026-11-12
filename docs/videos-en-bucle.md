# Videos en bucle para los encabezados

Guía para producir, preparar y colocar los videos de fondo del sitio público.

**Estado actual:** el componente ya existe (`src/components/media/LoopVideo.tsx`), pero **todavía no está puesto en ninguna página y aún no hay clips**. Esta guía sirve para producirlos y dejarlos listos.

## 1. Para qué sirven y para qué no

Un video en bucle es un fondo decorativo: da ambiente al encabezado de una página mientras el visitante lee el título. Nada más.

- **Un video nunca sustituye un mapa, un plano o una gráfica que funcionan.** Si la página necesita mostrar un mapa de riesgos, un plano de evacuación o una gráfica con datos, se usa el elemento real, que el visitante puede leer y usar. El video solo acompaña.
- **El panel interno (`/app`) no lleva videos.** Es una herramienta de trabajo: ahí importan la rapidez y la claridad.
- El video no lleva información. Todo lo que el visitante debe saber va en texto, encima del video.
- Un video por página, solo en el encabezado. No se usan videos como relleno entre secciones.

## 2. Lo que el componente hace solo

No hay que programar nada de esto; ya viene incluido:

- Muestra de inmediato una imagen fija (el **póster**) y aparta el espacio exacto, así la página no "brinca" cuando llega el video.
- Pide el video hasta que la página terminó de cargar y el encabezado está cerca de la pantalla.
- Lo pausa cuando el visitante baja y deja de verlo; lo reanuda cuando regresa.
- Va sin sonido, sin controles y se repite solo.
- **No descarga el video** si el visitante tiene activado "reducir movimiento" o el ahorro de datos en su equipo. Tampoco insiste si el video falla. En esos casos se queda el póster, por eso el póster debe verse bien por sí solo.
- Los lectores de pantalla y el teclado lo ignoran: es decoración.
- En celulares usa una versión más ligera, si se la damos.

## 3. Límites de peso y formato

Estos límites son obligatorios. Un clip más pesado se rechaza y se vuelve a comprimir.

| Archivo | Límite | Notas |
| --- | --- | --- |
| Póster (imagen fija) | hasta **150 KB** | JPG o WebP, 1280 × 720. Es el primer cuadro del video. |
| Clip de escritorio | hasta **2.5 MB** cada archivo | 1280 × 720 (720p) |
| Clip de celular | hasta **1 MB** cada archivo | 720p como máximo |
| Duración | **6 a 10 segundos** | El inicio y el final deben empalmar sin corte visible |
| Sonido | **ninguno** | La pista de audio se elimina, no solo se silencia |
| Formatos | **WebM** y **MP4** | Se entregan los dos: WebM primero, MP4 de respaldo |

Cada clip completo son cinco archivos: póster, WebM, MP4, WebM de celular y MP4 de celular.

## 4. Dónde van los archivos

Todos en la carpeta `public/videos/` (se crea la primera vez). Nombres en minúsculas, sin acentos ni espacios:

```
public/videos/
  home-poster.jpg
  home.webm
  home.mp4
  home-movil.webm
  home-movil.mp4
```

En el sitio, esos archivos se piden como `/videos/home.webm`, `/videos/home-poster.jpg`, etcétera.

Nombres sugeridos para los seis clips: `home`, `consultoria-seguridad`, `proteccion-civil`, `videovigilancia`, `brigadas`, `continuidad`.

## 5. Cómo preparar un clip con ffmpeg

`ffmpeg` es un programa gratuito para convertir video. Los comandos se pegan en la terminal, estando en la carpeta donde está el video original. Cada comando va en una sola línea.

En los ejemplos el video original se llama `original.mp4`, dura 8 segundos y el clip se llama `home`. Cambia `home` por el nombre que toque.

### Paso 1. Hacer que el final empalme con el inicio

Este comando funde el último segundo del video con el primero. El resultado dura un segundo menos que el original y se puede repetir sin que se note el corte.

```
ffmpeg -i original.mp4 -filter_complex "[0:v]fps=30,scale=-2:720,format=yuv420p,split[a][b];[a]trim=start=1,setpts=PTS-STARTPTS[cuerpo];[b]trim=end=1,setpts=PTS-STARTPTS[inicio];[cuerpo][inicio]xfade=transition=fade:duration=1:offset=6,format=yuv420p[v]" -map "[v]" -an -c:v libx264 -crf 14 -preset slow maestro.mp4
```

El único número que cambia según la duración del original es `offset`: **duración del original menos 2**.

| Duración del original | `offset` | Duración del bucle |
| --- | --- | --- |
| 7 s | 5 | 6 s |
| 8 s | 6 | 7 s |
| 9 s | 7 | 8 s |
| 10 s | 8 | 9 s |
| 11 s | 9 | 10 s |

Para saber cuánto dura el original:

```
ffprobe -v error -show_entries format=duration -of csv=p=0 original.mp4
```

El archivo `maestro.mp4` es la copia de trabajo, de alta calidad. **No se sube al sitio**; de ahí salen los demás.

Abre `maestro.mp4` y ponlo a repetir. Si el empalme se nota (un objeto que "salta" o una luz que cambia de golpe), ese clip no sirve para bucle: hay que generar otro con movimiento más parejo.

### Paso 2. Versión de escritorio

WebM:

```
ffmpeg -i maestro.mp4 -an -c:v libvpx-vp9 -b:v 0 -crf 34 -row-mt 1 -pix_fmt yuv420p home.webm
```

MP4:

```
ffmpeg -i maestro.mp4 -an -c:v libx264 -crf 25 -preset slow -profile:v high -pix_fmt yuv420p -movflags +faststart home.mp4
```

### Paso 3. Versión de celular

WebM:

```
ffmpeg -i maestro.mp4 -an -c:v libvpx-vp9 -b:v 0 -crf 40 -row-mt 1 -pix_fmt yuv420p home-movil.webm
```

MP4:

```
ffmpeg -i maestro.mp4 -an -c:v libx264 -crf 30 -preset slow -profile:v main -pix_fmt yuv420p -movflags +faststart home-movil.mp4
```

### Paso 4. Póster

Se toma el primer cuadro del bucle, así el paso de la imagen al video no se nota.

```
ffmpeg -i maestro.mp4 -frames:v 1 -q:v 4 home-poster.jpg
```

### Paso 5. Revisar el peso

Revisa el tamaño de los cinco archivos contra la tabla de la sección 3.

- **Si un video pesa de más:** sube el número de `-crf` de dos en dos y vuelve a generar ese archivo (por ejemplo, de 34 a 36). Número más alto es menos peso y un poco menos de nitidez.
- **Si la versión de celular no baja de 1 MB:** agrega `-vf "scale=-2:540"` antes de `-c:v` para reducir el tamaño de imagen.
- **Si el póster pesa de más:** sube el número de `-q:v` (de 4 a 6, por ejemplo).
- Las escenas con mucho detalle en movimiento (hojas, lluvia, multitudes) pesan más. Las tomas lentas y limpias comprimen mejor.

`-an` es lo que elimina el audio. Va en todos los comandos; no se quita.

## 6. Cómo se coloca en una página

Esto lo hace quien mantiene el sitio. Ejemplo para un encabezado:

```tsx
import { LoopVideo } from "@/components/media/LoopVideo";

<LoopVideo
  poster="/videos/home-poster.jpg"
  webm="/videos/home.webm"
  mp4="/videos/home.mp4"
  mobileWebm="/videos/home-movil.webm"
  mobileMp4="/videos/home-movil.mp4"
  overlay={0.6}
  aspectRatio={null}
  className="min-h-[80vh]"
  contentClassName="flex items-center"
>
  <div className="container-wide py-32">
    <h1>Título de la página</h1>
    <p>Texto de apoyo y botones.</p>
  </div>
</LoopVideo>
```

Opciones del componente:

| Opción | Para qué sirve |
| --- | --- |
| `poster` | Imagen fija. Obligatoria. |
| `webm`, `mp4` | Los dos archivos de escritorio. |
| `mobileWebm`, `mobileMp4` | Los dos archivos de celular. Opcionales: si faltan, el celular usa los de escritorio. |
| `mobileMaxWidth` | Hasta qué ancho de pantalla se usa la versión de celular. Por omisión, 767 pixeles. |
| `aspectRatio` | Proporción que aparta la caja. Por omisión `"16 / 9"`. Con `null`, el alto se define en `className`. |
| `overlay` | Capa oscura para que el texto se lea. `true` o un número de 0 a 1. |
| `className` | Alto y márgenes de la caja. |
| `mediaClassName` | Encuadre de la imagen y el video (por ejemplo `object-top`). |
| `contentClassName` | Acomodo del contenido que va encima. |

Antes de publicar una página con video se revisa, como mínimo:

1. El texto se lee bien encima del video en celular y en escritorio. Si no, se sube `overlay`.
2. Con "reducir movimiento" activado en el equipo, se ve el póster y la página se entiende igual.
3. La página no "brinca" al cargar.
4. Los cinco archivos están dentro de los límites de peso.

## 7. Dirección de arte

Estilo: **sobrio, cinematográfico y realista**. Debe parecer filmado con cámara, no generado.

Sí:

- Escenarios mexicanos creíbles, de preferencia **Cuernavaca y Morelos**: vegetación abundante, luz cálida, construcciones bajas, patios, naves industriales, oficinas reales.
- Luz natural: amanecer, atardecer, interiores con ventana.
- Colores contenidos, sombras en azul marino profundo, acentos cálidos. Que combine con el sitio.
- Movimiento de cámara lento, continuo y en una sola dirección. Sin cortes.
- Personas de espaldas, lejos o desenfocadas, con ropa civil de trabajo.

No, en ningún clip:

- Texto, letreros legibles, subtítulos o marcas de agua.
- Logotipos o marcas reales (ni en ropa, equipos, vehículos o edificios).
- Personas reconocibles: nada de rostros en primer plano.
- Placas de vehículos.
- Armas.
- Patrullas o vehículos de emergencia oficiales.
- Uniformes que parezcan de policía o de ejército. Los chalecos y cascos de seguridad son civiles, lisos y sin insignias.
- Hologramas, pantallas flotantes o interfaces de ciencia ficción.
- Escenas de alarma: humo denso, pánico, daños, sangre. El tono es prevención y calma.

Revisa cada clip cuadro por cuadro antes de aceptarlo. Las herramientas de generación suelen colar letreros con letras deformes, manos raras o logotipos inventados: ese clip se descarta.

## 8. Ficha de producción: seis clips

Indicaciones comunes para generar:

- Formato horizontal 16:9, de 8 a 10 segundos, a 1080p o más (después se reduce a 720p con los comandos de la sección 5).
- Una sola toma, sin cortes, con movimiento parejo de principio a fin. Así el empalme del bucle sale limpio.
- Los textos para generar van en inglés porque la mayoría de las herramientas de video los entienden mejor así. Se pegan tal cual.

### Clip 1. Inicio

- **Página:** `/`
- **Archivos:** `home`
- **Escena:** amanecer sobre una ciudad mediana en un valle verde, estilo Cuernavaca: azoteas, tejas, árboles frondosos, bugambilias, bruma suave y cerros al fondo. Sin personas.
- **Movimiento de cámara:** toma aérea que avanza muy despacio, en línea recta y a altura constante.
- **Texto para generar:**

```
Slow cinematic aerial shot drifting forward at constant speed over a mid-sized Mexican city in a lush green valley at dawn, in the style of Cuernavaca, Morelos: low-rise buildings with flat rooftops and terracotta roof tiles, dense tropical trees, bougainvillea, soft morning haze, forested hills on the horizon, warm golden light with deep navy blue shadows. No people in frame, no specific landmark. Photorealistic, shot on a cinema camera, natural light, sober muted color grade, smooth continuous movement, single take, no cuts, 16:9. No text, no signs, no captions, no logos, no brands, no license plates, no weapons, no police or military vehicles, no holograms, no futuristic interfaces.
```

### Clip 2. Consultoría de seguridad

- **Página:** `/servicios/consultoria-seguridad`
- **Archivos:** `consultoria-seguridad`
- **Escena:** recorrido de revisión en una instalación: dos personas con ropa civil de trabajo, vistas de espaldas y desenfocadas, caminan por el pasillo amplio de una nave industrial limpia y ordenada, con luz natural que entra por ventanas altas.
- **Movimiento de cámara:** seguimiento lento desde atrás, a la altura de los hombros, con poca profundidad de campo.
- **Texto para generar:**

```
Slow steady tracking shot from behind, at shoulder height, following two professionals in plain business-casual civilian clothes walking calmly down a wide, clean, well-organized industrial warehouse aisle in Morelos, Mexico. They are seen only from behind and softly out of focus, one carries a plain closed folder. Natural daylight from high windows, warm highlights, deep navy blue shadows, shallow depth of field. Photorealistic, shot on a cinema camera, sober muted color grade, smooth constant movement, single take, no cuts, 16:9. No visible faces, no text, no signs, no labels on boxes, no logos, no brands, no license plates, no weapons, no police or military uniforms, no holograms, no futuristic interfaces.
```

### Clip 3. Protección civil

- **Página:** `/servicios/proteccion-civil`
- **Archivos:** `proteccion-civil`
- **Escena:** pasillo luminoso de un edificio de oficinas o escuela, con un extintor rojo liso colgado en la pared en primer plano; al fondo, desenfocadas, personas caminan con calma hacia una puerta abierta que da a un patio con árboles.
- **Movimiento de cámara:** desplazamiento lateral lento, de izquierda a derecha, con el extintor en primer plano.
- **Texto para generar:**

```
Slow lateral slide from left to right at constant speed along a bright, clean corridor of an office or school building in Cuernavaca, Mexico. In the foreground, in sharp focus, a plain red fire extinguisher with no label mounted on a white wall. In the background, softly out of focus, a few people in everyday civilian clothes walk calmly toward an open door leading to a sunlit courtyard with trees. Calm, orderly, preventive mood. Natural daylight, warm highlights, deep navy blue shadows, shallow depth of field. Photorealistic, shot on a cinema camera, sober muted color grade, single take, no cuts, 16:9. No visible faces, no text, no signs, no captions, no logos, no brands, no smoke, no fire, no panic, no weapons, no police or military uniforms, no holograms, no futuristic interfaces.
```

### Clip 4. Videovigilancia e integración tecnológica

- **Página:** `/servicios/videovigilancia-cctv` (también puede usarse en `/servicios/integracion-tecnologica`)
- **Archivos:** `videovigilancia`
- **Escena:** cámara de seguridad tipo domo, sin marca, montada en la esquina exterior de un edificio comercial moderno al anochecer; luces cálidas y árboles desenfocados al fondo. Sin pantallas ni monitores.
- **Movimiento de cámara:** giro lento alrededor de la cámara de seguridad, en un solo sentido.
- **Texto para generar:**

```
Slow orbiting shot at constant speed around a plain, unbranded dome security camera mounted on the exterior corner of a modern low-rise commercial building in Morelos, Mexico, at blue hour. Warm building lights and tropical trees softly out of focus in the background, gentle bokeh, deep navy blue sky. The security camera is the only subject, in sharp focus. Photorealistic, shot on a cinema camera, sober muted color grade, shallow depth of field, smooth continuous movement, single take, no cuts, 16:9. No people, no screens, no monitors, no text, no signs, no logos, no brands, no license plates, no vehicles, no weapons, no holograms, no overlays, no futuristic interfaces, no glowing scan lines.
```

### Clip 5. Capacitación de brigadas

- **Página:** `/servicios/capacitacion-brigadas-emergencia`
- **Archivos:** `brigadas`
- **Escena:** práctica en el patio de una empresa: un grupo pequeño de personal de oficina, con ropa civil, chaleco de seguridad liso y casco blanco, atiende la explicación de un instructor que sostiene un extintor. Todos de espaldas o desenfocados. Sin fuego visible.
- **Movimiento de cámara:** acercamiento lento y estable, a la altura de la cintura, desde atrás del grupo.
- **Texto para generar:**

```
Slow steady push-in at waist height from behind a small group of office workers during an emergency brigade training session in the paved courtyard of a company building in Cuernavaca, Mexico. They wear everyday civilian work clothes with plain high-visibility safety vests without any lettering or insignia and plain white hard hats. An instructor in the same plain vest, softly out of focus, holds a plain red fire extinguisher with no label. Everyone is seen from behind or out of focus. Calm, attentive, orderly mood, late afternoon sunlight, trees in the background, warm highlights, deep navy blue shadows, shallow depth of field. Photorealistic, shot on a cinema camera, sober muted color grade, single take, no cuts, 16:9. No visible faces, no text, no signs, no logos, no brands, no fire, no smoke, no weapons, no police, military or firefighter uniforms, no emergency vehicles, no license plates, no holograms, no futuristic interfaces.
```

### Clip 6. Plan de continuidad

- **Página:** `/servicios/plan-continuidad-operaciones`
- **Archivos:** `continuidad`
- **Escena:** oficina en la mañana con lluvia fuerte detrás de los ventanales; adentro, la luz está encendida y estable, y al fondo se ve personal desenfocado trabajando con calma. En primer plano, una carpeta cerrada y lisa sobre un escritorio. Las pantallas quedan fuera de cuadro o de espaldas a la cámara.
- **Movimiento de cámara:** retroceso lento desde la ventana con lluvia hacia el interior de la oficina.
- **Texto para generar:**

```
Slow dolly-out at constant speed from large office windows streaked with heavy summer rain, revealing a calm, well-lit office interior in Morelos, Mexico, in the early morning. Outside, blurred green trees under a grey sky. Inside, steady warm lighting, a plain closed binder on a tidy desk in the foreground, and in the background a few employees in everyday civilian clothes, softly out of focus, working calmly. Computer screens are out of frame or turned away from the camera. Mood of calm continuity while it storms outside. Warm interior highlights, deep navy blue shadows, shallow depth of field. Photorealistic, shot on a cinema camera, sober muted color grade, single take, no cuts, 16:9. No visible faces, no text, no signs, no documents with readable writing, no logos, no brands, no weapons, no police or military uniforms, no flooding, no damage, no holograms, no futuristic interfaces.
```

## 9. Lista de entrega por clip

- [ ] Dura de 6 a 10 segundos y el bucle no se nota.
- [ ] Sin audio.
- [ ] Sin texto, logotipos, marcas, rostros reconocibles, placas, armas, patrullas ni uniformes que parezcan de policía o ejército.
- [ ] Sin hologramas ni interfaces de ciencia ficción.
- [ ] Póster de 150 KB o menos.
- [ ] Escritorio: WebM y MP4 de 2.5 MB o menos cada uno.
- [ ] Celular: WebM y MP4 de 1 MB o menos cada uno.
- [ ] Los cinco archivos están en `public/videos/` con el nombre correcto.
- [ ] El póster se ve bien solo, sin el video.
