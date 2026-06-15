# ERFOR — Plataforma Integral de Asesoría Ambiental

Aplicación full-stack para gestión empresarial de clientes, proyectos, predios, expedientes, trámites, obligaciones, requerimientos, visitas, documentos, alertas, reportes e IA ambiental.

## Stack

- Next.js 15 App Router, React, TypeScript y Tailwind CSS.
- Prisma ORM con SQLite local por defecto y PostgreSQL/PostGIS listo vía Docker Compose.
- API Routes REST, JWT, RBAC, carga de archivos, reportes PDF/Excel, automatizaciones y asistente IA contextual.

## Inicio rápido

```bash
cp .env.example .env
npm install
npm run prisma:push
npm run prisma:seed
npm run dev
```

Abrir `http://localhost:5173`.

Credenciales iniciales:

- Email: `erwin@erfor.co`
- Password: `Erfor2026!`

## Producción con PostgreSQL

1. Ejecuta `docker compose up -d postgres redis`.
2. Cambia `DATABASE_URL` en `.env` a una URL PostgreSQL, por ejemplo:
   `postgresql://erfor:erfor@localhost:5432/erfor?schema=public`
3. Cambia el provider de Prisma a `postgresql` si vas a migrar formalmente a Postgres.
4. Ejecuta `npm run prisma:migrate && npm run build`.

## Módulos incluidos

- Dashboard gerencial con KPIs calculados desde base de datos.
- CRUD REST y UI para clientes, proyectos, predios, expedientes, trámites, obligaciones, requerimientos, visitas, documentos, tareas, alertas, reportes, normas y configuración.
- Flujo funcional: crear cliente, proyecto, predio, expediente, trámite CAR, subir requerimiento PDF, extracción básica, tarea/alerta automática, resumen IA, borrador de respuesta y reporte PDF guardado como documento.
- Buscador global multi-entidad.
- Constructor de reportes PDF/Excel.
- Importador Excel con detección de hojas, columnas, validación y resumen.
- Arquitectura para Google Sheets, correo, WhatsApp, S3/MinIO y RAG documental.

## Notas de IA

Si `OPENAI_API_KEY` está configurado, el asistente usa el modelo definido en `OPENAI_MODEL`. Sin clave, opera en modo local contextual: resume documentos cargados, identifica vencimientos, sugiere acciones y genera borradores marcados para validación profesional.

El asistente no reemplaza criterio jurídico ni técnico humano. Las respuestas se consideran borradores y deben ser revisadas por ERFOR.
