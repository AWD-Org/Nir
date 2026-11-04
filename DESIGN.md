# DESIGN.md — AMOXTLI Nir

Dirección definida con el skill `amoxtli-web-design-direction` (modo producto). Se actualiza cada vez que cambia una decisión.

## Respuestas de partida
- **Marca (3 adjetivos):** cercano, ágil, preciso. "Nir" viene de *near*: todo está a un toque.
- **Sector:** restaurantes, bares y cafeterías pequeños. El dueño llega con prisa y desconfianza ("otro QR más"); necesita ver que lo que cambia aparece al instante. El comensal llega con hambre y poca atención. La competencia (menús QR genéricos, PDFs, tarjetas de reseñas) usa degradados morados, emojis e iconos en círculo: Nir se diferencia con sobriedad, tipografía con carácter y la identidad de cada negocio al frente.
- **Función:** para el dueño, las 3 tareas más frecuentes son (1) marcar agotado o cambiar un precio desde la lista, (2) agregar o editar un producto con foto, (3) ver cómo se ve su página y compartirla. Para el comensal, abrir la carta. Para AMOXTLI®, activar, cobrar y producir tarjetas.

## Referencias (qué se toma / qué se descarta)
| Referencia | Se toma | Se descarta |
|---|---|---|
| Linktree (linktr.ee) | Una columna de botones grandes y uniformes, todo a un pulgar | Su estética de marca y los fondos animados |
| Linear (linear.app) | Densidad de trabajo, números en mono, acciones en línea sin abrir modales | El modo oscuro por defecto y la paleta morada |
| Square Online / Toast menús | Carta con barra fija de categorías y salto al tocar | Fotos obligatorias y layouts de e-commerce |
| Competidores (Wueprey, Menuly, Coloz) | Lo que el comensal ya espera: mesa, carta, reseña, Wi-Fi | Degradados, emojis, tarjetas idénticas con iconos en círculo |

Refero y Details no se consultaron (requieren cuenta); se pueden sumar después con capturas.

## Visual Theme & Atmosphere
Producto de trabajo, claro y plano, con el rosa AMOXTLI® como único acento. La página pública no lleva la marca Nir: lleva la del negocio.

## Color Palette & Roles
| Token | Valor | Rol |
|---|---|---|
| `--ink` | `#121214` | Texto principal |
| `--ink-2` | `#55555E` | Texto secundario (7.2:1 sobre blanco) |
| `--line` | `#E4E4E8` | Bordes y divisores |
| `--paper` | `#F4F4F6` | Fondo de la app |
| `--surface` | `#FFFFFF` | Paneles |
| `--brand` | `#FA1F6F` | Rosa AMOXTLI®: logo, marcas grandes, indicadores. **No** para texto pequeño (3.8:1) |
| `--brand-strong` | `#D60451` | Botón principal y enlaces (5.3:1 con blanco) |
| `--ok` | `#0F7B4B` | Disponible, activa |
| `--warn` | `#9A5B00` | Por vencer, gracia |
| `--bad` | `#B42318` | Agotado, suspendida, borrar |

Página pública: cada plantilla define fondo, superficie y texto; el dueño elige color principal y acento. Se bloquea cualquier combinación con contraste menor a 4.5:1 en botones y texto (RF15).

## Typography Rules
- Admin, consola y landing: **Space Grotesk** (familia AMOXTLI®) para todo el texto; **JetBrains Mono** para precios, slugs, URLs, cifras y códigos de tarjeta.
- Escala: 13 / 15 / 16 (base) / 20 / 28 / 40 / 56 (solo landing). Pesos 400, 500 y 600.
- Página pública, por plantilla: *Noche* Big Shoulders Display + Instrument Sans; *Mercado* Young Serif + Instrument Sans; *Claro* Schibsted Grotesk. Texto mínimo 16 px.
- Fuentes autoalojadas con Fontsource (sin depender de Google Fonts en tiempo de build).

## Component Stylings
- Radio 0.5rem en controles y paneles; 2.5rem solo en el marco del teléfono de vista previa.
- Botón principal relleno `--brand-strong`; secundario con borde `--line`; destructivo en texto `--bad` con confirmación.
- Filas de lista (productos, negocios, pagos) en lugar de tarjetas: precio editable en línea y switch de disponible al alcance del pulgar.
- Hojas laterales (desktop) o inferiores (móvil) para editar un producto. Diálogos solo para confirmar acciones destructivas.
- Estados completos: vacío con una acción, cargando, error, éxito (toast), sin permiso, solo lectura (cuenta suspendida).

## Layout Principles
- Admin: barra lateral en escritorio, barra inferior en móvil (Inicio, Carta, Página, Estadísticas, Cuenta). En "Página" y "Carta", editor a la izquierda y **teléfono con vista previa en vivo** a la derecha (elemento firma).
- Consola: tabla densa con filtros por estado y detalle por negocio.
- Landing: hero asimétrico 7/5 (texto y acción / teléfono interactivo), sin capas encimadas.
- Página pública: una columna de máximo 480 px.

## Depth & Elevation
Plano. Bordes de 1 px en lugar de sombras. Una sola sombra suave para el teléfono de vista previa y las hojas.

