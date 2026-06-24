# Sysdatec — Gestión de tickets con IA

Sistema ligero de gestión de tickets operativos con clasificación automática mediante OpenAI. Los usuarios crean solicitudes, la IA asigna categoría, prioridad y resumen, y el equipo hace seguimiento desde un panel central.

## Características

- **Creación de tickets** con nombre del cliente, texto de solicitud y URL de adjunto opcional
- **Clasificación por IA** (OpenAI): categoría, prioridad y resumen breve
- **Panel de control** con listado, estadísticas y búsqueda
- **Detalle del ticket**: actualizar estado, asignar responsable y agregar comentarios
- **Reintento de clasificación** si la IA falla o no hay API key configurada

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend + SSR | React 19, React Router 8, Tailwind CSS 4 |
| Base de datos | PostgreSQL 16, Prisma 7 |
| IA | OpenAI Chat Completions API (`gpt-4o-mini` por defecto) |
| Infraestructura | Docker, Docker Compose |

## Requisitos previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (recomendado para la demo completa)
- Cuenta de [OpenAI](https://platform.openai.com/) con API key válida (para clasificación IA)
- Opcional para desarrollo local sin Docker en la app: Node.js 20+

---

## Inicio rápido (Docker)

La forma recomendada de ejecutar el proyecto desde cero:

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd sysdatec-technical-test

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env y agregar tu OPENAI_API_KEY

# 3. Levantar PostgreSQL + aplicación
docker compose up --build
```

La aplicación queda disponible en **http://localhost:3000**.

Al arrancar, el contenedor de la app ejecuta automáticamente `prisma migrate deploy` antes de iniciar el servidor.

### Variables de entorno

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `DATABASE_URL` | URL de conexión PostgreSQL | Sí |
| `OPENAI_API_KEY` | API key de OpenAI para clasificación | Sí (para IA) |
| `OPENAI_MODEL` | Modelo a usar (default: `gpt-4o-mini`) | No |

Con Docker Compose, `DATABASE_URL` se configura automáticamente en el servicio `app`. Solo necesitas definir `OPENAI_API_KEY` en tu archivo `.env` local (Docker Compose la inyecta al contenedor).

---

## Desarrollo local (sin reconstruir la imagen)

Útil para iterar rápido en el código:

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar y configurar entorno
cp .env.example .env

# 3. Levantar solo PostgreSQL
docker compose up db -d

# 4. Aplicar migraciones
npm run db:migrate

# 5. Iniciar servidor de desarrollo
npm run dev
```

La app en desarrollo corre en **http://localhost:5173**.

### Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Build de producción |
| `npm run start` | Servir build de producción |
| `npm run typecheck` | Verificación de tipos |
| `npm run db:migrate` | Crear/aplicar migraciones (desarrollo) |
| `npm run db:migrate:deploy` | Aplicar migraciones (producción) |
| `npm run db:studio` | Abrir Prisma Studio |

---

## Arquitectura

```
┌─────────────┐     loaders/actions      ┌──────────────────┐
│   Browser   │ ◄──────────────────────► │  React Router 8  │
│  (React UI) │                          │   (SSR + API)    │
└─────────────┘                          └────────┬─────────┘
                                                  │
                    ┌─────────────────────────────┼─────────────────────────────┐
                    │                             │                             │
                    ▼                             ▼                             ▼
           ┌────────────────┐          ┌─────────────────┐          ┌──────────────────┐
           │   app/data/    │          │ services/ticket- │          │   PostgreSQL     │
           │ tickets,       │          │ classifier       │          │   (Prisma ORM)   │
           │ comments       │          │ (OpenAI API)     │          │                  │
           └────────────────┘          └─────────────────┘          └──────────────────┘
```

### Estructura del proyecto

```
app/
├── components/       # UI (dashboard, layout, badges)
├── config/           # Constantes, labels, config de IA
├── data/             # Acceso a base de datos (Prisma + try/catch)
│   ├── database.ts   # Cliente Prisma con adapter PostgreSQL
│   ├── tickets.ts    # CRUD, clasificación IA y persistencia
│   └── comments.ts   # Comentarios
├── layouts/          # AppLayout (sidebar + topbar)
├── routes/           # Rutas con loaders y actions
│   ├── home.tsx              # Panel de control
│   ├── tickets.new.tsx       # Crear ticket
│   └── tickets.$ticketId.tsx # Detalle y gestión
├── services/
│   └── ticket-classifier/  # Integración OpenAI (sin acceso directo a DB)
│       ├── classify.ts     # classifyTicket()
│       └── prompt.ts       # Prompt del clasificador
└── types/
    └── schema.ts       # Tipos de dominio (enums, modelos)
prisma/
├── schema.prisma     # Modelos Ticket y Comment
└── migrations/       # Migraciones SQL
docker/
└── entrypoint.sh     # Migraciones + arranque en producción
```

### Capas y responsabilidades

- **`app/data/`** — Interacción con PostgreSQL y operaciones de dominio del ticket (incluye `classifyTicketWithAi`). Cada función devuelve `Result<T>` (`ok` / `error` / `code`).
- **`app/services/ticket-classifier/`** — Llamadas a OpenAI. No escribe en la base de datos directamente.
- **`app/routes/`** — Orquestan loaders (lectura) y actions (escritura). Manejan errores HTTP (404, 500) y respuestas de formulario.

---

## Flujo de datos: creación y clasificación IA

```
Usuario completa formulario
        │
        ▼
action en /tickets/new
        │
        ├──► createTicket()          → INSERT en PostgreSQL (estado: PENDIENTE)
        │
        └──► classifyTicketWithAi()
                    │
                    ├──► classifyTicket()  → POST a OpenAI (JSON: categoría, prioridad, resumen)
                    │
                    ├──► Éxito  → saveTicketClassification()   → COMPLETADA
                    └──► Fallo  → markTicketClassificationFailed() → FALLIDA
        │
        ▼
Redirect a /tickets/:id
```

### Categorías y prioridades

**Categorías:** Finanzas, Legal, Compras, Operaciones

**Prioridades:** Alta, Media, Baja

La IA recibe el nombre del cliente y el texto de la solicitud, y devuelve un JSON estructurado que se valida contra los enums de Prisma antes de persistirse.

Si `OPENAI_API_KEY` no está configurada o la API falla, el ticket **se crea igualmente** con `classificationStatus: FALLIDA`. Desde el detalle se puede usar **Reintentar clasificación IA**.

---

## Guía de demostración

Checklist para la sesión de revisión:

- [ ] Clonar el repo en una máquina limpia
- [ ] Copiar `.env.example` → `.env` y configurar `OPENAI_API_KEY`
- [ ] Ejecutar `docker compose up --build`
- [ ] Abrir http://localhost:3000
- [ ] Crear un ticket (ej: cliente *Acme Corp*, solicitud sobre una factura pendiente)
- [ ] Verificar en el detalle: categoría **Finanzas**, prioridad y resumen generados por IA
- [ ] Actualizar estado del ticket (ej: En progreso)
- [ ] Asignar un responsable
- [ ] Agregar un comentario
- [ ] Mostrar el ticket en el panel principal
- [ ] Opcional: verificar en PostgreSQL con `npm run db:studio` o `docker compose exec db psql -U sysdatec -d tickets -c "SELECT * FROM \"Ticket\";"`

### Ejemplos de solicitudes para probar la IA

| Solicitud | Categoría esperada |
|-----------|-------------------|
| "Aprobar el pago de la factura #4521 del proveedor X" | Finanzas |
| "Revisar cláusula de confidencialidad del contrato con el cliente Y" | Legal |
| "Cotizar 50 laptops para el equipo de ventas" | Compras |
| "El servidor de producción está caído desde las 8am" | Operaciones |

---

## Modelo de datos

**Ticket:** cliente, solicitud, adjunto opcional, categoría, prioridad, resumen IA, estado de clasificación, estado operativo, responsable, timestamps.

**Comment:** contenido, autor opcional, vinculado a un ticket.

Estados operativos: Abierto, En progreso, Resuelto, Cerrado.

---

## Licencia

Proyecto de prueba técnica para Sysdatec Corp.
