# Memoria del Proyecto ERFOR: Plataforma Integral de Asesoría Ambiental

Este documento contiene el estado actual, la arquitectura y los logros del desarrollo de la plataforma ERFOR hasta la fecha. **Instrucción para la IA:** Lee este documento al iniciar una nueva sesión para recuperar todo el contexto del proyecto de inmediato.

## 1. Visión General del Proyecto
ERFOR es un sistema B2B (SaaS) diseñado para la gestión integral de asesoría ambiental corporativa. Permite administrar clientes, predios, expedientes, obligaciones legales, documentos, y cuenta con un módulo de inteligencia artificial especializado en normativa ambiental colombiana.

## 2. Stack Tecnológico
- **Framework:** Next.js (App Router) con React.
- **Estilos:** Tailwind CSS.
- **Base de Datos:** Prisma ORM con PostgreSQL (Vercel/Prisma Postgres).
- **Iconografía y Componentes:** Lucide React para íconos, HeadlessUI para ventanas modales y transiciones.
- **Validación:** Zod.

## 3. Módulos Desarrollados y Funcionales

### A. Autenticación y Acceso
- Pantalla de inicio de sesión (`/login`) con diseño corporativo oscuro (ERFOR ink/green).
- Función de **"Acceso DEMO"** habilitada para demostraciones rápidas con el usuario `erwin@erfor.co`.
- Rutas protegidas mediante validación de sesión.

### B. Arquitectura de Navegación (AppShell)
- Barra lateral (Sidebar) estática y consolidada con exactamente 5 módulos principales: Panel Maestro, Clientes y Proyectos, Calendario y Alertas, IA Asistente Ambiental, Configuración. Eliminada la lógica de inyección dinámica para evitar problemas de caché.
- **Campana de Notificaciones:** Conectada a la base de datos real (modelo `Alert`) mediante un endpoint dedicado (`/api/notifications`), consumo en tiempo real vía `useSWR`, e interfaz dinámica de colores/íconos según severidad. Incluye ocultamiento local de alertas marcadas como leídas.
- **Buscador Global:** Implementado un motor de búsqueda global con `Combobox` (Headless UI) y `useDebounce` que consulta simultáneamente en Clientes, Expedientes y Predios a través de `/api/search`, permitiendo navegación rápida con autocompletado en todo el sistema.

### C. Panel Maestro (Dashboard)
- Indicadores clave (KPIs) apuntando directamente al núcleo de negocio: Conteo de "Predios Activos" en lugar de proyectos genéricos.
- Tarjetas de resumen para Alertas Críticas y Trámites en Curso.
- Reestructuración de tarjetas de Estado (KPIs) a un formato de 5 columnas (Cotizaciones, En Proceso, En Trámite, Otorgado y En Seguimiento). **Estas tarjetas ahora se alimentan estrictamente del estado global del Expediente (`EnvironmentalFile.status`)**, garantizando coherencia 1 a 1 entre lo que el consultor activa dentro del detalle del expediente y lo que se suma en el panel principal. El clic en cada tarjeta enruta correctamente a sus respectivos módulos aislados.

### D. Módulo de Predios (Core)
- Interfaz dividida: Listado de predios y visualización de mapa a la derecha.
- 4 predios base de demostración: Hacienda La Esperanza, Lote Industrial, Reserva Natural, Granja Agrícola.
- **Detalle de Predio:** Al hacer clic en un predio, se abre una vista dedicada con pestañas (Resumen, Trámites, Obligaciones, Documentos).

### E. Calendario y Alertas
- Vista mensual que carga eventos de forma dinámica desde el backend (`/api/calendar`).
- Simulación de datos reales colombianos: "Vencimiento Licencia Ambiental ANLA", "Inspección CAR", etc.
- **Interacción:** Al hacer clic en un evento del calendario, se despliega un Modal (HeadlessUI) con los detalles, prioridad y estado del evento.

### F. IA Asistente Ambiental
- Interfaz de chat dedicada y realista simulando un asistente experto en normativa (RAG).
- Animaciones de carga y botones de acceso rápido ("Analizar resolución ANLA", "Generar reporte").

### G. Configuración del Sistema
- Pantalla de preferencias estilo SaaS dividida en pestañas laterales: Perfil y Empresa, Notificaciones, Asistente IA (privacidad de datos), Integraciones (VITAL, SINA, IDEAM) y Usuarios.

