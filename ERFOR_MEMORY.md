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
- Barra lateral (Sidebar) responsiva con enlaces a: Panel Maestro, Clientes y Proyectos, Predios, Calendario y Alertas, IA Asistente Ambiental, Configuración.

### C. Panel Maestro (Dashboard)
- Indicadores clave (KPIs) apuntando directamente al núcleo de negocio: Conteo de "Predios Activos" en lugar de proyectos genéricos.
- Tarjetas de resumen para Alertas Críticas y Trámites en Curso.

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

## 4. Estado de Despliegue
- **Repositorio Git:** `FreddyForeroMancera/erfor`
- **Hosting:** Vercel.
- **Nota técnica:** La base de datos PostgreSQL se sincroniza (db push) y semilla (seed) automáticamente con datos de prueba durante el proceso de compilación (*build*) en Vercel, garantizando persistencia.

## 5. Próximos Pasos (Pendientes para Producción)
1. ~~**Migrar Base de Datos:** Reemplazar SQLite por una base de datos escalable en la nube (ej. PostgreSQL en Supabase o Vercel Postgres) para permitir escritura de nuevos datos sin perderlos por el entorno *Serverless*.~~ *(¡COMPLETADO!)*
2. **Implementar Motor IA Real:** Conectar el chat de IA Asistente con la API de OpenAI/Anthropic y conectar una base de datos vectorial para RAG (Recuperación Aumentada por Generación) de leyes colombianas.
3. **Gestor de Archivos S3:** Configurar AWS S3 o Vercel Blob para la subida de PDFs y resoluciones ambientales.