## Do's and Don'ts
- Sí: números en mono, acciones en línea, confirmación visible de cada guardado.
- Sí: firma "Desarrollado por AMOXTLI®" en el footer de la landing y de la página pública.
- No: subtítulos decorativos en mayúsculas sobre los títulos, numeración 01/02/03, iconos en círculos, degradados morados, glassmorphism, emojis como iconos, cifras o testimonios inventados.
- No: animación decorativa en pantallas de trabajo.

## Responsive Behavior
Móvil primero desde 375 px. Objetivos táctiles de 44 px. La vista previa en vivo se vuelve un botón "Ver como comensal" debajo de 1024 px.

## Diales
| Dial | Admin / consola | Landing | Por qué |
|---|---|---|---|
| Variación de composición | 3 | 6 | El panel debe ser predecible; la landing se diferencia con el hero asimétrico |
| Intensidad de movimiento | 4 | 7 | Panel: movimiento funcional (entrar a cada sección, hojas, listas, gráficas, confirmaciones). Landing: narrativa con el toque NFC y el admin animándose solo |
| Densidad visual | 6 | 3 | Uso diario del dueño en celular; la landing necesita aire |

## Landing: concepto "La mesa" (rediseño del 3 de noviembre de 2026)
La landing es una escena, no una lista de secciones. Fondo oscuro de hora de servicio con grano y luz cálida de lámpara que se mueve con el scroll; el rosa AMOXTLI® es la única señal (ondas NFC, progreso, acción principal).
- **Historia con scroll fijo (560vh):** mesa vista desde arriba con la tarjeta "Mesa 12". El scroll es el comensal: el celular entra y toca la tarjeta (ondas), se enciende la página real del negocio, se abre la carta, entra el celular del dueño y marca un platillo como agotado (en el del comensal se apaga en vivo) y al final se resalta "Déjanos tu reseña". Progreso navegable con los cinco momentos.
- **Párrafo que se enciende palabra por palabra** con el problema que resuelve.
- **La tarjeta en 3D:** se inclina con el cursor, tiene brillo, se voltea sola una vez y con botón para ver el QR; datos reales en mono.
- **Carril de plantillas** horizontal que avanza con el scroll vertical (escritorio) o se desliza con el dedo (móvil), con la página real en cada plantilla.
- **Lo que controla el dueño** en filas editoriales grandes con línea rosa al pasar el cursor.
- **Instalación** en fondo claro con una línea que se dibuja con el scroll.
- **Cierre "Acércalo."** donde el cursor emite ondas NFC (único detalle de deleite).
- Scroll suave con Lenis; encabezado que se oculta al bajar y vuelve al subir.
- Diales de la landing: composición 8, movimiento 8, densidad 3.

## Motion
Decisión del 3 de noviembre de 2026: más movimiento en toda la app, siempre con función.
- **Landing (motion, 7/10):** título que sube palabra por palabra; teléfono que entra y flota; motion graphic de la tarjeta "Mesa 4" acercándose al celular con ondas NFC en el punto de contacto (ciclo de 4.2 s + 1.6 s de pausa); ondas de fondo que respiran; línea de recorrido que se dibuja (toque → carta → reseña); fila real del admin cambiando precios y agotados sola con su aviso; revelado al hacer scroll en cada bloque; selector de plantilla con píldora que se desliza.
- **Admin y consola (4/10):** entrada de cada sección, esqueletos de carga con brillo, hojas que suben (móvil) o entran por la derecha (escritorio), diálogos con escala, filas y categorías en cascada, barras de estadísticas que crecen, cifras que cuentan, check de precio guardado con rebote, indicador de sección activa que se desliza, pasos del asistente que se deslizan y barra de progreso.
- **Página del comensal:** solo CSS (sin librería) para no afectar la carga en 4G: logo con rebote, botones en cascada, secciones que entran desde la derecha y regresan desde la izquierda, productos en cascada.
- **Reglas:** `ease-out-soft` (cubic-bezier(.22,1,.36,1)); animaciones CSS con `fill-mode: backwards` para no fijar transformaciones (no chocan con el arrastre); `prefers-reduced-motion` reduce todo a 0.01 ms y `MotionConfig reducedMotion="user"` quita desplazamientos y deja solo opacidad. Nada pulsa sin función.

## Motivo gráfico
Arcos concéntricos de onda NFC (cercanía), muy tenues, detrás del teléfono de la landing y en la tarjeta impresa. Nunca cruzan texto.

## Diferencias con el último proyecto (FRACTAE)
Space Grotesk + mono en lugar de Montserrat; radio 0.5rem en lugar de pill/48px; superficies planas en lugar de mesh gradient; sin scroll narrativo con GSAP; elemento firma funcional (vista previa en vivo) en lugar de tarjeta destacada.

## Agent Prompt Guide
"Diseña como una herramienta de trabajo mexicana, clara y plana: Space Grotesk, números en JetBrains Mono, rosa AMOXTLI® #D60451 solo en la acción principal, filas en lugar de tarjetas, sin subtítulos decorativos ni numeración, estados vacíos con una acción, y la identidad del negocio por encima de la de Nir en todo lo que ve el comensal."