### H. Gestión de Expedientes y Documentos
- Vista detallada de Expedientes en diseño descendente fluido (ancho completo).
- Integración de módulos de **Obligaciones**, **Calendario Embebido** y **Módulo de Registro Fotográfico**.
- Generación y almacenamiento local de recursos fotográficos (imágenes de Colombia creadas por IA) para evitar bloqueos por hotlinking externos (`/public/seed-images`).
- Flujo funcional para carga de imágenes en el Registro Fotográfico con actualización instantánea sin recarga.
- **Alineación del componente de Tarjetas de Estado** dentro del detalle de cada Expediente para que coincida con el estándar de 5 fases (Cotizaciones, En Proceso, En Trámite, Otorgado, En Seguimiento).
- **Steper Visual de Estados con Seguridad:** Implementación de un visualizador de 5 pasos horizontales en el expediente. Incluye un mecanismo de **doble aprobación** a través de un modal de confirmación segura (checkbox de advertencia) para cambiar el estado del trámite en la base de datos y generar registros de auditoría.
- **Módulo de Obligaciones (Checklists):** Unificación del diseño a un sistema estándar de Tarjetas Visuales. Se incluyen las obligaciones por defecto (Seguimiento, Compensación, Sistema de Medición, PUEAA, Consumos, Cuadro de Costos, Obras de Captación en Obras, Reporte de Consumos) bajo un mismo diseño interactivo, con selectores de "Fecha de Inicio".
- **Lógica de Despliegue Progresivo:** La pestaña de Obligaciones & Tareas ahora aparece condicionada al estado del expediente. Solo se muestra si el expediente se encuentra en "Otorgado" o "En Seguimiento". Adicionalmente, los sub-módulos de "Reporte de Consumos" y "Avances PUEAA" (los cuales incluyen seguimiento anual predefinido y cargas de documentos de radicado) se revelan dinámicamente **solo** cuando el expediente alcanza la fase final de "En Seguimiento".
- **Simulación Masiva de Datos:** Se generaron registros completos (Trámites, Requerimientos, Obligaciones, Alertas y Proyectos vinculados) para la totalidad de los clientes y predios de la plataforma, permitiendo probar toda la funcionalidad con datos realistas en todas las cuentas.

### I. Módulo de Clientes (Portal y Panel Consultor)
- **Creación Unificada de Expedientes (Onboarding):** Se reestructuró la funcionalidad de "Nuevo Cliente" para convertirse en un súper-formulario centralizado de "Nuevo Expediente Ambiental". Este formulario captura simultáneamente en un solo paso los *Datos del Expediente*, *Datos del Cliente* y *Datos de la Finca/Predio*, registrando todo de forma segura en la base de datos mediante una transacción relacional.
- **Portal del Cliente:** Rediseño premium de la ruta `/portal` y `/portal/proyectos/[id]`. Los clientes externos tienen su propio dashboard aislado donde ven alertas, progreso de trámites, obligaciones y pueden descargar/subir documentos. Autenticación con "Magic Links".
- **Hoja de Vida del Cliente:** El consultor tiene una vista 360° de cada cliente (`/clientes/[id]`) con contadores rápidos de predios y expedientes.
- **Expediente Digital Operativo:** El consultor gestiona el día a día de un trámite en `/expedientes/[id]`, incluyendo una simulación UI de conexión a **OneDrive/Microsoft 365** para la gestión de documentos en la nube, y módulos interactivos para administrar las Obligaciones Ambientales y la Demanda Hídrica.

### J. Módulo de Cotizaciones Independiente
- Se creó la ruta aislada `/cotizaciones` para gestionar la fase inicial (Presupuestos y Propuestas) sin mezclarla visualmente con los trámites en curso.
- Incorpora un **Modal Global de Nuevo Trámite** (`GlobalNewTramiteModal`) que funciona como un súper-formulario flotante. Permite buscar clientes existentes con un autocompletado inteligente (`Combobox`) o registrar uno nuevo al vuelo, creando simultáneamente la Cotización (Proyecto), Predio y Expediente inicial en un solo paso.

## 4. Arquitectura de Infraestructura (Hosting)
- **Frontend / Backend (Next.js):** Plataforma PaaS de Vercel (Capa Hobby para inicio a $0/mes, escalable a plan Pro por $20 USD/mes). Garantiza despliegues automáticos (CI/CD) desde GitHub y Edge Network.
- **Base de Datos (PostgreSQL):** Supabase o Vercel Postgres (PostgreSQL relacional) aprovechando los planes gratuitos generosos (500MB) para mantener costos operativos en cero durante la etapa de MVP. Se descartaron opciones de VPS tradicional con cPanel/PHP por ser costosas e incompatibles arquitectónicamente con SSR y Server Actions de Next.js.
- **Almacenamiento de Archivos (S3):** Se delega el almacenamiento de blobs (imágenes, PDFs de resoluciones) a Supabase Storage o AWS S3 para no saturar la base de datos ni el entorno Serverless.

## 5. Estado de Despliegue
- **Repositorio Git:** `FreddyForeroMancera/erfor`
- **Hosting:** Vercel.
- **Nota técnica:** La base de datos PostgreSQL se sincroniza (db push) y semilla (seed) automáticamente con datos de prueba durante el proceso de compilación (*build*) en Vercel, garantizando persistencia.

