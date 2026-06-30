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
- Reestructuración de tarjetas de Estado (KPIs) a un formato de 5 columnas que incluye: Cotizaciones, En Proceso, En Trámite, Otorgado y En Seguimiento.

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
- **Simulación Masiva de Datos:** Se generaron registros completos (Trámites, Requerimientos, Obligaciones, Alertas y Proyectos vinculados) para la totalidad de los clientes y predios de la plataforma, permitiendo probar toda la funcionalidad con datos realistas en todas las cuentas.

### I. Módulo de Clientes (Portal y Panel Consultor)
- **Creación Unificada de Expedientes (Onboarding):** Se reestructuró la funcionalidad de "Nuevo Cliente" para convertirse en un súper-formulario centralizado de "Nuevo Expediente Ambiental". Este formulario captura simultáneamente en un solo paso los *Datos del Expediente*, *Datos del Cliente* y *Datos de la Finca/Predio*, registrando todo de forma segura en la base de datos mediante una transacción relacional.
- **Portal del Cliente:** Rediseño premium de la ruta `/portal` y `/portal/proyectos/[id]`. Los clientes externos tienen su propio dashboard aislado donde ven alertas, progreso de trámites, obligaciones y pueden descargar/subir documentos. Autenticación con "Magic Links".
- **Hoja de Vida del Cliente:** El consultor tiene una vista 360° de cada cliente (`/clientes/[id]`) con contadores rápidos de predios y expedientes.
- **Expediente Digital Operativo:** El consultor gestiona el día a día de un trámite en `/expedientes/[id]`, incluyendo una simulación UI de conexión a **OneDrive** para la gestión de documentos en la nube, y un módulo interactivo para administrar las Obligaciones Ambientales y la Demanda Hídrica.

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
2. **Módulo de Cotizaciones y Trámites:** Completar el flujo de creación de nuevos expedientes (Nuevo Trámite) desde el panel del consultor.
3. **Implementar Motor IA Real:** Conectar el chat de IA Asistente con la API de OpenAI/Anthropic y conectar una base de datos vectorial para RAG (Recuperación Aumentada por Generación) de leyes colombianas.
