# Sysdatec — Gestión de tickets con IA

Prueba técnica para **Sysdatec Corp**: sistema ligero de gestión de tickets operativos con clasificación automática mediante OpenAI. Los usuarios crean solicitudes, la IA asigna categoría, prioridad y resumen, y el equipo hace seguimiento desde un panel central.

---

## Requisitos previos

- [Docker](https://www.docker.com/products/docker-desktop/) instalado y en ejecución
- Cuenta de [OpenAI](https://platform.openai.com/) con API key válida (para la clasificación por IA)

---

## Configuración e inicio rápido

El evaluador puede levantar el proyecto desde cero con:

```bash
# 1. Clonar el repositorio
git clone https://github.com/landazuricode/sysdatec-technical-test.git
cd sysdatec-technical-test

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env y agregar tu OPENAI_API_KEY

# 3. Levantar PostgreSQL + aplicación
docker compose up --build
```

La aplicación queda disponible en **http://localhost:3000**.

Al arrancar, el contenedor ejecuta automáticamente las migraciones de Prisma (`prisma migrate deploy`) antes de iniciar el servidor.

### Variables de entorno (`.env.example`)

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `DATABASE_URL` | URL de conexión PostgreSQL | Sí |
| `OPENAI_API_KEY` | API key de OpenAI para clasificación | Sí (para IA) |
| `OPENAI_MODEL` | Modelo a usar (default: `gpt-4o-mini`) | No |

Con Docker Compose, `DATABASE_URL` se configura automáticamente en el servicio `app`. Solo necesitas definir `OPENAI_API_KEY` en tu archivo `.env` local.

---

## Funcionalidades implementadas

| Requisito | Implementación |
|-----------|----------------|
| Creación de tickets | Formulario en `/tickets/new` con nombre del cliente, texto de solicitud y URL de adjunto opcional |
| Clasificación por IA | OpenAI Chat Completions: categoría, prioridad y resumen breve al crear el ticket |
| Panel de control | Listado en `/` con estado, categoría, prioridad y fecha de creación |
| Detalle del ticket | Actualizar estado, asignar responsable y agregar comentarios en `/tickets/:id` |
| Reportes y métricas | Panel en `/reports` con KPIs y gráficos (Recharts): tendencia mensual, distribución por estado, categoría, prioridad, clasificación IA y carga por responsable |
| Copiloto IA | Chat conversacional con streaming y *function calling* en `/chat` |

**Categorías:** Finanzas, Legal, Compras, Operaciones  
**Prioridades:** Alta, Media, Baja  
**Estados operativos:** Abierto, En progreso, Resuelto, Cerrado

---

## Copiloto IA (chat con streaming)

En `/chat` hay un asistente conversacional tipo ChatGPT que opera el sistema con lenguaje natural. No es un chatbot decorativo: usa *function calling* para ejecutar acciones reales sobre los tickets reutilizando la capa de datos del proyecto.

**Capacidades (herramientas que la IA puede invocar):**

| Herramienta | Acción |
|-------------|--------|
| `search_tickets` | Buscar y listar tickets con filtros (estado, prioridad, categoría, texto) |
| `get_ticket` | Ver el detalle de un ticket por su número (`#12`) |
| `get_stats` | Estadísticas globales por estado, prioridad y categoría |
| `get_workload` | Carga de trabajo por responsable |
| `list_assignees` | Listar responsables registrados |
| `create_ticket` | Crear un ticket (con clasificación IA automática) |
| `update_ticket_status` | Cambiar el estado de un ticket |
| `assign_ticket` | Asignar o reasignar un responsable |
| `add_comment` | Agregar un comentario |

**Características técnicas:**

- **Streaming token a token** vía Server-Sent Events sobre la resource route `app/routes/api/chat.ts`.
- **Loop de agente** en `app/services/chat-agent/`: la IA decide qué herramienta llamar, se ejecuta en el servidor, el resultado vuelve al modelo y este continúa hasta dar la respuesta final.
- **Tarjetas de resultado** en el chat (tickets, tablas de carga, métricas) en lugar de solo texto.
- **Conversaciones persistidas** en PostgreSQL (`Conversation` / `Message`), reabribles desde la lista lateral.

**Ejemplos de uso:**

- "¿Cuántos tickets de prioridad ALTA siguen abiertos?"
- "Crea un ticket para Acme S.A.: no pueden generar la factura del mes."
- "Asigna el ticket #12 a María y márcalo como en progreso."
- "¿Cómo está repartida la carga entre los responsables?"

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
         │   app/data/    │          │ services/ticket- │          │   PostgreSQL 16  │
         │ tickets,       │          │ classifier       │          │   (Prisma ORM)   │
         │ comments       │          │ (OpenAI API)     │          │                  │
         └────────────────┘          └─────────────────┘          └──────────────────┘
```

### Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend + SSR | React 19, React Router 8, Tailwind CSS 4 |
| Base de datos | PostgreSQL 16, Prisma 7 |
| IA | OpenAI Chat Completions API (`gpt-4o-mini` por defecto) |
| Infraestructura | Docker, Docker Compose |

---