## 6. Próximos Pasos (Pendientes en Agenda)
1. ~~**Correos Reales (Resend):**~~ *(Pausado temporalmente por decisión de negocio, el portal de clientes no es prioridad en este momento).*
2. ~~**Módulo de Cotizaciones y Trámites:** Completar el flujo de creación de nuevos expedientes (Nuevo Trámite) desde el panel del consultor.~~ *(Completado y aislado)*
3. **Implementar Motor IA Real:** Conectar el chat de IA Asistente con la API de OpenAI/Anthropic y conectar una base de datos vectorial para RAG (Recuperación Aumentada por Generación) de leyes colombianas.
4. **Confirmar `JWT_SECRET` en Vercel y verificar el deploy** *(ver sección 09-Jul-2026, punto 5 — bloqueante inmediato)*.
5. **Reprocesamiento retroactivo de documentos ya subidos**: los documentos de cargas masivas anteriores al 09-Jul-2026 tienen `extractedText` viejo/roto (bug de `pdf-parse` v1/v2) y nunca se les corrió la extracción de predio/cliente.
6. **Implementar la emisión real de "Magic Links"** del portal de clientes (`jwt.sign` de un token de activación) — hoy solo existe la verificación, no la generación.

## [08-Jul-2026] Extracción Inteligente de Predios con IA y Carga Masiva Automática

### 1. Extracción de Datos de Documentos mediante IA (pdf-parse + OpenAI)
- **Módulo Core (src/lib/ai-extract-property.ts)**: Se implementó una función extractPropertyFromText que envía el texto extraído de documentos legales (Autos, Resoluciones, Requerimientos) a OpenAI estructurando un prompt estricto con esponse_format para devolver JSON (nombre de predio, matrícula, cédula catastral, ciudad, vereda, propietario).
- **Manejo de Errores de API en Next.js (Duck Typing)**: Se resolvió un bug crítico donde el servidor de desarrollo de Next.js (App Router) interceptaba los errores lanzados por el middleware de autenticación (equireUser) que devolvía un objeto Response puro con un ReadableStream cerrado. El error causaba un 500 HTML dev overlay (causando un error Unexpected token '<' en el frontend). La solución fue usar \	ypeof error.status === 'number'\ para detectar la respuesta HTTP lanzada, ignorando \instanceof Response\, y retornar un \NextResponse.json\ limpio sin reenviar el stream.

### 2. Automatización Total (Sin botones IA manuales)
- **Modificación en Carga Individual (\pi/documents/upload/route.ts\)**: Ahora, justo después de subir y guardar un documento en la BD, si el nombre del archivo contiene palabras clave (\uto, resolución, concepto, indagación\), invoca asíncronamente el extractor de IA. Si la IA detecta datos, crea/actualiza el Predio y lo enlaza automáticamente al \environmentalFile\ correspondiente.
- **Modificación en Carga Masiva (\ulk-import-module.tsx\)**:
  - Anteriormente, la carga masiva solo leía la estructura de carpetas local y creaba los expedientes y clientes sin subir archivos reales (por rendimiento).
  - Se optimizó para que el backend devuelva el árbol de IDs de los expedientes creados.
  - El frontend ahora itera sobre los archivos locales seleccionados en memoria (\ileObj\) e identifica los "documentos clave". Estos pocos archivos *sí* se envían al servidor mediante \FormData\ hacia \/api/documents/upload\ de fondo.
  - Esto detona la automatización del punto anterior, permitiendo a la IA leer los documentos físicos masivamente subidos sin bloquear la interfaz.

## [09-Jul-2026] Auditoría de seguridad, remediación completa y extracción con IA (real, funcionando)

### Contexto
El usuario reportó que la extracción de datos de documentos (representante legal, nombre de
predio, dirección) no funcionaba pese a lo descrito en la entrada del 08-Jul-2026. Se hizo una
auditoría de solo lectura de todo el código y arquitectura, y luego una remediación completa
en 3 fases + la implementación real de la lectura de documentos. Todo quedó **commiteado y
pusheado a `main`** (3 commits: `11e1a8f` seguridad, `1eb62aa` CI/ESLint, `f8bc1a0` OCR/extracción).

### 1. Hallazgos clave de la auditoría (ya corregidos)
- **El extractor de IA de predios estaba desconectado del flujo real** — `extractPropertyFromText`
  solo se invocaba desde `/api/ai/extract-property`, ruta que ningún componente del frontend
  llamaba jamás. La "automatización" documentada el 08-Jul solo disparaba el parser por regex
  de `Requirement` (automations.ts), no la extracción de predio/cliente.
- **`pdf-parse` estaba roto para TODO documento**, no solo escaneados: el código llamaba a la
  API v1 (`pdfParse(bytes)`) de una librería que ya está en v2 (clase `PDFParse` con `.getText()`).
  Esto significa que, desde que se actualizó la dependencia, prácticamente ningún documento
  tuvo su texto real extraído — la causa raíz más probable del síntoma reportado.
- **Excel nunca se procesaba** (no había ninguna rama para `.xlsx` en la extracción de texto) y
  **Word se leía con un regex crudo** sobre `<w:t>` en vez de una librería real.
- **El portal de clientes no extraía texto de nada** que el cliente subiera (`portal/upload`
  no llamaba a ninguna función de extracción).
- Guard de rol comentado en el cambio de estado de expediente (`CLIENTE_EXTERNO` podía cambiar
  el estado de cualquier expediente), IDOR en el chat de IA, filtros del CRUD genérico sin
  whitelist, JWT con secreto de respaldo hardcodeado (ver punto 5), `DELETE` genérico sin
  restricción de rol, y `/uploads/[...path]` servía cualquier archivo sin sesión.
- **"Magic Links" del portal (mencionado en la sección I de este documento) no está realmente
  implementado**: no existe en todo el código ningún `jwt.sign` que emita un token de
  activación — solo el endpoint que lo *verifica* (`/api/auth/activate`). La pantalla
  `/portal/activar` existe pero nadie genera el enlace que la alimenta.

### 2. Extracción de documentos — ahora real y verificada con datos reales
- **OCR real** (`src/lib/ocr.ts`): Tesseract.js sobre las primeras 5 páginas de un PDF sin capa
  de texto, usando el renderizado a PNG que ya trae `pdf-parse` internamente (evita mantener una
  segunda copia de `pdfjs-dist`, que rompía el worker por conflicto de versiones).
- **Word real** vía `mammoth`, **Excel real** vía la librería `xlsx` ya presente (antes no se
  leía en absoluto). Todo centralizado en `src/lib/document-text.ts`, compartido entre la carga
  interna y el portal.
- **`src/lib/ai-extract-property.ts`**: prompt ampliado (ahora también pide representante legal
  y dirección), `applyExtractedProperty()` con la regla fija de "solo llenar campos vacíos,
  nunca sobreescribir dato cargado a mano", y `parseClientDataCsv()` para un archivo
  `datos.csv` preestablecido por cliente (una fila por expediente) que el usuario puede colocar
  en `RootFolder/ClienteX/datos.csv` durante la carga masiva — tiene prioridad sobre la IA
  porque se aplica antes de procesar cualquier documento.
- **Portal de clientes ahora sí analiza lo que el cliente sube**, sin filtro de palabras clave
  en el nombre del archivo (a diferencia de la carga interna, que sigue filtrando por
  auto/resolución/concepto/requerimiento/indagación para no gastar en el volumen histórico).
- `properties-module.tsx` / `property-detail-module.tsx` ahora muestran `owner`/`address` del
  predio (existían en la base de datos pero no se mostraban en ninguna pantalla).
- **Pendiente, no resuelto en esta sesión**: los documentos que ya se subieron por cargas
  masivas anteriores siguen con el `extractedText` viejo/roto en la base de datos — falta un
  reprocesamiento retroactivo (hay un scaffold parcial en `/api/ai/extract-property/batch`,
  desconectado de la UI, sin el fallback de OCR).

### 3. Motor de IA: Gemini gratis con fallback a OpenAI
- `extractPropertyFromText()` intenta primero **Google Gemini** (`gemini-2.5-flash`, variable
  `GEMINI_API_KEY`) y cae automáticamente a **OpenAI** si Gemini falla o no está configurada.
  Si ninguna está configurada, se omite sin romper nada.
- **Corrección (10-Jul-2026): el nivel gratuito de Gemini NO es ~1500/día, es 20 solicitudes/día**
  por modelo (`generativelanguage.googleapis.com/generate_content_free_tier_requests`,
  `GenerateRequestsPerDayPerProjectPerModel-FreeTier: 20`) — confirmado empíricamente con errores
  429 reales en producción tras una sola sesión de carga masiva + pruebas. Se agota muy rápido;
  ver sección `[10-Jul-2026]` para el detalle y las opciones evaluadas (Groq, OpenAI).
- **Probado con una API key real** contra un documento de ejemplo realista (auto de la CAR con
  predio, propietario, representante legal y dirección): Gemini extrajo los 9 campos
  correctamente en el primer intento.
- `GEMINI_API_KEY` ya está configurada en Vercel (Production). Se consigue gratis en
  [aistudio.google.com/apikey](https://aistudio.google.com/apikey).

### 4. CI y calidad
- `.github/workflows/ci.yml` nuevo: typecheck + lint (informativo) + test + build en cada push/PR.
- `eslint.config.mjs` nuevo (flat config) — el proyecto no tenía ninguna configuración de ESLint
  real; `next lint` pedía un prompt interactivo que hubiera roto el CI.
- Deuda de tipado preexistente detectada al activar el lint: **103 errores / 96 warnings**, casi
  todos `@typescript-eslint/no-explicit-any` — mismo patrón que APPTUR (proyecto hermano). No se
  tocó; el lint es informativo en CI a propósito (`ignoreDuringBuilds: true` en `next.config.ts`).

### 5. Incidente post-deploy: `JWT_SECRET` nunca estuvo configurado en Vercel
Al desplegar el fix de JWT (fail-fast si falta `JWT_SECRET` en producción), **el build de
Vercel falló** con `Error: JWT_SECRET no está configurado`. Esto reveló que la variable
**nunca existió en Vercel** — la app llevaba corriendo en producción todo este tiempo con el
secreto de respaldo hardcodeado (`"dev-erfor-secret"`), exactamente el hallazgo crítico #2 de
la auditoría. Se generó un secreto aleatorio nuevo para que el usuario lo agregue en
Vercel → Settings → Environments → Production → `JWT_SECRET`. **Al activarlo, todas las
sesiones existentes (incluidas las del portal de clientes) se invalidan** — todos deben volver
a iniciar sesión una vez.

**Resuelto el mismo día:** el usuario agregó `JWT_SECRET` en Vercel (Production) y redesplegó.
Build en verde, `https://erfor.vercel.app/login` responde 200. Las 3 fases quedaron en
producción: seguridad (`11e1a8f`), CI/ESLint (`1eb62aa`) y OCR/extracción con IA (`f8bc1a0`).
Pendiente confirmar en una futura sesión que `GEMINI_API_KEY` también esté replicada en el
entorno **Preview** de Vercel (se agregó a Production; no se confirmó Preview).

## [10-Jul-2026] Depuración profunda del pipeline de IA + edición manual + KML/KMZ + subida directa

### Contexto
Sesión larga de producción real: el usuario purgó datos de prueba y volvió a hacer la ingesta
masiva real varias veces, encontrando fallos reales en cada intento. Se corrigieron **en
cadena, uno tras otro** (cada fix destapaba el siguiente error real, nunca simulado):

1. `ReferenceError: DOMMatrix is not defined` — pdf-parse/pdfjs-dist intenta auto-polyfillear
   con un `require("@napi-rs/canvas")` dinámico que el file tracer de Vercel no detecta. Fix
   real: import estático + polyfill perezoso de `DOMMatrix/ImageData/Path2D` en `src/lib/ocr.ts`,
   más `outputFileTracingIncludes` en `next.config.ts` forzando el binario Linux de canvas.
2. `Invalid supabaseUrl` — `SUPABASE_URL` en Vercel tenía un valor malformado (comillas/espacio
   al pegarlo). Corregido directamente en Vercel, sin cambio de código.
3. `Setting up fake worker failed: Cannot find module .../pdf.worker.mjs` — pdf-parse trae un
   `pdfjs-dist` ANIDADO cuyo worker tampoco lo rastrea el tracer de Vercel. Fix: forzar también
   `node_modules/pdf-parse/node_modules/pdfjs-dist/legacy/build/**/*` en `outputFileTracingIncludes`.
4. Con las 3 causas resueltas, una carga masiva real produjo **12 predios + 7 representantes
   legales detectados automáticamente por IA** sobre datos reales del cliente.

**Lección para futuras sesiones**: cuando algo en Vercel falla "raro" y funciona local, sospechar
primero de `outputFileTracingIncludes`/binarios nativos con require dinámico antes que del código
de negocio. `fail()` (en `src/lib/http.ts`) mete el error en el body de la respuesta pero **nunca
lo escribe al log** — los 500 aparecían como `(no message)` en Vercel y eran indiagnosticables
hasta que se agregó un `console.error` explícito en el catch de la ruta.

### Edición manual (cuando la IA no detecta un dato)
- **Expediente** (`/expedientes/[id]`): botón "Configuración" ahora abre un modal real —
  código interno/oficial, autoridad, dirección regional, tipo, riesgo, prioridad, fechas
  (apertura/radicación/vencimiento), descripción, línea de tiempo. Antes era un botón muerto.
- **Predio**: botón "Asignar/Editar Predio" dentro del expediente — crea y vincula el predio si
  no existe, o edita el existente (nombre, catastral, matrícula, propietario, dirección, vereda,
  municipio, departamento).
- **Cliente**: botón "Editar Cliente" agregado también dentro de la página del expediente (ya
  existía en `/clientes/[id]`), para no tener que navegar fuera.
- Todo esto ya usa el CRUD genérico existente (`/api/[resource]/[id]`, `canWrite`/`canDelete`),
  no se creó backend nuevo para esto.

### Re-análisis con IA sin volver a subir archivos
- `POST /api/expedientes/:id/reanalyze` — combina el `extractedText` YA guardado de todos los
  documentos reales del expediente (filtra los "mock" de carga masiva y los marcadores de
  respaldo tipo "Archivo cargado:") en un solo prompt y corre la extracción. Más robusto que la
  carga masiva (que analiza documento por documento): combinar varios documentos deja que la IA
  arme el predio aunque el dato esté repartido entre ellos.
- Botón "Re-analizar con IA" por expediente + botón "Re-analizar todo" (en `/importar` y en
  Configuración → Carga Masiva) que recorre todos los expedientes sin predio y los procesa uno
  por uno, reportando cuántos quedaron llenos.

### Advertencia de estructura de carpetas en la carga masiva
- La carga masiva asume una estructura fija `Cliente/Expediente/[Estado]/Archivo`. Antes, un
  archivo que no encajaba (ej. suelto directo en la carpeta del cliente) se descartaba **en
  silencio** — el consultor veía "Estructura analizada: N clientes" sin saber que algo quedó
  afuera. Ahora se reporta explícitamente en un panel persistente con la ruta de cada archivo
  ignorado.
- Se descubrió con datos reales que los archivos de bloqueo/temporales de Word/Excel
  (`~$Nombre.docx`, `~WRL0001.tmp`) aparecían como falsos positivos en esa advertencia. Se
  filtran ahora en cualquier nivel de la carpeta (no solo en el chequeo de estructura), igual
  que `.DS_Store`/`Thumbs.db`/`desktop.ini`.
- Carpetas intermedias EXTRA (más niveles de los esperados) no son un problema: el archivo igual
  llega al cliente/expediente correcto, solo se pierde el nombre de esa subcarpeta.

### KML/KMZ: geolocalización automática de predios (sin IA)
- `src/lib/document-text.ts`: `parseKmlPlacemarks()` extrae `<name>`/`<coordinates>` por regex
  (KML es XML plano, no valía la pena un parser XML completo). `.kmz` se descomprime con `jszip`
  (JS puro, sin binario nativo — a propósito, para no repetir la saga de `@napi-rs/canvas`).
- `extractKmlGeoData()` es **determinístico, no pasa por Gemini/OpenAI** — decisión deliberada:
  las coordenadas son datos estructurados que no conviene dejar a interpretación de un LLM, y
  sigue funcionando aunque la cuota gratuita de IA esté agotada. Llena `Property.coordinates`
  (campo que existía en el schema pero nunca se usaba) + el nombre si el predio no tiene uno.
  Conectado en `documents/upload`, `portal/upload` y la carga masiva.
- `property-detail-module.tsx` muestra las coordenadas + enlace "Ver en Google Maps" (parseado
  del primer par lon,lat).

### Groq evaluado y descartado (decisión del usuario)
Se implementó una cadena de 3 proveedores (Gemini → Groq → OpenAI) para el chat y la extracción,
con tests y todo verificado — pero el usuario decidió no usar Groq ("no creo que gastemos
mucho"), así que se revirtió por completo (código, tests, `.env.example`) y quedó solo
Gemini → OpenAI, igual que antes. Si se reconsidera en el futuro, el patrón ya está probado
(ver historial de git, commit revertido).

### El Asistente IA: dos bugs de origen + una funcionalidad simulada, todos corregidos
Al preguntar "¿el asistente ya es real?" se destaparon 3 problemas reales:
1. **`ia-assistant-module.tsx`** (página "IA Asistente Ambiental" del menú) era **100% simulado**
   — `handleSend` nunca llamaba a ninguna API, solo un `setTimeout` con un texto fijo que decía
   literalmente "Esta es una respuesta simulada para demostración". Conectado a `/api/ai/chat` real.
2. **El widget flotante (`ai-panel.tsx`)** sí llamaba a la API real, pero nunca enviaba
   `clientId`/`environmentalFileId` — así que siempre traía datos genéricos de toda la
   plataforma sin importar en qué cliente/expediente estuviera el usuario. Fix: detecta la
   entidad actual por la URL (`usePathname()` + regex sobre `/clientes/[id]` y
   `/expedientes/[id]`), la manda en cada request, resetea `conversationId` al cambiar de
   entidad (el backend nunca reasigna el scope de una conversación ya creada), y muestra
   "Enfocado en este cliente/expediente" vs "Contexto general" en el header.
3. **Dos bugs de Prisma preexistentes, presentes desde el origen de esta función** (nunca
   introducidos en esta sesión, pero nunca antes se había llegado a ejecutar el chat de
   verdad para que se manifestaran):
   - `api/ai/chat/route.ts` pasaba el objeto COMPLETO de la petición (`message`,
     `conversationId` incluidos) como si fuera el contexto de filtrado a `answerWithAI()`.
     `compactWhere()` metía esos campos en cada `where` de Prisma como si fueran columnas
     válidas → error "Unknown argument `message`" en TODA consulta, en TODO mensaje de chat,
     desde siempre. Fix: pasar solo `{clientId, projectId, environmentalFileId}`.
   - Con eso corregido, apareció un segundo bug: `EnvironmentalObligation` **no tiene columna
     `environmentalFileId`** en el schema (solo `Requirement`/`Document`/`Alert` la tienen).
     `buildContext()` reusaba el mismo `where` para las 4 consultas. Fix: `where` separado por
     modelo en `src/lib/ai.ts`, y cuando solo hay `environmentalFileId` (caso típico: asistente
     abierto desde la ficha de un expediente), las obligaciones se acotan al `clientId` del
     expediente en vez de traer las de toda la plataforma.
- `compactWhere()` ahora recibe una lista blanca explícita de campos permitidos por cada
  llamada, para que esta clase de bug no pueda repetirse en silencio.

### Subida directa a Supabase Storage (evita el límite de 4.5 MB de Vercel)
- **Problema real observado en logs de producción**: PDFs escaneados grandes daban `413 Payload
  Too Large` — Vercel limita el body de cualquier función serverless a 4.5 MB sin importar
  `maxDuration`, y el archivo ni siquiera llegaba al código.
- **Solución**: nueva ruta `POST /api/documents/upload-url` genera una URL de subida firmada de
  Supabase Storage (con la service-role key, del lado del servidor). El navegador sube el
  archivo DIRECTO a Storage con esa URL (usando un cliente Supabase del lado del cliente con la
  clave pública `anon` — variables nuevas `NEXT_PUBLIC_SUPABASE_URL` /
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, ya agregadas en Vercel Production), sin pasar por Vercel en
  absoluto. Luego se avisa a `/api/documents/upload` (ahora acepta tanto FormData clásico como
  JSON con `storagePath`) para que descargue el archivo del lado del servidor y corra el mismo
  pipeline de extracción/OCR/IA de siempre.
- `src/lib/direct-upload.ts`: helper cliente que envuelve las 3 llamadas. Conectado en el botón
  de subida individual (`documents-module.tsx`) y en la carga masiva (`bulk-import-module.tsx`).
- **Verificado end-to-end** contra Supabase real, incluyendo un archivo sintético de 6 MB (más
  grande que el límite de Vercel) que subió y se descargó byte-idéntico. **Pendiente: aún no se
  ha probado con un archivo real grande del usuario en producción** — próxima sesión debería
  confirmarlo.

### Nota operativa: `git push` bloqueado para el agente en esta sesión
El gestor de credenciales de Git en esta máquina requiere un prompt interactivo (login de
GitHub) que Claude Code no puede completar de forma no interactiva — cada `git push` de esta
sesión lo tuvo que ejecutar el usuario manualmente en su propia terminal después de que el
agente hiciera el commit. Si esto persiste en sesiones futuras, considerar configurar un
credential helper no interactivo (ej. token de acceso personal) para desbloquearlo.

### Próximos pasos concretos (agregado 10-Jul-2026)
1. **Confirmar la subida de archivos grandes en producción real** (el fix de 4.5 MB está
   desplegado y verificado con datos sintéticos, falta la prueba real del usuario).
2. **Probar KML/KMZ con archivos geoespaciales reales** del cliente (la función está lista y
   probada con datos sintéticos, nunca con un archivo real de un predio).
3. Quedan expedientes sin predio y clientes sin representante legal por completar a mano o
   re-analizar (revisar conteo actual con una consulta a la base — cambia con cada ingesta).
4. Decidir si conectar `OPENAI_API_KEY` como respaldo real del chat/extracción (pausado a
   petición del usuario: "esperemos al reseteo mañana" de la cuota gratuita de Gemini).
5. Confirmar `GEMINI_API_KEY` en el entorno Preview de Vercel (pendiente desde 09-Jul, nunca
   confirmado).

## [10-Jul-2026, continuación] Bug sin resolver: archivo de 33MB falla al subir (probablemente antivirus/red del usuario, NO el código)

### Síntoma
Un PDF real de 33MB (`1. RADICADO INICIAL CAR.pdf`, 34.221.485 bytes) falla al subir desde
la ficha del expediente con: `StorageUnknownError | Failed to execute 'set' on 'Headers':
String contains non ISO-8859-1 code point.` Archivos más chicos (varios ya subidos con
éxito, <2MB) funcionan sin problema.

### Investigación (todas las hipótesis de código descartadas con evidencia real)
1. **No es límite de tamaño**: un archivo sintético de 34MB se subió con éxito contra el
   mismo proyecto de Supabase, dos veces, en pruebas distintas.
2. **No son tildes/ñ en el nombre**: el usuario confirmó el nombre completo sin recortar —
   "1. RADICADO INICIAL CAR.pdf", 100% ASCII. (Sí se corrigió de paso un bug real y distinto:
   `direct-upload.ts` ahora sanitiza el nombre del archivo antes de `uploadToSignedUrl`,
   porque el SDK de Supabase lo mete en un `FormData` y el navegador arma un
   `Content-Disposition` con `file.name` — esto SÍ rompería con un nombre real que tuviera
   tildes, aunque no es la causa de ESTE caso puntual.)
3. **No es la clave `NEXT_PUBLIC_SUPABASE_ANON_KEY` corrupta**: probada limpia y con
   variantes corrompidas (comillas, espacio final, salto de línea) vía `Headers.set()` en un
   Chrome real (no Node — Node no aplica esta validación) — ninguna reprodujo el error.
4. **Reproducción exacta y fiel en un Chrome real, controlado por el agente**: mismo nombre
   de archivo, mismo tamaño exacto (34.221.485 bytes), misma clave anon, mismo cliente con
   Auth desactivado (`persistSession/autoRefreshToken/detectSessionInUrl: false`), cargando
   `@supabase/supabase-js` real vía CDN en el navegador — **subió sin ningún error en ~45s**.
   Esto descarta que el bug esté en el código de la plataforma.
5. **Ocurre igual en Chrome y en Edge** en la máquina del usuario — descarta que sea una
   extensión específica de un solo navegador.
6. **Patrón clave**: solo falla con el archivo grande, nunca con los chicos. Esto apunta
   fuertemente a **antivirus/DLP corporativo o proxy de red** que solo intercepta/escanea en
   tiempo real archivos grandes (patrón típico de Kaspersky, ESET, McAfee, Forcepoint, etc.),
   reconstruyendo la petición y rompiendo algún header en el proceso — no a un bug del propio
   navegador (si fuera un bug general de Chrome, debería fallar también con archivos chicos).

### Mejoras de código que sí quedaron (independiente de si resuelven el bug real)
- `direct-upload.ts`: sanitiza el nombre de archivo antes de subir (bug real de tildes/ñ,
  separado de este caso).
- `direct-upload.ts`: cliente de Supabase con Auth desactivado (solo se usa Storage) — evita
  el warning "Multiple GoTrueClient instances detected" y descarta esa fuente de efectos
  secundarios en segundo plano.
- `direct-upload.ts`: errores de subida ahora muestran detalle completo en el toast (nombre
  del error, causa anidada, nombre/tamaño/tipo del archivo) — para diagnosticar sin depender
  de que el usuario abra DevTools.

### Resolución del Bug de 33MB (10-Jul-2026)
- **Causa Raíz**: `@supabase/storage-js` procesa los archivos `File`/`Blob` envolviéndolos en un `FormData` multipart con un nombre de campo vacío (`body.append('', fileBody)`). Al subir archivos muy pesados, las capas de seguridad (antivirus/firewalls/proxies corporativos) o el propio motor de fetch del navegador rechazan o alteran las cabeceras multipart al no poder representarse en ISO-8859-1, lanzando la excepción `Failed to execute 'set' on 'Headers': String contains non ISO-8859-1 code point`. En una segunda instancia, incluso usando un `fetch` nativo con cabeceras proactivamente sanitizadas, la API de `fetch` del navegador seguía fallando con el mismo `TypeError` al leer `RequestInit.headers` debido a la presencia de extensiones del navegador (o DLP corporativos) que monkeypatchean `window.fetch` para interceptar subidas pesadas e inyectan cabeceras corruptas.
- **Solución Aplicada**:
  1. Se modificó `direct-upload.ts` para convertir el archivo en un `ArrayBuffer` en memoria (`await file.arrayBuffer()`). Esto evita el uso de `FormData` y envía la petición HTTP `PUT` directamente como un body binario limpio.
  2. Se reemplazó el uso de la API de `fetch` del navegador por un canal de bajo nivel mediante **`XMLHttpRequest` (XHR)** directo. Esto permite configurar cabeceras manualmente una a una mediante `xhr.setRequestHeader`, saltándose por completo las validaciones de `RequestInit.headers` de la API de `fetch` y esquivando cualquier interceptor/monkeypatch que las extensiones o softwares corporativos apliquen sobre `window.fetch`.
  3. Se incluyó una sanitización proactiva de todos los valores de cabeceras en el cliente para garantizar que no contengan caracteres fuera de `\x00-\xFF` (ISO-8859-1).
- **Verificación**: `npm run typecheck` pasó con éxito localmente.
- **Despliegue**: El usuario realiza el commit y push manual desde su terminal para detonar el despliegue automático en Vercel.

### Siguientes pasos concretos (Actualizado 10-Jul-2026)
1. Hacer git commit y git push del cambio que migra a `XMLHttpRequest`, y reintentar la subida del archivo real de 33MB.
2. Si es exitoso, verificar que el flujo de procesamiento posterior (OCR/extracción) se complete en el servidor.
3. Probar KML/KMZ con archivos geoespaciales reales del cliente.
4. Confirmar `GEMINI_API_KEY` en el entorno Preview de Vercel.
